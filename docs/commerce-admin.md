# Boys & Girlz owner workspace

The existing React / TypeScript / Tailwind storefront now has a connected owner app at `/admin`. It uses a Node.js Express server, PostgreSQL, Prisma, and Recharts. One shop, one owner, one shared inventory pool. The confirmed configuration is **USD only, no tax, cash on delivery and Whish**. This delivery is a **local demo**.

## Start on this computer

Node.js 24 is required. Windows x64, macOS, and common Linux platforms can use the bundled PostgreSQL launcher; Docker is optional.

```sh
npm install
npm run setup
npm start
```

After setup, **`npm start` is the single command**. Open <http://127.0.0.1:5181/admin>. It starts real PostgreSQL on loopback port 55432 and the app on 5181. No cloud account is required. Setup runs tracked migrations, an idempotent sample-data seed, and the owner-login bootstrap. Running setup again preserves data and the login.

The default username is `owner@boysandgirlz.local`. The password is generated per installation and saved privately in `.data/admin-login.txt`. Existing owner credentials are preserved. Passwords are stored as salted scrypt hashes; the generated password file is ignored by Git. Alternatively set `BNG_ADMIN_EMAIL`, `BNG_ADMIN_PASSWORD` (16+ characters), and `BNG_SESSION_SECRET` (32+ characters) in the ignored `.env`. One account only; no roles or user-management screens. Changing the login environment requires restarting the server.

For an existing PostgreSQL server, set `DATABASE_URL` **before setup**. This bypasses the bundled local PostgreSQL process. Use a dedicated empty database; the seed is explicitly sample data. `BNG_ADMIN_DATA_DIR` changes the private data directory; `BNG_POSTGRES_PORT` changes the bundled database port; `PORT` changes the web port.

Build and production preview:

```sh
npm run build
npm run start:production
```

The legacy `npm run dev` / `npm run preview` commands retain the earlier SQLite review mode for compatibility. Use `npm start` or `npm run start:production` for the connected PostgreSQL app. The legacy `.data/admin.sqlite` is preserved, **not automatically merged** with the new database. Public hosting, TLS, backups, remote admin access and payment-provider onboarding are separate deployment work; this server binds to loopback and the owner login rejects public hosts.

## What to try

1. Review the dashboard, then open **Cash drawer** with an opening float.
2. Open **Point of sale**, choose a product and its size/color, or scan a matching SKU/barcode followed by Enter. Keyboard-wedge USB/Bluetooth scanners are supported; camera scanning is not implemented.
3. Choose a customer, apply line/sale discounts or points, then pay with cash, card, Whish, store credit, gift card, or split payments. These are **recorded demo payments**; no funds are charged. Cash received and change appear before completion.
4. Open the receipt to print / save PDF or prepare an email in your email client. Nothing sends automatically. Hold a cart and resume it through Parked sales.
5. Visit the connected public storefront at `/shop`, or use **Orders → Simulate online order**. Both paths decrement the same inventory and use the same customers. Website Whish requests remain unpaid until the owner confirms collection.
6. Move online orders through pending / paid / packed / shipped / delivered. COD may go from pending to packed before collection. Cancellation restores stock, refunds recorded payment buckets, reverses points and journal entries.
7. Use **Returns & exchanges** with a completed receipt. Partial returns retain discounts and cents correctly. A named customer can exchange an item using store credit, with an additional payment if needed. The return and replacement save in one transaction. Delivery fees are nonrefundable in the demo policy.
8. Create or edit products with separate in-store/online prices, age/color matrices, brand, season, cost and publishing controls. Upload images, edit each variant's SKU/barcode, adjust inventory with a reason, and print real CODE128 barcode labels. Archive is reversible and is the supported delete workflow.
9. Add suppliers and purchase orders. Stock and payable are posted **when goods are received**, not when the PO is drafted. Receive once, pay partially or fully, and track supplier invoices.
10. Add customer families with children, birthdays, sizes and tags. View cross-channel purchase history, lifetime spend, points and credit. Marketing segments support birthday-month, 90-day size-up, school-age, and tags. Export lists or simulate sending. No SMS or email provider is connected.
11. Record expenses and inspect balanced journals / the chart of accounts. Filter reports by UTC date, export CSV, or print / save PDF. Close the cash drawer with a physical count to save its Z-report and book variance.

## Demo defaults and boundaries

- Sample catalog: 12 products, age/color variants, 5 fictional customers, 28 fictional orders, 2 sample suppliers and balanced opening journals. Generated sample phone/email contacts are not real recipients. `WELCOME10` gives 10% off. `DEMO-GIFT-50` starts with $50.
- Shipping: $5, free at $100. Owner has not confirmed delivery fees/areas; these are editable demo values, not published business policy.
- Loyalty: 1 point per $1 of net items; 1 point = 1 cent. Points are allocated on accepted orders and reversed on cancellation/returns. Previously spent earned points can leave a negative points balance after a refund; redemption requires sufficient points. Customer store credit cannot become negative.
- Return window: 30 days. Shipping is retained. Returned sellable stock is restored; damaged returns do not restore stock. Refunds restore the appropriate portion of redeemed points. Exchanges require a customer on the original sale.
- No VAT/sales tax is calculated. The tax-payable ledger account is retained for later extension.
- Accounting uses accrual entries: accepted COD sales debit receivables, then collection moves the balance to cash/card/Whish. Product/channel summaries group by original sale date and net subsequent returns; P&L groups entries by journal date. Inventory valuation uses live available stock and rounded weighted-average cost, independent of sales dates. Per-unit cent rounding can produce a small inventory-asset reconciliation difference.
- Cash drawer opening float allocates existing cash; it does not create sales or new money. Cash expenses, supplier payments, gift issues, sales, collections, refunds and variance are included in reconciliation while a drawer is open.
- Live Whish collection requires a merchant agreement, merchant credentials and verified server callbacks. The adapter intentionally does not claim that a payment succeeded. Card payments also require a real terminal/provider integration. Email receipts use a mail draft; campaigns use mock sending.
- Protected online-order simulation supports loyalty and the same server payment contract. Public visitors cannot spend a customer's points, store credit or gift card through an unverified customer identity. A verified customer checkout would be required for that public flow.
- Browser print dialogs provide PDF output for receipts, packing slips, Z-reports and reports. Barcode labels print from the current inventory filter.

## Integrity and module layout

`prisma/schema.prisma` defines products/variants, customers/children, sales/lines/payments/returns, drawers, stock movements, suppliers/purchases/payments, journals/accounts, rewards, settings and campaigns. Tracked migrations include nonnegative stock/balance checks and a unique open-drawer constraint.

`src/server/commerce/` contains Prisma access, validation/rules, transaction services, ledger posting, product/CRM/purchase operations, dashboard/report queries, CSV exports, and adapter interfaces. `StorefrontAdapter` and `PaymentAdapter` define extension seams for Shopify/WooCommerce/custom storefronts and verified payment providers; those services are not connected in the demo.

`src/admin/commerce/` contains the responsive shell and module screens. The existing `src/routes/admin.tsx` authenticates every loader and action, checks same-origin CSRF, and dispatches validated commands. `/admin/export` is an authenticated resource route. Private data is not cached or indexed. The public storefront receives only published product fields, not customers or accounting records.

Sales, exact-variant stock checks, discounts, gift/credit redemption, points, payments, order lines and balanced journals use a serializable database transaction with bounded conflict retries. Request keys make sales and returns idempotent. A failed exchange rolls back both the return and replacement. Server prices and snapshots are authoritative. Barcode uniqueness and item-return limits are validated. Money uses integer USD cents.

## Verification

```sh
npm test
npm run lint
npm run build
npm run test:commerce
npm run test:e2e
```

`test:commerce` creates a separate PostgreSQL cluster under `.data/commerce-test-*` on port 55433, applies migrations and seeds, runs transaction integration tests and browser workflows on 5482, then stops its server/cluster. It never changes the owner's demo records. Test databases are retained privately for diagnosing failures; they are not committed. Chrome is used locally; install Playwright Chromium for CI. The original browser suite continues to test the legacy storefront review mode separately.

Back up the PostgreSQL database with `pg_dump` and the uploads folder before using real data. Do not delete `.data` to reset a password or reseed a live database. A real-data rollout needs an explicit migration/import plan from the earlier local admin, operational backup/restore verification, and real payment/delivery configuration.
