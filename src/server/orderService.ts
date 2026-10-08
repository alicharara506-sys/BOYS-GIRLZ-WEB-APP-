import { z } from "zod";

const lebaneseMobile = (value: string) => {
  const normalized = value.replace(/[\s().-]/g, "");
  const national = normalized.startsWith("+961")
    ? normalized.slice(4)
    : normalized.startsWith("0")
      ? normalized.slice(1)
      : normalized;
  return /^(3\d{6}|[78]\d{7})$/.test(national);
};

export const orderInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobile: z.string().trim().refine(lebaneseMobile, "Enter a Lebanese mobile number"),
  email: z.union([z.email(), z.literal("")]).optional(),
  governorate: z.string().trim().min(2).max(80),
  cityArea: z.string().trim().min(2).max(120),
  streetBuilding: z.string().trim().min(3).max(180),
  landmark: z.string().trim().max(180).optional(),
  deliveryNotes: z.string().trim().max(500).optional(),
  promoCode: z.string().trim().max(40).optional(),
  items: z.array(z.object({
    variantId: z.uuid(),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(30),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type VariantForOrder = {
  id: string;
  productName: string;
  sku: string;
  size: string | null;
  color: string | null;
  unitPriceCents: number;
  stock: number;
  published: boolean;
};
export type PromoForOrder = {
  code: string;
  discountType: "percent" | "fixed";
  amount: number;
  minSubtotalCents: number;
  usageLimit: number | null;
  uses: number;
  expiresAt: Date | null;
  active: boolean;
};
export type PricedItem = VariantForOrder & { quantity: number };
export type OrderTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};
export interface OrderTransaction {
  getVariantsForUpdate(ids: string[]): Promise<VariantForOrder[]>;
  getPromoForUpdate(code: string): Promise<PromoForOrder | null>;
  decrementStock(id: string, quantity: number): Promise<boolean>;
  saveOrder(input: OrderInput, items: PricedItem[], totals: OrderTotals, promoCode: string | null): Promise<string>;
  usePromo(code: string): Promise<void>;
}
export interface OrderRepository {
  transaction<T>(fn: (tx: OrderTransaction) => Promise<T>): Promise<T>;
}

export class OrderValidationError extends Error {}

export function priceOrder(
  items: PricedItem[],
  promo: PromoForOrder | null,
  shippingFeeCents: number,
  freeOverCents: number,
): OrderTotals {
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  let discountCents = 0;
  if (promo) {
    if (!promo.active || (promo.expiresAt && promo.expiresAt <= new Date()) ||
        (promo.usageLimit !== null && promo.uses >= promo.usageLimit) ||
        subtotalCents < promo.minSubtotalCents) {
      throw new OrderValidationError("Promo code is unavailable for this order");
    }
    discountCents = promo.discountType === "percent"
      ? Math.floor(subtotalCents * promo.amount / 100)
      : Math.min(subtotalCents, promo.amount);
  }
  const shippingCents = subtotalCents > freeOverCents ? 0 : shippingFeeCents;
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + shippingCents,
  };
}

export async function createOrder(
  raw: unknown,
  repository: OrderRepository,
  config: { shippingFeeCents: number; freeOverCents: number },
) {
  const input = orderInputSchema.parse(raw);
  if (!Number.isSafeInteger(config.shippingFeeCents) || config.shippingFeeCents < 0 ||
      !Number.isSafeInteger(config.freeOverCents) || config.freeOverCents < 0) {
    throw new Error("Shipping settings are not configured");
  }
  const ids = input.items.map((item) => item.variantId);
  if (new Set(ids).size !== ids.length) throw new OrderValidationError("Duplicate product variants");

  return repository.transaction(async (tx) => {
    const variants = await tx.getVariantsForUpdate(ids);
    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    const items = input.items.map(({ variantId, quantity }) => {
      const variant = byId.get(variantId);
      if (!variant || !variant.published || variant.stock < quantity) {
        throw new OrderValidationError("An item is no longer available in that quantity");
      }
      return { ...variant, quantity };
    });
    const promoCode = input.promoCode?.trim().toUpperCase() || null;
    const promo = promoCode ? await tx.getPromoForUpdate(promoCode) : null;
    if (promoCode && !promo) throw new OrderValidationError("Promo code is unavailable");
    const totals = priceOrder(items, promo, config.shippingFeeCents, config.freeOverCents);
    for (const item of items) {
      if (!await tx.decrementStock(item.id, item.quantity)) {
        throw new OrderValidationError("An item went out of stock");
      }
    }
    const orderNumber = await tx.saveOrder(input, items, totals, promoCode);
    if (promoCode) await tx.usePromo(promoCode);
    return { orderNumber, totals };
  });
}
