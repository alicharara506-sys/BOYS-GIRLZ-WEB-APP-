import { z } from "zod";
export const cents = z.coerce.number().int().min(0).max(100_000_000);
export const text = z.string().trim().max(500);
export const requiredText = text.min(1);
export const methods = ["cash", "card", "whish", "credit", "gift"] as const;
export const paymentSchema = z.object({
  method: z.enum(methods),
  amount: cents,
  reference: text.default(""),
});
export const saleSchema = z.object({
  requestKey: z.string().min(8).max(150),
  channel: z.enum(["pos", "online"]).default("pos"),
  customerId: text.optional(),
  customerName: text.default("Walk-in customer"),
  phone: text.default(""),
  address: text.default(""),
  items: z
    .array(
      z.object({
        variantId: requiredText,
        quantity: z.coerce.number().int().min(1).max(999),
        discount: cents.default(0),
      }),
    )
    .min(1)
    .max(100),
  discountType: z.enum(["fixed", "percent"]).default("fixed"),
  discount: cents.default(0),
  payments: z.array(paymentSchema).max(10).default([]),
  cashTendered: cents.default(0),
  pointsUsed: cents.default(0),
  promoCode: text.default(""),
  note: text.default(""),
  shipping: cents.optional(),
  demo: z.boolean().default(false),
});
export type SaleInput = z.input<typeof saleSchema>;
export const defaults = {
  currency: "USD",
  taxRate: 0,
  taxIncluded: false,
  shipping: 500,
  freeShipping: 10000,
  pointsPerDollar: 1,
  pointValue: 1,
  returnDays: 30,
  shopName: "Boys & Girlz",
  shopPhone: "+961 81 061 731",
  shopAddress: "",
  receiptFooter: "Thank you for shopping small. See you again soon!",
  demo: true,
};
export type Settings = typeof defaults;
export class CommerceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export const ensure = (
  condition: unknown,
  message: string,
): asserts condition => {
  if (!condition) throw new CommerceError(message);
};
export function allocate(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const allocations = weights.map((weight) =>
    Math.floor((total * weight) / sum),
  );
  let remainder = total - allocations.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % weights.length) {
    if (weights[i] > 0) {
      allocations[i]++;
      remainder--;
    }
  }
  return allocations;
}
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value / 100,
  );
export function dateRange(from?: string, to?: string) {
  const start = from
    ? new Date(`${from}T00:00:00.000Z`)
    : new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
      );
  const end = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || start > end)
    throw new CommerceError("Choose a valid date range.");
  return { gte: start, lte: end };
}
