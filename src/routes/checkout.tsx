import Checkout from "../pages/Checkout";
import { localizedMeta } from "../config/meta";
import { data } from "react-router";
import { z, ZodError } from "zod";
import type { Route } from "./+types/checkout";
import { builtInStorefront } from "../server/commerce/adapters.server";
import { CommerceError } from "../server/commerce/rules";

export const meta = localizedMeta(
  "Checkout",
  "Complete a Boys & Girlz order for delivery all over Lebanon.",
  "/checkout",
);

const selectionSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  mobile: z
    .string()
    .trim()
    .max(30)
    .refine(
      (v) => /^\+?\d{6,15}$/.test(v.replace(/[\s().-]/g, "")),
      "Use a valid phone number.",
    ),
  email: z.union([z.email(), z.literal("")]),
  governorate: z.string().trim().min(1).max(100),
  cityArea: z.string().trim().min(1).max(150),
  streetBuilding: z.string().trim().min(1).max(500),
  landmark: z.string().max(500),
  deliveryNotes: z.string().max(500),
  promoCode: z.string().max(30),
  paymentMethod: z.enum(["cash_on_delivery", "whish"]).optional(),
  requestKey: z.string().min(8).max(150).optional(),
  items: z
    .array(
      z.object({
        productSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        size: z.string().nullable(),
        color: z.string().nullable(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
});

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  if (request.headers.get("Origin") !== url.origin)
    return data(
      { error: "This order request could not be verified." },
      { status: 403 },
    );
  try {
    const payload = selectionSchema.parse(await request.json());
    return data(await builtInStorefront.placeOrder(payload), { status: 201 });
  } catch (error) {
    if (error instanceof CommerceError)
      return data({ error: error.message }, { status: 409 });
    if (error instanceof ZodError)
      return data(
        { error: "Please check your order and delivery details." },
        { status: 400 },
      );
    throw error;
  }
}
export default Checkout;
