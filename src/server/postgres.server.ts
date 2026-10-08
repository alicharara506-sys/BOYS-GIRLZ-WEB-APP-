import postgres from "postgres";
import type { OrderInput, OrderRepository, OrderTotals, OrderTransaction, PricedItem, PromoForOrder, VariantForOrder } from "./orderService";

let connection: postgres.Sql | null = null;

export function getConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for live orders");
  // Use Supabase's direct or session-pooler URL, not its transaction-pooler URL.
  connection ??= postgres(url, {
    max: 5,
    prepare: false,
    ssl: process.env.DATABASE_SSL === "false" ? false : "require",
  });
  return connection;
}

export async function resolveVariantSelection(items: {
  productSlug: string;
  size: string | null;
  color: string | null;
  quantity: number;
}[]) {
  const sql = getConnection();
  const resolved = [];
  for (const item of items) {
    const [row] = await sql`
      select v.id
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where p.slug = ${item.productSlug}
        and v.size is not distinct from ${item.size}
        and v.color is not distinct from ${item.color}
        and p.published and v.published
      limit 1
    `;
    if (!row) return null;
    resolved.push({ variantId: String(row.id), quantity: item.quantity });
  }
  return resolved;
}

export const postgresOrderRepository: OrderRepository = {
  transaction<T>(fn: (tx: OrderTransaction) => Promise<T>): Promise<T> {
    return getConnection().begin(async (sql) => {
      const tx: OrderTransaction = {
        async getVariantsForUpdate(ids: string[]): Promise<VariantForOrder[]> {
          const rows = await sql`
            select v.id, v.sku, v.size, v.color, v.stock,
                   v.published and p.published as published,
                   p.name as product_name,
                   coalesce(v.price_override_cents, p.base_price_cents) as unit_price_cents
            from public.product_variants v
            join public.products p on p.id = v.product_id
            where v.id = any(${ids}::uuid[])
            order by v.id
            for update of v
          `;
          return rows.map((row) => ({
            id: String(row.id),
            sku: String(row.sku),
            size: row.size == null ? null : String(row.size),
            color: row.color == null ? null : String(row.color),
            stock: Number(row.stock),
            published: Boolean(row.published),
            productName: String(row.product_name),
            unitPriceCents: Number(row.unit_price_cents),
          }));
        },
        async getPromoForUpdate(code: string): Promise<PromoForOrder | null> {
          const [row] = await sql`
            select code, discount_type, amount, min_subtotal_cents, usage_limit,
                   uses, expires_at, active
            from public.promo_codes where code = ${code} for update
          `;
          return row ? {
            code: String(row.code),
            discountType: row.discount_type as "percent" | "fixed",
            amount: Number(row.amount),
            minSubtotalCents: Number(row.min_subtotal_cents),
            usageLimit: row.usage_limit == null ? null : Number(row.usage_limit),
            uses: Number(row.uses),
            expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
            active: Boolean(row.active),
          } : null;
        },
        async decrementStock(id: string, quantity: number) {
          const rows = await sql`
            update public.product_variants
            set stock = stock - ${quantity}
            where id = ${id} and stock >= ${quantity}
            returning id
          `;
          return rows.length === 1;
        },
        async saveOrder(input: OrderInput, items: PricedItem[], totals: OrderTotals, promoCode: string | null) {
          const [customer] = await sql`
            insert into public.customers
              (full_name, mobile, email, governorate, city_area, street_building, landmark, delivery_notes)
            values
              (${input.fullName}, ${input.mobile}, ${input.email || null}, ${input.governorate},
               ${input.cityArea}, ${input.streetBuilding}, ${input.landmark || null}, ${input.deliveryNotes || null})
            returning id
          `;
          const [order] = await sql`
            insert into public.orders
              (customer_id, subtotal_cents, discount_cents, shipping_cents, total_cents, promo_code)
            values
              (${customer.id}, ${totals.subtotalCents}, ${totals.discountCents},
               ${totals.shippingCents}, ${totals.totalCents}, ${promoCode})
            returning id, order_number
          `;
          for (const item of items) {
            await sql`
              insert into public.order_items
                (order_id, variant_id, product_name, sku, size, color, unit_price_cents, quantity)
              values
                (${order.id}, ${item.id}, ${item.productName}, ${item.sku},
                 ${item.size}, ${item.color}, ${item.unitPriceCents}, ${item.quantity})
            `;
          }
          const shopEmail = process.env.ORDER_NOTIFICATION_EMAIL;
          if (!shopEmail) throw new Error("ORDER_NOTIFICATION_EMAIL is required for live orders");
          await sql`
            insert into public.order_email_outbox (order_id, kind, recipient)
            values (${order.id}, 'shop', ${shopEmail})
          `;
          if (input.email) await sql`
            insert into public.order_email_outbox (order_id, kind, recipient)
            values (${order.id}, 'customer', ${input.email})
          `;
          return String(order.order_number);
        },
        async usePromo(code: string) {
          await sql`update public.promo_codes set uses = uses + 1 where code = ${code}`;
        },
      };
      return fn(tx);
    }) as Promise<T>;
  },
};
