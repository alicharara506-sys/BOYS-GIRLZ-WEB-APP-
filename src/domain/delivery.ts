// Delivery charges for online orders. The amounts come from the admin settings (Settings → shop:
// shipping and freeShipping, in cents) and reach the storefront through the root loader, so the bag,
// checkout and product pages always show what the server will charge.
export type DeliveryRule = { fee: number; freeFrom: number }; // in dollars

// Used only when the settings can't be read. Same values as the server defaults in rules.ts.
export const DEFAULT_DELIVERY: DeliveryRule = { fee: 5, freeFrom: 100 };

// Same rule as the server (sales.server.ts): free once the order reaches the threshold after any
// promo discount, otherwise the flat fee. An empty bag costs nothing.
export function deliveryFee(amount: number, rule: DeliveryRule): number {
  if (amount <= 0) return 0;
  return amount >= rule.freeFrom ? 0 : rule.fee;
}

export function deliveryRuleFromSettings(settings: { shipping?: unknown; freeShipping?: unknown }): DeliveryRule {
  const cents = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value / 100 : fallback;
  return {
    fee: cents(settings.shipping, DEFAULT_DELIVERY.fee),
    freeFrom: cents(settings.freeShipping, DEFAULT_DELIVERY.freeFrom),
  };
}

// "$100", "$5.95": whole dollars without decimals, for short copy such as "free from $100".
export function dollars(amount: number): string {
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}
