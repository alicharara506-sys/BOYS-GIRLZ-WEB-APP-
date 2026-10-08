# Launch-ready review notes

This branch is a draft. It must not be deployed until the business facts, real catalog, payment and fulfillment flows are approved and tested against a configured backend.

## Phase 1 — routing and SEO foundation

- Migrated the existing URLs to React Router framework mode with server rendering and prerendered HTML for current catalog, category, home, About, Contact, FAQ and help pages.
- Unknown pages, products, categories and help topics return HTTP 404.
- Added route titles, descriptions, Open Graph and Twitter tags, optional canonical URLs, site-wide Organization/ClothingStore structured data, an FAQ page, robots.txt and llms.txt.
- Added ESLint, a Playwright web server, an SSR/no-JavaScript and 404 browser test, a GitHub Actions verification workflow, and an error boundary.
- Removed the eight-second blocking loading screen. Shopping is available immediately.

**Still needed:** Set `VITE_PUBLIC_SITE_URL` to the confirmed production domain to emit canonical URLs and sitemap.xml. Product and BreadcrumbList structured data must use the verified live catalog, not the current mock products. Confirm contact, delivery and returns facts before publishing the FAQ.

**Verify:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build`. Request `/product/fleece-bear-overall` without JavaScript and confirm its title and H1 are in HTML; request an unknown product and confirm HTTP 404.

## Remaining phases

- **Backend draft:** Added a Supabase SQL migration with published-catalog read policies, an unpublished/zero-stock seed, server-side stock-locked Cash on Delivery orders, server promo and shipping validation, and contact/newsletter storage with a honeypot and rate limiting. The client-side demo card, fake order confirmation, revealed promo code and client promo arithmetic are removed. Unit tests cover totals, promo, stock and order creation. No migration has been applied because no approved Supabase project or credentials were supplied. No email has been sent; the order email outbox still needs a configured provider and worker. The admin area is not yet implemented.
- **Catalog draft:** Added approved brand data, separate condition/gender/type attributes to the preview data, Sale and Outlet as distinct paths, and URL-backed category, price, size, color, search and sort filters. The seed catalog remains deliberately unpublished; real descriptions, supplier photos, SKU stock, product brands and size measurements are missing. Existing preview pages still read `src/data/products.ts`, so database-backed catalog migration is incomplete.
- **Experience:** Checkout is now a Lebanon-address Cash on Delivery form and only accepts orders when backend, delivery fee, and notification settings are configured. Contact and newsletter forms persist only after configuring the database and rate-limit key. WhatsApp and policy/contact facts remain pending.
- **Visual identity:** Removed the rejected placeholder 3D toy-box, category-room, and product-pedestal models. The homepage now animates the original transparent B and G logo artwork without changing its pixel colors; Boys and Girls category headers show their corresponding original character. The sampled source colors are blue `#00B3FC` and pink `#FC538E`, used for the nearby visual accents. Any future true 3D character work needs approved brand-faithful assets.
- **Performance:** Optimize images, fonts, styles, JavaScript and measure Lighthouse/Core Web Vitals on target devices.

The following business details still need confirmation: phone/WhatsApp number, address, opening hours, returns policy, delivery fee, delivery estimate, production domain, whether Arabic and LBP display are required, and verified product/brand ownership and stock. `SHIPPING_FEE_CENTS` has no default for live checkout; no order can be accepted without it. The 35 preview products have no verified three-image sets or supplier measurements. They remain unpublished and zero stock in `supabase/seed.sql`.
