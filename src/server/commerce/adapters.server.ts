import { randomUUID } from "node:crypto";
import { atomic, sell } from "./sales.server";
import { CommerceError } from "./rules";
import {whatsappPhone}from'../../domain/phone';
export interface StorefrontAdapter {
  name: string;
  placeOrder(
    input: StorefrontOrder,
  ): Promise<{ orderNumber: string; totals: { totalCents: number } }>;
}
export type StorefrontOrder = {
  fullName: string;
  mobile: string;
  email: string;
  governorate: string;
  cityArea: string;
  streetBuilding: string;
  landmark: string;
  deliveryNotes: string;
  promoCode: string;
  paymentMethod?: string;
  requestKey?: string;
  items: {
    productSlug: string;
    size: string | null;
    color: string | null;
    quantity: number;
  }[];
};
// External payment settlement must be verified server-side before recording a payment.
export const builtInStorefront: StorefrontAdapter = {
  name: "Boys & Girlz storefront",
  async placeOrder(input) {
    const order = await atomic(async (tx) => {
      const phone = whatsappPhone(input.mobile);
      const customer = await tx.customer.upsert({
        where: { phone },
        update: {},
        create: {
          name: input.fullName,
          phone,
          email: input.email,
          address: `${input.governorate}, ${input.cityArea}, ${input.streetBuilding}`,
          demo: false,
          consentWhatsapp:false,
        },
      });
      const lines = [];
      for (const item of input.items) {
        const variant = await tx.variant.findFirst({
          where: {
            product: {
              slug: item.productSlug,
              visibility: "website_and_pos",
              archived: false,
            },
            active: true,
            size: item.size || "One size",
            color: item.color || "Default",
          },
        });
        if (!variant)
          throw new CommerceError(
            "An item is no longer available in the selected size and color.",
          );
        lines.push({ variantId: variant.id, quantity: item.quantity });
      }
      return sell(tx, {
        requestKey: input.requestKey || randomUUID(),
        channel: "online",
        paymentMethod:input.paymentMethod==='whish'?'whish':'cash_on_delivery',
        customerId: customer.id,
        items: lines,
        promoCode: input.promoCode,
        note: `${input.paymentMethod === "whish" ? "Whish requested — awaiting manual verification. No online payment collected. " : "Cash on delivery. "}${input.deliveryNotes}`,
        address: customer.address,
        phone,
      });
    });
    return {
      orderNumber: `BG-${String(order.number).padStart(6, "0")}`,
      totals: { totalCents: order.total },
    };
  },
};
