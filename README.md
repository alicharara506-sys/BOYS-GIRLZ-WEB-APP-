# Boys & Girlz

A mobile-first merchandising shop frontend for kids' clothing, accessories, maternity wear, toys, and Like New outlet finds. The visual system follows the approved Boys & Girlz homepage mockup: the illustrated B and G characters, sky blue and pink feature panels, warm cream surfaces, lighter product cards, and compact mobile navigation.

The visible catalog still uses mock product data and local cart/wishlist state. This branch also includes an unconfigured Supabase order and contact draft; no live orders are accepted without approved credentials, inventory, delivery fees, and notifications. There is no real payment processing.

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
