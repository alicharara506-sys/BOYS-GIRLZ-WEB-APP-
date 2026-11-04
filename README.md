# Boys & Girlz

Existing React / TypeScript storefront and single-owner POS, inventory, customer and accounting app, extended in place. Supabase is the only backend: Auth, PostgreSQL with RLS, Storage, and Realtime. Cash, Whish, store credit and gift balances are supported. WhatsApp uses a self-hosted QR connection.

## Setup

Node.js 24 is required. Create a free Supabase project, copy .env.example to .env and set SUPABASE_URL, SUPABASE_ANON_KEY (public publishable key), SUPABASE_SERVICE_ROLE_KEY (server only), and DATABASE_URL (the same project's direct/session-pooler connection).

Run npm install, then npm run setup. In Supabase Auth create the owner's account, then insert its UUID into public.owners using the SQL editor. Only that owner can access administration. No public sign-up flow is provided.

After setup, npm start runs the complete app at http://127.0.0.1:5181/admin. For a production build use npm run build and npm run start:production. The server binds to loopback for local review.

The previous local demo's credentials and database are retained privately in .data as backup; they are not used by this Supabase version. No business records or images fall back to a local database. A missing Supabase connection fails explicitly.

See docs/commerce-admin.md for operations and docs/spec-implementation.md for implementation mapping and verification status.

## Checks

npm test runs the local pricing, financial, SQL syntax, cart and SEO checks. npm run lint and npm run build validate the full source. Live checks require a dedicated Supabase test project: set BNG_TEST_SUPABASE=1 and owner login variables BNG_TEST_ADMIN_EMAIL / BNG_TEST_ADMIN_PASSWORD, then run npm run test:commerce and npm run test:e2e. Without those settings, external verification is explicitly skipped.
