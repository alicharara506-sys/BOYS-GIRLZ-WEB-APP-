# Specification mapping and verification

| Specification area | Actual repository path | Change |
|---|---|---|
| Shared schema, policies, decimal projections, catalog notifications, Storage | supabase/migrations/202611040001_shared_shop.sql and 202611040002_access_and_storage.sql | EXTEND |
| Auth and owner session | src/server/admin-auth.server.ts and supabase.server.ts | EXTEND |
| Transactional sales, quick lines, negative stock, cost snapshots | src/server/commerce/sales.server.ts and rules.ts | EXTEND |
| Product discounts | src/domain/pricing.ts and src/admin/commerce/Products.tsx | EXTEND |
| Inline shops/categories | src/admin/commerce/InlineSelect.tsx and operations.server.ts | EXTEND |
| Six metrics and liabilities | src/admin/commerce/FinancialCards.tsx, Liabilities.tsx, src/domain/financials.ts | EXTEND |
| Shared public catalog and live refresh | src/server/commerce/queries.server.ts and src/components/CatalogRealtime.tsx | EXTEND |
| Images | src/server/admin-media.server.ts | EXTEND |
| WhatsApp queue, QR login and recipient persistence | src/server/whatsapp.server.ts and src/admin/commerce/WhatsAppCampaigns.tsx | EXTEND |
| Brand tokens | src/brand-tokens.css | EXTEND |

The previous local-database paths, newsletter submission endpoint, legacy campaign sender and unsupported checkout method were removed. Prisma remains an ORM targeting only the configured Supabase project; it is not a second database. The public read path uses Supabase's anon client and never receives product cost fields. Column grants complement row policies. A safe revision table drives public refreshes without broadcasting private product columns.

Money fields retain integer cents internally to protect transaction integrity; public SQL decimal projections map price, cost_price, total, qty, unit_price and unit_cost to the specification's dollar amounts. Variant stock is authoritative and a trigger maintains aggregate products.stock. The existing 12 sample products and 60 variants were imported into the owner's new project, preserving their identifiers and stock. The earlier fictional customer and order history remains in the private backup.

Verification on the connected free project (2026-11-04): 19 local tests, both live service tests, the live browser workflow, TypeScript, lint and production build passed. Service checks cover anon visibility and private costs, owner Auth, Storage access policies and image download, negative stock, quick-sale identity, balanced journals and liability currency mapping. The browser workflow covers inline creation without losing form values, full variant creation, discounted POS-only and unlisted sales, public product hiding, and automatic storefront price refresh after an admin edit. Verification products are archived and test transactions are marked as samples.

Live checks are in tests/supabase.integration.test.ts and tests/supabase-browser/owner.spec.ts and require explicit test-project configuration. Real WhatsApp delivery still requires the owner to link the business phone and provide a consenting test recipient. No delivery has been claimed before that check.
