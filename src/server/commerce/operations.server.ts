import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db.server";
import { cents, CommerceError, requiredText, text } from "./rules";
import {
  atomic,
  createSale,
  returnItems,
  sell,
  settings,
  updateOnlineOrder,
} from "./sales.server";
import { cashEvent, journal, paymentAccount } from "./ledger.server";

const id = requiredText;
const productInput = z.object({
  id: text.optional(),
  name: requiredText.max(150),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: text,
  category: requiredText,
  shopId: requiredText,
  categoryId: requiredText,
  visibility: z.enum(["website_and_pos", "pos_only"]),
  discountType: z.enum(["percentage", "amount"]).nullable().optional(),
  discountValue: cents.default(0),
  gender: z.enum(["Boys", "Girls", "Unisex"]),
  brand: requiredText,
  season: requiredText,
  imageUrl: z
    .string()
    .max(1000)
    .refine(
      (v) =>
        !v ||
        /^\/assets\/[a-zA-Z0-9_./-]+$/.test(v) ||
        /^\/media\/[a-f0-9-]+\.(png|jpg|gif|webp)$/.test(v) ||
        /^https:\/\//.test(v),
      "Use an HTTPS image or a local upload.",
    ),
  imageIndex: z.coerce.number().int().min(0).max(11).default(0),
  price: cents,
  onlinePrice: cents,
  cost: cents,
  threshold: z.coerce.number().int().min(0).max(10000),
  published: z.boolean().optional(),
  featured: z.boolean(),

  sizes: z.array(requiredText.max(40)).min(1).max(30),
  colors: z.array(requiredText.max(40)).min(1).max(20),
});
export async function saveCommerceProduct(raw: unknown) {
  const input = productInput.parse(raw);
  return atomic(async (tx) => {
    const prior = input.id
      ? await tx.product.findUnique({
          where: { id: input.id },
          include: { variants: true },
        })
      : null;
    if (input.id && !prior) throw new CommerceError("Product not found.");
    if (prior && input.slug !== prior.slug)
      throw new CommerceError("The product URL cannot change after creation.");
    const { id: productId, sizes, colors, ...data } = input;
    if (input.discountType === "percentage" && input.discountValue > 100)
      throw new CommerceError("Percentage must be between 0 and 100.");
    if (
      !(await tx.category.findFirst({
        where: { id: input.categoryId, shopId: input.shopId },
      }))
    )
      throw new CommerceError("Choose a category belonging to this shop.");
    data.published = input.visibility === "website_and_pos";
    if (
      new Set(sizes).size !== sizes.length ||
      new Set(colors).size !== colors.length
    )
      throw new CommerceError("Sizes and colors cannot contain duplicates.");
    const removed =
      prior?.variants.filter(
        (v) =>
          v.active && (!sizes.includes(v.size) || !colors.includes(v.color)),
      ) || [];
    if (removed.some((v) => v.stock !== 0))
      throw new CommerceError(
        "Zero the stock before removing a size or color.",
      );
    if (
      removed.length &&
      (await tx.orderLine.count({
        where: {
          variantId: { in: removed.map((v) => v.id) },
          order: { status: { in: ["pending", "paid", "packed", "shipped"] } },
        },
      }))
    )
      throw new CommerceError("An open order uses a variant you are removing.");
    const product = productId
      ? await tx.product.update({ where: { id: productId }, data })
      : await tx.product.create({ data });
    await tx.variant.updateMany({
      where: { productId: product.id },
      data: { active: false },
    });
    const existingIds: string[] = [];
    const additions: {
      productId: string;
      size: string;
      color: string;
      sku: string;
      barcode: string;
      averageCost: number;
    }[] = [];
    for (const size of sizes)
      for (const color of colors) {
        const old = prior?.variants.find(
          (v) => v.size === size && v.color === color,
        );
        if (old) existingIds.push(old.id);
        else {
          const code = `BG${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
          additions.push({
            productId: product.id,
            size,
            color,
            sku: code,
            barcode: code,
            averageCost: input.cost,
          });
        }
      }
    if (existingIds.length)
      await tx.variant.updateMany({
        where: { id: { in: existingIds } },
        data: { active: true },
      });
    if (additions.length) await tx.variant.createMany({ data: additions });
    return product;
  });
}

const customerInput = z.object({
  id: text.optional(),
  name: requiredText.max(150),
  phone: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v.replace(/[\s().-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{6,15}$/, "Use a valid phone number.")),
  email: z.union([z.email(), z.literal("")]),
  address: text,
  tags: z.array(text).max(20),
  consentWhatsapp: z.boolean().default(false),
  children: z
    .array(
      z.object({
        name: requiredText,
        birthdate: z.iso.date(),
        gender: z.enum(["Boys", "Girls", "Unisex"]),
        size: requiredText,
      }),
    )
    .max(20),
});
export async function saveCustomer(raw: unknown) {
  const input = customerInput.parse(raw);
  return atomic(async (tx) => {
    const { id: customerId, children, ...data } = input;
    if (children.some((c) => new Date(c.birthdate) > new Date()))
      throw new CommerceError("A child's birthdate cannot be in the future.");
    const customer = customerId
      ? await tx.customer.update({ where: { id: customerId }, data })
      : await tx.customer.create({ data });
    await tx.child.deleteMany({ where: { customerId: customer.id } });
    await tx.child.createMany({
      data: children.map((c) => ({
        ...c,
        birthdate: new Date(c.birthdate),
        customerId: customer.id,
      })),
    });
    return customer;
  });
}

export async function runCommand(intent: string, raw: unknown) {
  if (intent === "sale")
    return createSale(raw as Parameters<typeof createSale>[0]);
  if (intent === "product") return saveCommerceProduct(raw);
  if (intent === "customer") return saveCustomer(raw);
  if (intent === "variant-identifiers") {
    const input = z
      .object({
        id,
        sku: z
          .string()
          .trim()
          .regex(/^[A-Za-z0-9_-]{2,60}$/),
        barcode: z
          .string()
          .trim()
          .regex(/^[A-Za-z0-9_-]{2,60}$/),
      })
      .parse(raw);
    return db.variant.update({
      where: { id: input.id },
      data: { sku: input.sku, barcode: input.barcode },
    });
  }
  if (intent === "archive") {
    const input = z.object({ id, archived: z.boolean() }).parse(raw);
    return db.product.update({
      where: { id: input.id },
      data: { archived: input.archived, published: false },
    });
  }
  if (intent === "adjust-stock") {
    const input = z
      .object({
        variantId: id,
        quantity: z.coerce
          .number()
          .int()
          .min(-100000)
          .max(100000)
          .refine((v) => v !== 0),
        reason: z.enum(["damage", "theft", "correction", "opening stock"]),
        note: requiredText,
      })
      .parse(raw);
    return atomic(async (tx) => {
      const variant = await tx.variant.findUnique({
        where: { id: input.variantId },
      });
      if (!variant) throw new CommerceError("Variant not found.");
      await tx.variant.update({
        where: { id: variant.id },
        data: { stock: { increment: input.quantity } },
      });
      const movement = await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          quantity: input.quantity,
          reason: input.reason,
          reference: input.note,
        },
      });
      const value = Math.abs(input.quantity) * variant.averageCost;
      await journal(tx, `adjust:${movement.id}`, input.note, [
        {
          accountId: "1200",
          debit: input.quantity > 0 ? value : 0,
          credit: input.quantity < 0 ? value : 0,
        },
        {
          accountId: input.reason === "opening stock" ? "3000" : "5010",
          debit: input.quantity < 0 ? value : 0,
          credit: input.quantity > 0 ? value : 0,
        },
      ]);
      return movement;
    });
  }
  if (intent === "park") {
    const input = z
      .object({
        name: requiredText,
        payload: z.record(z.string(), z.unknown()),
      })
      .parse(raw);
    return db.parkedSale.create({
      data: {
        name: input.name,
        payload: JSON.parse(JSON.stringify(input.payload)),
      },
    });
  }
  if (intent === "remove-parked") {
    const input = z.object({ id }).parse(raw);
    return db.parkedSale.delete({ where: { id: input.id } });
  }
  if (intent === "order-status") {
    const input = z
      .object({
        id,
        status: z.enum([
          "pending",
          "paid",
          "packed",
          "shipped",
          "delivered",
          "cancelled",
        ]),
        tracking: text,
        carrier: text,
        method: z.enum(["cash", "whish"]),
      })
      .parse(raw);
    return updateOnlineOrder(
      input.id,
      input.status,
      input.tracking,
      input.carrier,
      input.method,
    );
  }
  if (intent === "return" || intent === "exchange") {
    const input = z
      .object({
        requestKey: text.optional(),
        orderId: id,
        items: z
          .array(
            z.object({
              lineId: id,
              quantity: z.coerce.number().int().min(1),
              restock: z.boolean(),
            }),
          )
          .min(1),
        method: z.enum(["cash", "whish", "credit"]),
        reason: requiredText,
        replacement: z.unknown().optional(),
      })
      .parse(raw);
    return atomic(async (tx) => {
      if (input.requestKey) {
        const existing = await tx.return.findUnique({
          where: { requestKey: input.requestKey },
        });
        if (existing) return existing;
      }
      const result = await returnItems(tx, input);
      if (intent === "exchange") {
        if (input.method !== "credit" || !input.replacement)
          throw new CommerceError(
            "An exchange returns items to store credit, then uses it for the replacement sale.",
          );
        return {
          returned: result,
          order: await sell(
            tx,
            input.replacement as Parameters<typeof sell>[1],
          ),
        };
      }
      return result;
    });
  }
  if (intent === "open-drawer") {
    const input = z.object({ opening: cents }).parse(raw);
    return atomic(async (tx) => {
      if (await tx.drawer.findFirst({ where: { closedAt: null } }))
        throw new CommerceError("A cash session is already open.");
      // Opening float is a drawer allocation of existing cash, not new revenue or equity.
      return tx.drawer.create({ data: { opening: input.opening } });
    });
  }
  if (intent === "close-drawer") {
    const input = z.object({ id, counted: cents, note: text }).parse(raw);
    return atomic(async (tx) => {
      const drawer = await tx.drawer.findUnique({
        where: { id: input.id },
        include: { payments: true, cashEvents: true },
      });
      if (!drawer || drawer.closedAt)
        throw new CommerceError("This cash session is already closed.");
      const expected =
        drawer.opening +
        drawer.payments.reduce((s, p) => s + p.amount, 0) +
        drawer.cashEvents.reduce((s, p) => s + p.amount, 0);
      const variance = input.counted - expected;
      await journal(tx, `drawer:${drawer.id}`, "Cash drawer variance", [
        {
          accountId: "1000",
          debit: Math.max(variance, 0),
          credit: Math.max(-variance, 0),
        },
        {
          accountId: "5200",
          debit: Math.max(-variance, 0),
          credit: Math.max(variance, 0),
        },
      ]);
      return tx.drawer.update({
        where: { id: drawer.id },
        data: {
          closedAt: new Date(),
          counted: input.counted,
          expected,
          variance,
          note: input.note,
        },
      });
    });
  }
  if (intent === "supplier") {
    const input = z
      .object({
        id: text.optional(),
        name: requiredText,
        phone: text,
        email: z.union([z.email(), z.literal("")]),
        address: text,
      })
      .parse(raw);
    const { id: supplierId, ...data } = input;
    return supplierId
      ? db.supplier.update({ where: { id: supplierId }, data })
      : db.supplier.create({ data });
  }
  if (intent === "purchase") {
    const input = z
      .object({
        supplierId: id,
        invoiceNumber: requiredText,
        dueDate: z.iso.date(),
        items: z
          .array(
            z.object({
              variantId: id,
              quantity: z.coerce.number().int().min(1).max(100000),
              cost: cents,
            }),
          )
          .min(1)
          .max(200),
      })
      .parse(raw);
    if (
      new Set(input.items.map((i) => i.variantId)).size !== input.items.length
    )
      throw new CommerceError("Combine duplicate purchase lines.");
    return db.purchase.create({
      data: {
        supplierId: input.supplierId,
        invoiceNumber: input.invoiceNumber,
        dueDate: new Date(input.dueDate),
        total: input.items.reduce((s, i) => s + i.cost * i.quantity, 0),
        items: { create: input.items },
      },
    });
  }
  if (intent === "receive-purchase") {
    const input = z.object({ id }).parse(raw);
    return atomic(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: input.id },
        include: { items: { include: { variant: true } } },
      });
      if (!purchase || purchase.status !== "ordered")
        throw new CommerceError("This purchase is not awaiting receipt.");
      for (const item of purchase.items) {
        const averageCost =
          item.variant.stock <= 0
            ? item.cost
            : Math.round(
                (item.variant.stock * item.variant.averageCost +
                  item.quantity * item.cost) /
                  (item.variant.stock + item.quantity),
              );
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity }, averageCost },
        });
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            reason: "Purchase received",
            reference: purchase.id,
          },
        });
      }
      await journal(
        tx,
        `purchase:${purchase.id}`,
        `Supplier invoice ${purchase.invoiceNumber}`,
        [
          { accountId: "1200", debit: purchase.total },
          { accountId: "2000", credit: purchase.total },
        ],
      );
      return tx.purchase.update({
        where: { id: purchase.id },
        data: { status: "received", receivedAt: new Date() },
      });
    });
  }
  if (intent === "pay-supplier") {
    const input = z
      .object({
        id,
        amount: cents.refine((v) => v > 0),
        method: z.enum(["cash", "whish"]),
        reference: text,
      })
      .parse(raw);
    return atomic(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: input.id },
      });
      if (
        !purchase ||
        purchase.status !== "received" ||
        input.amount > purchase.total - purchase.paid
      )
        throw new CommerceError(
          "Payment exceeds the received invoice balance.",
        );
      if (input.method === "cash")
        await cashEvent(
          tx,
          -input.amount,
          `Supplier invoice ${purchase.invoiceNumber}`,
        );
      const payment = await tx.supplierPayment.create({
        data: {
          purchaseId: purchase.id,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
        },
      });
      await journal(
        tx,
        `supplier-payment:${payment.id}`,
        `Pay ${purchase.invoiceNumber}`,
        [
          { accountId: "2000", debit: input.amount },
          { accountId: paymentAccount(input.method), credit: input.amount },
        ],
      );
      return tx.purchase.update({
        where: { id: purchase.id },
        data: { paid: { increment: input.amount } },
      });
    });
  }
  if (intent === "expense") {
    const input = z
      .object({
        category: z.enum([
          "Rent",
          "Salaries",
          "Utilities",
          "Marketing",
          "Supplies",
          "Other",
        ]),
        amount: cents.refine((v) => v > 0),
        method: z.enum(["cash", "whish"]),
        note: requiredText,
        date: z.iso.date(),
      })
      .parse(raw);
    return atomic(async (tx) => {
      const expense = await tx.expense.create({
        data: { ...input, date: new Date(input.date) },
      });
      if (input.method === "cash")
        await cashEvent(tx, -input.amount, input.note);
      const code = {
        Rent: "5100",
        Salaries: "5110",
        Utilities: "5120",
        Marketing: "5130",
        Supplies: "5140",
        Other: "5190",
      }[input.category];
      await journal(
        tx,
        `expense:${expense.id}`,
        input.note,
        [
          { accountId: code, debit: input.amount },
          { accountId: paymentAccount(input.method), credit: input.amount },
        ],
        new Date(input.date),
      );
      return expense;
    });
  }
  if (intent === "gift") {
    const input = z
      .object({
        amount: cents.refine((v) => v > 0),
        method: z.enum(["cash", "whish"]),
      })
      .parse(raw);
    return atomic(async (tx) => {
      const gift = await tx.giftCard.create({
        data: {
          code: `BG-${randomUUID().slice(0, 8).toUpperCase()}`,
          issued: input.amount,
          balance: input.amount,
        },
      });
      if (input.method === "cash")
        await cashEvent(tx, input.amount, `Gift card ${gift.code}`, true);
      await journal(tx, `gift:${gift.id}`, `Issue ${gift.code}`, [
        { accountId: paymentAccount(input.method), debit: input.amount },
        { accountId: "2210", credit: input.amount },
      ]);
      return gift;
    });
  }
  if (intent === "credit") {
    const input = z
      .object({
        customerId: id,
        amount: cents.refine((v) => v > 0),
        reason: requiredText,
      })
      .parse(raw);
    return atomic(async (tx) => {
      const entry = await tx.loyaltyEntry.create({
        data: {
          customerId: input.customerId,
          credit: input.amount,
          points: 0,
          reason: input.reason,
        },
      });
      await tx.customer.update({
        where: { id: input.customerId },
        data: { credit: { increment: input.amount } },
      });
      await journal(tx, `credit:${entry.id}`, input.reason, [
        { accountId: "5130", debit: input.amount },
        { accountId: "2200", credit: input.amount },
      ]);
      return entry;
    });
  }
  if (intent === "promo") {
    const input = z
      .object({
        code: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9_-]{2,30}$/),
        kind: z.enum(["fixed", "percent"]),
        amount: cents,
        minimum: cents,
        active: z.boolean(),
        expiresAt: z.union([z.iso.date(), z.literal("")]),
        limit: cents,
      })
      .parse(raw);
    if (input.kind === "percent" && input.amount > 100)
      throw new CommerceError("Percentage must be 0–100.");
    const data = {
      ...input,
      expiresAt: input.expiresAt
        ? new Date(`${input.expiresAt}T23:59:59Z`)
        : null,
    };
    return db.promo.upsert({
      where: { code: input.code },
      update: data,
      create: data,
    });
  }
  if (intent === "settings") {
    const input = z
      .object({
        shipping: cents,
        freeShipping: cents,
        pointsPerDollar: z.coerce.number().int().min(0).max(100),
        pointValue: z.coerce.number().int().min(0).max(100),
        returnDays: z.coerce.number().int().min(0).max(365),
        shopName: requiredText,
        shopPhone: text,
        shopAddress: text,
        receiptFooter: text,
        demo: z.boolean(),
      })
      .parse(raw);
    const config = await settings();
    return db.setting.upsert({
      where: { key: "shop" },
      update: { value: { ...config, ...input } },
      create: { key: "shop", value: { ...config, ...input } },
    });
  }
  if (intent === "create-shop") {
    const input = z.object({ name: requiredText }).parse(raw);
    return db.shop.create({ data: input });
  }
  if (intent === "create-category") {
    const input = z.object({ name: requiredText, shopId: id }).parse(raw);
    return db.category.create({ data: input });
  }
  if (intent === "liability") {
    const input = z
      .object({
        id: text.optional(),
        creditor: requiredText,
        amount: cents,
        settled: cents,
        note: text,
      })
      .parse(raw);
    if (input.settled > input.amount)
      throw new CommerceError("Settled amount exceeds the liability.");
    const { id: recordId, ...data } = input;
    return recordId
      ? db.liability.update({ where: { id: recordId }, data })
      : db.liability.create({ data });
  }
  throw new CommerceError("Unknown action.");
}

export async function campaignAudience(segment: string) {
  const customers = await db.customer.findMany({
    include: { children: true, orders: { select: { createdAt: true } } },
  });
  const now = new Date();
  return customers.filter((c) => {
    if (segment === "all") return true;
    if (segment === "birthdays")
      return c.children.some(
        (k) => k.birthdate.getUTCMonth() === now.getUTCMonth(),
      );
    if (segment === "size-up")
      return (
        c.children.length > 0 &&
        (!c.orders.length ||
          +now - Math.max(...c.orders.map((o) => +o.createdAt)) > 90 * 86400000)
      );
    if (segment === "back-to-school")
      return c.children.some(
        (k) =>
          (+now - +k.birthdate) / 31557600000 >= 4 &&
          (+now - +k.birthdate) / 31557600000 <= 14,
      );
    return c.tags.includes(segment);
  });
}
