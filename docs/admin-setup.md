# Boys & Girlz admin panel

Open http://127.0.0.1:5181/admin. The local owner credentials are in `.data/admin-login.txt`. This entire data directory is ignored by Git. `node scripts/create-admin.mjs` creates credentials once and never overwrites an existing account.

## Available features

- Overview with actual product, inventory, order and customer totals.
- Products: create/edit, image upload (PNG/JPG/WebP/GIF up to 5 MB), prices, comparison prices, categories, descriptions, size/color variants, draft/publish, archive and restore.
- Inventory: persistent stock counts for each size/color variant.
- Orders: customer/address/item snapshots, server-calculated totals and controlled pending → confirmed → packed → delivered transitions. Cancellation restores stock once.
- Customers: contacts and order/spend summaries from actual local orders.
- Discounts: percentage/fixed codes, minimum subtotal, usage cap, expiry, activation/deactivation.

The initial 35 products are draft catalog inputs with zero stock. No orders or customers are manufactured. Publishing the first product switches this local storefront from its mock preview to your published catalog. Unpublishing everything leaves an empty managed catalog. Stock must be entered before an item becomes available to order. Refresh an already-open storefront tab after administration changes.

Published local products can be ordered through the local checkout. Orders are saved on this computer, stock and promo uses update atomically, and new customers appear in admin. These are review orders; no payment is processed and no email or WhatsApp message is sent by checkout. Existing WhatsApp enquiry links still require you to send the prepared message yourself.

## Storage and access

- `.data/admin.sqlite`: persistent local products, variants, discounts, customers and orders.
- `.data/uploads/`: uploaded product images.
- `.data/admin-credentials.json`: salted scrypt hash and random signing secret.
- `.data/admin-login.txt`: private initial login details for the owner.
- Sign-in uses signed HttpOnly/SameSite cookies, CSRF/origin checks, expiry, login rate limits and revocable sessions. Restarting the server requires signing in again.
- Admin and local review data are restricted to localhost/127.0.0.1/::1. Public-domain requests cannot access this review admin. Admin responses use private/no-store and noindex headers.

Back up the local data directory privately if you need to retain this review data. Do not upload credentials, customer records or the SQLite database to GitHub.

## Run and test

Use Node.js 24. `npm run build`, then set `PORT=5181` and run `npm run preview`, or use `npm run dev -- --port 5181`. The application renders on the server; deploy-ready public content remains separate from local review data.

Tests use isolated temporary credentials/databases. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e` and `npm run build`. Browser tests exercise actual admin forms, uploaded images, persisted stock, discounts, archive/restore, CSRF rejection and logout.

## Before live deployment

This is a working local admin, not a connection to an already configured live store. Choose the approved production database/storage and authentication setup, migrate verified catalog data, replace loopback-only access with production account authorization, and connect live orders/notifications before using it for customers. The existing PostgreSQL/Supabase draft schema has not been applied to any external database by this change. The public storefront's existing unconfigured-live-checkout safeguards remain in place outside local managed mode.
