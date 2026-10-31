import { business } from "../config/business";

// Keep answers as plain text: the FAQ page and its JSON-LD use these exact strings.
// TODO: Replace the policy fallback only after the owner confirms the returns terms.
export const returnsPolicy = business.returnsPolicy.trim() || "The Boys & Girlz returns and exchanges policy has not been confirmed for publication yet. Contact the shop before ordering to ask about eligibility, time limits and any conditions for the items you want; the website does not currently publish a confirmed return window.";

export const faqs = [
  {
    id: "delivery", topic: "Delivery",
    question: "Where does Boys & Girlz deliver?",
    answer: "Boys & Girlz delivers within Lebanon only, with free delivery on orders over $99 before promo discounts. For the current delivery estimate or charges on a smaller order, contact the shop before ordering; availability, delivery charges and the final total are confirmed with the shop.",
    relatedPath: "/help/shipping", relatedLabel: "Delivery in Lebanon",
  },
  {
    id: "payment", topic: "Payment",
    question: "Can I pay on delivery?",
    answer: "Yes, Cash on Delivery is available for Boys & Girlz orders within Lebanon. If you request an order through WhatsApp, the shop confirms product availability, the delivery charge and the final total before the order is placed, so check those details in the conversation.",
    relatedPath: "/contact", relatedLabel: "Contact us",
  },
  {
    id: "returns", topic: "Returns",
    question: "What is the returns policy?", answer: returnsPolicy,
    relatedPath: "/help/returns", relatedLabel: "Returns and exchanges",
  },
  {
    id: "sizes", topic: "Sizes",
    question: "How do I choose a size?",
    answer: "Check the available sizes for each item and ask Boys & Girlz for garment measurements before ordering. The children's size filters run from New Born to 5–6 Years, while maternity filters use S to XXL; availability and fit depend on the individual product and brand.",
    relatedPath: "/help/sizing", relatedLabel: "Size Guide",
  },
  {
    id: "outlet", topic: "Outlet",
    question: "What does Like New mean?",
    answer: "Like New outlet items are pre-owned pieces in excellent condition offered at reduced prices by Boys & Girlz. Before ordering, ask the shop for current photos, condition details and availability for the particular item, along with any measurements you need to check its fit.",
    relatedPath: "/category/outlet", relatedLabel: "Outlet",
  },
] as const;
