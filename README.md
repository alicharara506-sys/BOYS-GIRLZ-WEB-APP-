# Boys & Girlz

A mobile-first merchandising shop frontend for kids' clothing, accessories, maternity wear, toys, and Like New outlet finds. The visual system follows the approved Boys & Girlz homepage mockup: the illustrated B and G characters, sky blue and pink feature panels, warm cream surfaces, lighter product cards, and compact mobile navigation.

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

- Responsive home, shop, seven category pages, product detail, cart, checkout, wishlist, about, contact, shipping, returns, and size-guide routes
- Mock products with size, color, price, sale, review, and category data, including four featured products styled after the approved mockup
- Search suggestions, category/price/size/color/sale filters, and sorting
- Persistent variant-aware cart and wishlist with validated `localStorage` recovery
- Three-step shipping → payment → review demo checkout and clear demo-only disclosures
- Illustrated logo-character hero, dedicated Boys/Girls panels, product galleries, and close-up views
- Animated logo loading sequence, category parallax, card tilt/flip, product image reveals, fly-to-bag motion, animated outlet banner, button and newsletter interactions, branded route transitions, and GSAP scroll reveals
- Continuous, pause-on-hover ribbon featuring the shop's carried brands
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
  assets/            Local logo artwork, featured product imagery, and catalog photography
tests/
  browser/           End-to-end storefront journeys
  store.test.mjs     Cart persistence and pricing tests
```

## Production notes

Product specifications, reviews, shipping policy, returns policy, toy age guidance, and checkout are explicitly marked as samples. Replace them with verified business data before launch. Connect the existing state actions to real services only after backend, identity, inventory, tax, shipping, and payment requirements are defined.
