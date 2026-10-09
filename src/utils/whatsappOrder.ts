import { money, productById } from "../data/products.ts";
import type { CartItem } from "../state/storeCore.ts";

export function whatsAppOrderMessage(cart: CartItem[]) {
  const items = cart.flatMap((item) => {
    const product = productById(item.productId);
    if (!product) return [];
    const details = [item.size, item.color, product.condition === "like-new" ? "Like New" : ""].filter(Boolean).join(", ");
    return [{
      line: `${product.name}${details ? ` (${details})` : ""} × ${item.quantity} — ${money(product.price * item.quantity)}`,
      amount: product.price * item.quantity,
    }];
  });
  if (!items.length) return "";
  return [
    "Hello Boys & Girlz! I would like to request an order for delivery within Lebanon:",
    "",
    ...items.map((item, index) => `${index + 1}. ${item.line}`),
    "",
    `Estimated item subtotal: ${money(items.reduce((sum, item) => sum + item.amount, 0))}`,
    "Please confirm availability, delivery charge, and the final total. I can share my delivery details in this chat.",
  ].join("\n");
}
