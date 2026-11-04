import { money, productById, type Product } from "../data/products.ts";
import type { CartItem } from "../state/storeCore.ts";

export function whatsAppOrderMessage(cart: CartItem[], language: "en" | "ar" = "en", translate: (text: string) => string = (text) => text, lookup: (id: string) => Product | undefined = productById) {
  const items = cart.flatMap((item) => {
    const product = lookup(item.productId);
    if (!product) return [];
    const details = [item.size && translate(item.size), item.color && translate(item.color), product.condition === "like-new" ? language === "ar" ? "شبه جديد" : "Like New" : ""].filter(Boolean).join(language === "ar" ? "، " : ", ");
    return [{
      line: `${translate(product.name)}${details ? ` (${details})` : ""} × ${item.quantity} — ${money(product.price * item.quantity)}`,
      amount: product.price * item.quantity,
    }];
  });
  if (!items.length) return "";
  return [
    language === "ar" ? "مرحباً بويز آند غيرلز! أود الاستفسار عن طلب للتوصيل داخل لبنان:" : "Hello Boys & Girlz! I would like to request an order for delivery within Lebanon:",
    "",
    ...items.map((item, index) => `${index + 1}. ${item.line}`),
    "",
    `${language === "ar" ? "المجموع الفرعي التقديري للمنتجات" : "Estimated item subtotal"}: ${money(items.reduce((sum, item) => sum + item.amount, 0))}`,
    language === "ar" ? "يرجى تأكيد توفّر المنتجات ورسوم التوصيل والمجموع النهائي. يمكنني مشاركة تفاصيل التوصيل في هذه المحادثة." : "Please confirm availability, delivery charge, and the final total. I can share my delivery details in this chat.",
  ].join("\n");
}
