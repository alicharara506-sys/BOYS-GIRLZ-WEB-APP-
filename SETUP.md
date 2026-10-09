# Local setup — draft branch

1. Install Node.js 24 and run `npm ci`.
2. Copy `.env.example` to `.env` and fill only verified values. Never put private credentials in a `VITE_` variable.
3. Run `npm run dev` and open the local URL printed by React Router.
4. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build` before review.

Set `VITE_WHATSAPP_PHONE` to the confirmed shop number in international format to enable the floating chat link, product enquiries, and bag/checkout order requests. These links open WhatsApp with a prepared message; they do not submit an order or clear the cart. The shop must confirm availability, delivery cost, and the final total in chat.

The preview catalog is still local mock data. `supabase/migrations/202610080001_initial_store.sql` and `supabase/seed.sql` are draft database inputs for an approved Supabase project. The seed leaves every product and variant unpublished and with zero stock. Do not publish inventory until descriptions, photos, sizes, brand associations, pricing and quantities are verified. For live checkout, use a Supabase direct or session-pooler Postgres URL and configure the server-only order and email variables. Without them, checkout returns a clear unavailable message rather than creating a fake order.

No email worker, admin area or live database connection has been exercised yet. This branch is for review and is not ready for deployment.
