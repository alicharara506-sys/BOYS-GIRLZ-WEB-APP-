import { finalPrice } from "../../domain/pricing";
import { Prisma } from "@prisma/client";
import { db } from "./db.server";
import {
  allocate,
  CommerceError,
  defaults,
  saleSchema,
  type SaleInput,
  type Settings,
} from "./rules";
import { cashEvent, journal, paymentAccount, type Tx } from "./ledger.server";

export async function atomic<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 20000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 3
      )
        continue;
      throw error;
    }
  }
  throw new CommerceError("Please try again.");
}
export async function settings(tx: Tx = db): Promise<Settings> {
  const record = await tx.setting.findUnique({ where: { key: "shop" } });
  return { ...defaults, ...((record?.value as Partial<Settings>) || {}) };
}
export const fullOrder = {
  items: true,
  payments: true,
  returns: { include: { lines: true } },
  customer: { include: { children: true } },
} as const;

export async function createSale(raw: SaleInput) {
  return atomic((tx) => sell(tx, raw));
}
export async function sell(tx: Tx, raw: SaleInput) {
  const input = saleSchema.parse(raw);
  const existing = await tx.order.findUnique({
    where: { requestKey: input.requestKey },
    include: fullOrder,
  });
  if (existing) return existing;
  const config = await settings(tx);
  if (
    new Set(
      input.items.filter((i) => i.variantId).map((item) => item.variantId),
    ).size !== input.items.filter((i) => i.variantId).length
  )
    throw new CommerceError("Combine duplicate variants into one cart line.");
  const variants = await tx.variant.findMany({
    where: {
      id: {
        in: input.items.flatMap((item) =>
          item.variantId ? [item.variantId] : [],
        ),
      },
      active: true,
    },
    include: { product: true },
  });
  const lines = input.items.map((item) => {
    if (!item.variantId) {
      if (input.channel !== "pos" || !item.name || item.price === undefined)
        throw new CommerceError(
          "Enter a name and price for this unlisted item.",
        );
      if (item.discount > item.price * item.quantity)
        throw new CommerceError("Line discount exceeds the item value.");
      return {
        variantId: null,
        productId: null,
        isQuickSale: true,
        name: item.name,
        category: item.category || "Unlisted",
        sku: "",
        size: "",
        color: "",
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
        net: item.price * item.quantity - item.discount,
        unitCost: item.cost ?? null,
      };
    }
    const variant = variants.find((v) => v.id === item.variantId);
    if (
      !variant ||
      variant.product.archived ||
      (input.channel === "online" &&
        variant.product.visibility !== "website_and_pos")
    )
      throw new CommerceError("One of these products is unavailable.");
    const price = finalPrice(
      input.channel === "online"
        ? variant.product.onlinePrice
        : variant.product.price,
      variant.product,
    );
    if (item.discount > price * item.quantity)
      throw new CommerceError("A line discount cannot exceed the line value.");
    return {
      variantId: variant.id,
      productId: variant.productId,
      isQuickSale: false,
      name: variant.product.name,
      category: variant.product.category,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: item.quantity,
      unitPrice: price,
      discount: item.discount,
      net: price * item.quantity - item.discount,
      unitCost: variant.product.cost,
    };
  });
  const subtotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
  const afterLines = lines.reduce((sum, line) => sum + line.net, 0);
  if (input.discountType === "percent" && input.discount > 100)
    throw new CommerceError("Percentage discounts must be between 0 and 100.");
  let whole =
    input.discountType === "percent"
      ? Math.round((afterLines * input.discount) / 100)
      : input.discount;
  let promoCode = "";
  if (input.promoCode) {
    const promo = await tx.promo.findUnique({
      where: { code: input.promoCode.toUpperCase() },
    });
    if (
      !promo ||
      !promo.active ||
      (promo.expiresAt && promo.expiresAt < new Date()) ||
      (promo.limit && promo.used >= promo.limit) ||
      afterLines < promo.minimum
    )
      throw new CommerceError(
        "This promotion is unavailable or its minimum was not reached.",
      );
    whole +=
      promo.kind === "percent"
        ? Math.round((afterLines * promo.amount) / 100)
        : promo.amount;
    promoCode = promo.code;
    await tx.promo.update({
      where: { code: promo.code },
      data: { used: { increment: 1 } },
    });
  }
  const customer = input.customerId
    ? await tx.customer.findUnique({ where: { id: input.customerId } })
    : null;
  if (input.customerId && !customer)
    throw new CommerceError("Customer not found.");
  if (input.pointsUsed && (!customer || customer.points < input.pointsUsed))
    throw new CommerceError(
      "This customer does not have enough loyalty points.",
    );
  const loyaltyValue = input.pointsUsed * config.pointValue;
  whole += loyaltyValue;
  if (whole > afterLines)
    throw new CommerceError(
      "Discounts and loyalty redemption cannot exceed the item subtotal.",
    );
  const spread = allocate(
    whole,
    lines.map((line) => line.net),
  );
  lines.forEach((line, index) => {
    line.discount += spread[index];
    line.net -= spread[index];
  });
  const net = afterLines - whole;
  const shipping =
    input.channel === "online"
      ? (input.shipping ?? (net >= config.freeShipping ? 0 : config.shipping))
      : 0;
  // Owner confirmed no tax. The tax account is retained for a future tax configuration.
  const total = net + shipping;
  const cost = lines.reduce(
    (sum, line) => sum + line.quantity * (line.unitCost || 0),
    0,
  );
  if (
    !Number.isSafeInteger(total) ||
    total > 2_000_000_000 ||
    cost > 2_000_000_000
  )
    throw new CommerceError(
      "This sale exceeds the supported total. Split it into smaller sales.",
    );
  const paid = input.payments.reduce((sum, payment) => sum + payment.amount, 0);
  if ((input.channel === "pos" && paid !== total) || paid > total)
    throw new CommerceError(
      `Payments must add up to the total ($${(total / 100).toFixed(2)}).`,
    );
  const cash = input.payments
    .filter((p) => p.method === "cash")
    .reduce((sum, p) => sum + p.amount, 0);
  if (cash > input.cashTendered)
    throw new CommerceError("Cash tendered is less than the cash payment.");
  const drawer = cash ? await cashEvent(tx, 0, "Sale", true) : null;
  const credit = input.payments
    .filter((p) => p.method === "credit")
    .reduce((sum, p) => sum + p.amount, 0);
  if (credit && (!customer || customer.credit < credit))
    throw new CommerceError("Not enough store credit.");
  for (const payment of input.payments.filter((p) => p.method === "gift")) {
    const gift = await tx.giftCard.updateMany({
      where: {
        code: payment.reference.toUpperCase(),
        active: true,
        balance: { gte: payment.amount },
      },
      data: { balance: { decrement: payment.amount } },
    });
    if (!gift.count)
      throw new CommerceError(
        "Gift card is invalid or has insufficient balance.",
      );
  }
  const pointsEarned = customer
    ? Math.floor((net / 100) * config.pointsPerDollar)
    : 0;
  const order = await tx.order.create({
    data: {
      requestKey: input.requestKey,
      paymentMethod:input.payments.length>1?"split":input.payments[0]?.method||input.paymentMethod||(input.channel==="online"?"cash_on_delivery":"cash"),
      shopId:variants[0]?.product.shopId,
      channel: input.channel,
      status:
        paid === total
          ? input.channel === "pos"
            ? "completed"
            : "paid"
          : "pending",
      customerId: customer?.id,
      customerName: customer?.name || input.customerName,
      phone: input.phone || customer?.phone || "",
      address: input.address || customer?.address || "",
      subtotal,
      discount: subtotal - net,
      shipping,
      total,
      cost,
      pointsUsed: input.pointsUsed,
      loyaltyValue,
      pointsEarned,
      promoCode,
      note: input.note,
      demo: input.demo || config.demo,
      items: { create: lines },
      payments: {
        create: input.payments
          .filter((p) => p.amount > 0)
          .map((p) => ({
            ...p,
            drawerId: p.method === "cash" ? drawer?.id : null,
          })),
      },
    },
    include: fullOrder,
  });
  for (const line of lines) {
    if (!line.variantId) continue;
    const changed = await tx.variant.updateMany({
      where: { id: line.variantId },
      data: { stock: { decrement: line.quantity } },
    });
    if (!changed.count)
      throw new CommerceError(
        "Stock changed while checking out. Please review the cart.",
      );
    await tx.stockMovement.create({
      data: {
        variantId: line.variantId,
        quantity: -line.quantity,
        reason: `${input.channel} sale`,
        reference: order.id,
      },
    });
  }
  if (customer) {
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        credit: { decrement: credit },
        points: { increment: pointsEarned - input.pointsUsed },
      },
    });
    await tx.loyaltyEntry.create({
      data: {
        customerId: customer.id,
        points: pointsEarned - input.pointsUsed,
        credit: -credit,
        reason: `Sale BG-${order.number}`,
      },
    });
  }
  await journal(
    tx,
    `sale:${order.id}`,
    `BG-${order.number} · ${input.channel}`,
    [
      ...input.payments.map((p) => ({
        accountId: paymentAccount(p.method),
        debit: p.amount,
      })),
      { accountId: "1100", debit: total - paid },
      { accountId: input.channel === "pos" ? "4000" : "4010", credit: net },
      { accountId: "4020", credit: shipping },
      { accountId: "5000", debit: cost },
      { accountId: "1200", credit: cost },
    ],
  );
  return order;
}

export async function updateOnlineOrder(
  id: string,
  status: string,
  tracking: string,
  carrier: string,
  method: string,
) {
  return atomic(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: fullOrder,
    });
    if (!order || order.channel !== "online")
      throw new CommerceError("Online order not found.");
    const allowed: Record<string, string[]> = {
      pending: ["paid", "cancelled"],
      paid: ["packed", "cancelled"],
      packed: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
      returned: [],
    };
    // COD can progress through fulfillment before collecting money at delivery.
    if (order.status === "pending" && status === "packed")
      allowed.pending.push("packed");
    if (
      !(allowed[order.status] || []).includes(status) &&
      status !== order.status
    )
      throw new CommerceError("This order cannot move to that status.");
    const paid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    if ((status === "paid" || status === "delivered") && paid < order.total) {
      if (!["cash", "whish"].includes(method))
        throw new CommerceError("Choose the collected payment method.");
      const amount = order.total - paid;
      const drawer =
        method === "cash"
          ? await cashEvent(tx, 0, "COD collection", true)
          : null;
      await tx.payment.create({
        data: {
          orderId: id,
          method,
          amount,
          reference: "Owner confirmed collection",
          drawerId: drawer?.id,
        },
      });
      await journal(tx, `collection:${id}`, `Collection BG-${order.number}`, [
        { accountId: paymentAccount(method), debit: amount },
        { accountId: "1100", credit: amount },
      ]);
    }
    if (status === "cancelled") {
      if (order.returns.length)
        throw new CommerceError("An order with returns cannot be cancelled.");
      for (const line of order.items) {
        if (!line.variantId) continue;
        const variant = await tx.variant.findUniqueOrThrow({
          where: { id: line.variantId },
        });
        const averageCost =
          variant.stock <= 0
            ? line.unitCost || 0
            : Math.round(
                (variant.stock * variant.averageCost +
                  line.quantity * (line.unitCost || 0)) /
                  (variant.stock + line.quantity),
              );
        await tx.variant.update({
          where: { id: line.variantId },
          data: { stock: { increment: line.quantity }, averageCost },
        });
        await tx.stockMovement.create({
          data: {
            variantId: line.variantId,
            quantity: line.quantity,
            reason: "Cancelled order",
            reference: id,
          },
        });
      }
      for (const payment of order.payments) {
        if (payment.method === "cash")
          await cashEvent(
            tx,
            -payment.amount,
            `Refund BG-${order.number}`,
            true,
          );
        if (payment.method === "credit" && order.customerId)
          await tx.customer.update({
            where: { id: order.customerId },
            data: { credit: { increment: payment.amount } },
          });
        if (payment.method === "gift")
          await tx.giftCard.update({
            where: { code: payment.reference.toUpperCase() },
            data: { balance: { increment: payment.amount } },
          });
      }
      await journal(tx, `cancel:${id}`, `Cancel BG-${order.number}`, [
        { accountId: "4010", debit: order.total - order.shipping },
        { accountId: "4020", debit: order.shipping },
        { accountId: "1100", credit: order.total - paid },
        ...order.payments.map((p) => ({
          accountId: paymentAccount(p.method),
          credit: p.amount,
        })),
        { accountId: "1200", debit: order.cost },
        { accountId: "5000", credit: order.cost },
      ]);
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            points: { increment: order.pointsUsed - order.pointsEarned },
          },
        });
        await tx.loyaltyEntry.create({
          data: {
            customerId: order.customerId,
            points: order.pointsUsed - order.pointsEarned,
            reason: `Cancelled BG-${order.number}`,
          },
        });
      }
      if (order.promoCode)
        await tx.promo.update({
          where: { code: order.promoCode },
          data: { used: { decrement: 1 } },
        });
    }
    return tx.order.update({
      where: { id },
      data: { status, tracking, carrier },
    });
  });
}

export async function returnItems(
  tx: Tx,
  input: {
    requestKey?: string;
    orderId: string;
    items: { lineId: string; quantity: number; restock: boolean }[];
    method: string;
    reason: string;
  },
) {
  const order = await tx.order.findUnique({
    where: { id: input.orderId },
    include: fullOrder,
  });
  if (!order || !["completed", "delivered"].includes(order.status))
    throw new CommerceError("Returns require a completed or delivered sale.");
  if (
    !input.items.length ||
    new Set(input.items.map((i) => i.lineId)).size !== input.items.length
  )
    throw new CommerceError("Choose distinct return lines.");
  if (!["cash", "whish", "credit"].includes(input.method))
    throw new CommerceError("Choose a refund method.");
  if (input.method === "credit" && !order.customerId)
    throw new CommerceError("Store credit requires a named customer.");
  const config = await settings(tx);
  if (+new Date() - +order.createdAt > config.returnDays * 86400000)
    throw new CommerceError(
      `This sale is outside the configured ${config.returnDays}-day return window.`,
    );
  const lines = input.items.map((item) => {
    const line = order.items.find((l) => l.id === item.lineId);
    if (
      !line ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > line.quantity - line.returned
    )
      throw new CommerceError("Invalid return quantity.");
    // Difference of cumulative fractions preserves every cent across partial returns.
    const amount =
      Math.floor((line.net * (line.returned + item.quantity)) / line.quantity) -
      Math.floor((line.net * line.returned) / line.quantity);
    return { ...item, amount, line };
  });
  const amount = lines.reduce((sum, l) => sum + l.amount, 0);
  const priorNet = order.items.reduce(
    (sum, l) => sum + Math.floor((l.net * l.returned) / l.quantity),
    0,
  );
  const allNet = order.items.reduce((sum, l) => sum + l.net, 0);
  const oldEarned = Math.floor(
    (order.pointsEarned * priorNet) / Math.max(allNet, 1),
  );
  const newEarned = Math.floor(
    (order.pointsEarned * (priorNet + amount)) / Math.max(allNet, 1),
  );
  const restoredPoints =
    Math.floor((order.pointsUsed * (priorNet + amount)) / Math.max(allNet, 1)) -
    Math.floor((order.pointsUsed * priorNet) / Math.max(allNet, 1));
  const result = await tx.return.create({
    data: {
      requestKey: input.requestKey,
      orderId: order.id,
      reason: input.reason,
      amount,
      method: input.method,
      lines: {
        create: lines.map((l) => ({
          lineId: l.lineId,
          quantity: l.quantity,
          amount: l.amount,
          restock: l.restock,
        })),
      },
    },
  });
  let restockCost = 0;
  for (const item of lines) {
    await tx.orderLine.update({
      where: { id: item.lineId },
      data: { returned: { increment: item.quantity } },
    });
    if (item.restock && item.line.variantId) {
      const variant = await tx.variant.findUniqueOrThrow({
        where: { id: item.line.variantId },
      });
      const averageCost = variant.stock<=0 ? (item.line.unitCost||0) : Math.round(
        (variant.stock * variant.averageCost +
          item.quantity * (item.line.unitCost || 0)) /
          (variant.stock + item.quantity),
      );
      await tx.variant.update({
        where: { id: item.line.variantId },
        data: { stock: { increment: item.quantity }, averageCost },
      });
      await tx.stockMovement.create({
        data: {
          variantId: item.line.variantId,
          quantity: item.quantity,
          reason: "Return",
          reference: result.id,
        },
      });
      restockCost += (item.line.unitCost || 0) * item.quantity;
    }
  }
  if (input.method === "cash")
    await cashEvent(tx, -amount, `Return BG-${order.number}`, true);
  if (order.customerId) {
    await tx.customer.update({
      where: { id: order.customerId },
      data: {
        credit: { increment: input.method === "credit" ? amount : 0 },
        points: { increment: restoredPoints - (newEarned - oldEarned) },
      },
    });
    await tx.loyaltyEntry.create({
      data: {
        customerId: order.customerId,
        points: restoredPoints - (newEarned - oldEarned),
        credit: input.method === "credit" ? amount : 0,
        reason: `Return BG-${order.number}`,
      },
    });
  }
  await journal(tx, `return:${result.id}`, `Return BG-${order.number}`, [
    { accountId: "4090", debit: amount },
    { accountId: paymentAccount(input.method), credit: amount },
    { accountId: "1200", debit: restockCost },
    { accountId: "5000", credit: restockCost },
  ]);
  if (
    order.items.every(
      (line) =>
        line.returned +
          (lines.find((l) => l.lineId === line.id)?.quantity || 0) ===
        line.quantity,
    )
  )
    await tx.order.update({
      where: { id: order.id },
      data: { status: "returned" },
    });
  return result;
}
