import Checkout from "../pages/Checkout";
import { localizedMeta } from "../config/meta";
import { data } from "react-router";
import { z, ZodError } from "zod";
import { createOrder, OrderValidationError } from "../server/orderService";
import { postgresOrderRepository, resolveVariantSelection } from "../server/postgres.server";
import type { Route } from "./+types/checkout";

export const meta = localizedMeta("Checkout", "Complete a Boys & Girlz order for delivery within Lebanon.", "/checkout");

const selectionSchema = z.object({
  fullName: z.string(), mobile: z.string(), email: z.string(),
  governorate: z.string(), cityArea: z.string(), streetBuilding: z.string(),
  landmark: z.string(), deliveryNotes: z.string(), promoCode: z.string(),
  items: z.array(z.object({
    productSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    size: z.string().nullable(), color: z.string().nullable(),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(30),
});

export async function action({ request }: Route.ActionArgs) {
  if (!process.env.DATABASE_URL || !process.env.SHIPPING_FEE_CENTS ||
      !process.env.FREE_SHIPPING_THRESHOLD_CENTS || !process.env.ORDER_NOTIFICATION_EMAIL ||
      !process.env.EMAIL_PROVIDER || !process.env.EMAIL_PROVIDER_API_KEY || !process.env.EMAIL_FROM) {
    return data({ error: "Ordering is not configured yet. Please contact the shop before placing an order." }, { status: 503 });
  }
  try {
    const payload = selectionSchema.parse(await request.json());
    const resolved = await resolveVariantSelection(payload.items);
    if (!resolved) return data({ error: "An item is unavailable. Please review your bag." }, { status: 409 });
    const result = await createOrder({ ...payload, items: resolved }, postgresOrderRepository, {
      shippingFeeCents: Number(process.env.SHIPPING_FEE_CENTS),
      freeOverCents: Number(process.env.FREE_SHIPPING_THRESHOLD_CENTS),
    });
    return data(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return data({ error: "Please check the order and delivery details." }, { status: 400 });
    }
    if (error instanceof OrderValidationError) return data({ error: error.message }, { status: 409 });
    throw error;
  }
}

export default Checkout;
