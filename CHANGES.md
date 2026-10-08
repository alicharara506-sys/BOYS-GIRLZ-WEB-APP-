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

- **Backend:** Supabase schema, RLS, stock-safe order action, email provider, contact/newsletter storage and admin require implementation and a configured project.
- **Catalog:** Replace mock data, classify each product by gender/age/type/brand/condition, and obtain verified product photos and measurements.
- **Experience:** Complete checkout, WhatsApp and contact flows with confirmed business facts.
- **3D:** Build the lazy-loaded Toy Box scene and static fallback within the stated asset and performance budgets.
- **Performance:** Optimize images, fonts, styles, JavaScript and measure Lighthouse/Core Web Vitals on target devices.
