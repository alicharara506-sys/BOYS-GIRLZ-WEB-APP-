// Delivery charges for online orders. The amounts come from the admin settings (Settings → Delivery:
// shipping, freeShipping in cents, and the freeShippingEnabled switch) and reach the storefront through
// the root loader, so the bag, checkout, product pages and help texts always match what the server charges.
export type DeliveryRule = {
  fee: number; // in dollars; 0 means delivery is always free
  freeFrom: number | null; // in dollars; null when the owner has turned free delivery off
};

// Used only when the settings can't be read. Same values as the server defaults in rules.ts.
export const DEFAULT_DELIVERY: DeliveryRule = { fee: 5, freeFrom: 99 };

// Same rule as the server (sales.server.ts): free once the order reaches the threshold after any
// promo discount (when free delivery is on), otherwise the flat fee. An empty bag costs nothing.
export function deliveryFee(amount: number, rule: DeliveryRule): number {
  if (amount <= 0) return 0;
  if (rule.freeFrom !== null && amount >= rule.freeFrom) return 0;
  return rule.fee;
}

export function deliveryRuleFromSettings(settings: { shipping?: unknown; freeShipping?: unknown; freeShippingEnabled?: unknown }): DeliveryRule {
  const dollarsFrom = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value / 100 : fallback;
  return {
    fee: dollarsFrom(settings.shipping, DEFAULT_DELIVERY.fee),
    freeFrom: settings.freeShippingEnabled === false ? null : dollarsFrom(settings.freeShipping, DEFAULT_DELIVERY.freeFrom ?? 99),
  };
}

// "$99", "$5.95": whole dollars without decimals, for short copy such as "free from $99".
export function dollars(amount: number): string {
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

type Language = "en" | "ar";

// One sentence on what delivery costs, for the help pages and the About page.
export function deliverySentence(rule: DeliveryRule, language: Language): string {
  const fee = dollars(rule.fee);
  if (rule.fee === 0)
    return language === "ar" ? "نوصّل إلى جميع أنحاء لبنان، والتوصيل مجاني لكل الطلبات." : "We deliver all over Lebanon, and delivery is free on every order.";
  if (rule.freeFrom === null)
    return language === "ar" ? `نوصّل إلى جميع أنحاء لبنان. رسوم التوصيل ${fee} لكل طلب.` : `We deliver all over Lebanon. Delivery is ${fee} per order.`;
  const from = dollars(rule.freeFrom);
  return language === "ar"
    ? `نوصّل إلى جميع أنحاء لبنان. رسوم التوصيل ${fee}، والتوصيل مجاني للطلبات بقيمة ${from} أو أكثر بعد أي خصم ترويجي.`
    : `We deliver all over Lebanon. Delivery is ${fee}, and free on orders of ${from} or more after any promo discount.`;
}

// The full FAQ answer about delivery.
export function deliveryAnswer(rule: DeliveryRule, language: Language): string {
  return language === "ar"
    ? `توصّل بويز آند غيرلز داخل لبنان فقط. ${deliverySentence(rule, language).replace(/^نوصّل إلى جميع أنحاء لبنان[.،]\s*(و(?=التوصيل))?/, "")} ترى رسوم التوصيل والمجموع المطلوب قبل تأكيد الطلب. لمعرفة موعد التوصيل المتوقع، تواصل مع المتجر.`
    : `Boys & Girlz delivers within Lebanon only. ${deliverySentence(rule, language).replace(/^We deliver all over Lebanon[.,]\s*(and )?/, "").replace(/^./, (c) => c.toUpperCase())} You see the delivery fee and the total to pay before you place the order. For the current delivery estimate, contact the shop.`;
}
