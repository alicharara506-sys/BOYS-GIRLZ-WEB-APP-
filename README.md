# Boys & Girlz

A kidswear storefront and connected single-owner dashboard for POS, shared inventory, ecommerce orders, CRM, loyalty, suppliers, purchases and accounting. The existing React / TypeScript / Tailwind storefront is retained; the owner workspace uses Express, PostgreSQL, Prisma and Recharts.

The connected app starts with clearly marked demo data. Prices are USD with no tax. Cash on delivery and Whish requests are supported; payments are recorded for testing and no funds are collected. The previous SQLite admin / static catalog preview remains available separately through the legacy dev commands. See [the complete owner guide](docs/commerce-admin.md).

## Run locally

Requirements: Node.js 24 and npm.

```bash
npm install
npm run setup
npm start
```

Open <http://127.0.0.1:5181/admin>. The default username is `owner@boysandgirlz.local`; your installation's generated password is stored privately in `.data/admin-login.txt`. After setup, `npm start` runs the database and app together. Other useful commands:

```bash
npm run build
npm test
npm run test:e2e
```

## Included experience

- Responsive home, shop, eight category pages, product detail, cart, checkout, wishlist, about, contact, shipping, returns, and size-guide routes
- English and Arabic storefront with a persistent header language switch, server-rendered `lang`/`dir`, Arabic product and policy copy, and full RTL desktop/mobile layout
- Mock products with size, color, price, sale, review, and category data, including four featured products styled after the approved mockup
- Search suggestions, category/price/size/color/sale filters, and sorting
- Persistent variant-aware cart and wishlist with validated `localStorage` recovery
- Optional WhatsApp chat and order-request handoff from products, bag, and checkout when the confirmed shop number is configured
- Three-step shipping → payment → review Cash on Delivery interface with an explicit unconfigured state
- Original illustrated B and G artwork in the hero; the corresponding original letter appears on each Boys/Girls category page
- Logo entrance, product image reveals, fly-to-bag motion, animated outlet banner, button and newsletter interactions, branded route transitions, and GSAP scroll reveals
- Continuous, pause-on-hover ribbon featuring the shop's carried brands
- Reduced-motion fallbacks and responsive image presentation
- Semantic controls, keyboard-accessible dialogs, focus styles, status announcements, and alt text

The demo promo code is `LITTLELOVE10`.

## Project structure

```text
src/
  components/       Shared navigation, cards, drawers, logo-art scenes, and motion
  data/             Typed mock product catalog
  hooks/            Motion and device capability helpers
  i18n/             Arabic translations and persisted language setting
  pages/            Route-level storefront screens
  state/            Cart/wishlist context and pure reducer logic
public/
  assets/            Local logo artwork, featured product imagery, and catalog photography
tests/
  browser/           End-to-end storefront journeys
  store.test.mjs     Cart persistence and pricing tests
```

## Production notes

Product specifications, stock, photos, shipping and returns terms, and toy age guidance must be verified before launch. See [SETUP.md](SETUP.md) and [CHANGES.md](CHANGES.md) for the unfinished backend and business inputs.
