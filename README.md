# Boys & Girlz

A mobile-first e-commerce frontend for kids' clothing, accessories, maternity wear, and toys. The visual system follows the supplied Boys & Girlz reference: warm cream surfaces, powder blue, blush pink, soft gold, rounded cards, generous spacing, and playful details.

This is a frontend demo. It uses mock catalog data, browser state, and `localStorage`; it has no backend, account service, payment processor, or order database.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Other useful commands:

```bash
npm run build
npm test
npm run test:e2e
```

## Included experience

- Responsive home, shop, six category pages, product detail, cart, checkout, wishlist, about, contact, shipping, returns, and size-guide routes
- 28 realistic mock products with size, color, price, sale, review, and category data
- Search suggestions, category/price/size/color/sale filters, and sorting
- Persistent variant-aware cart and wishlist with validated `localStorage` recovery
- Three-step shipping → payment → review demo checkout and clear demo-only disclosures
- Photo-led hero and product galleries with close-up views
- Card tilt/flip, fly-to-cart motion, heart particles, route depth wipe, and GSAP scroll reveals
- Reduced-motion fallbacks and responsive image presentation
- Semantic controls, keyboard-accessible dialogs, focus styles, status announcements, and alt text
- Browser WebMCP tools for product search, product navigation, cart additions, and wishlist updates when the experimental API is available

The demo promo code is `LITTLELOVE10`.

## Project structure

```text
src/
  components/       Shared navigation, cards, drawers, viewers, motion, WebMCP
  data/             Typed mock product catalog
  hooks/            Motion and device capability helpers
  pages/            Route-level storefront screens
  state/            Cart/wishlist context and pure reducer logic
public/
  assets/            Local hero and product photography
tests/
  browser/           End-to-end storefront journeys
  store.test.mjs     Cart persistence and pricing tests
```

## Production notes

Product specifications, reviews, shipping policy, returns policy, toy age guidance, and checkout are explicitly marked as samples. Replace them with verified business data before launch. Connect the existing state actions to real services only after backend, identity, inventory, tax, shipping, and payment requirements are defined.
