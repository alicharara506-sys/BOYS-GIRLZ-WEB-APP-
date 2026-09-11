# Boys & Girlz

A 3D-first, mobile-first e-commerce frontend for kids' clothing, accessories, maternity wear, and toys. The visual system follows the supplied Boys & Girlz reference: warm cream surfaces, powder blue, blush pink, soft gold, rounded cards, generous spacing, and playful details.

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
- React Three Fiber hero and interactive product viewer with orbit, rotation, zoom, reset, and auto-rotate controls
- 3D card tilt/flip, fly-to-cart motion, heart particles, route depth wipe, and GSAP scroll reveals
- Reduced-motion and low-power fallbacks, capped canvas DPR, lazy-loaded scenes, and visibility-aware rendering
- Semantic controls, keyboard-accessible dialogs, focus styles, status announcements, alt text, and ARIA labels for 3D controls
- Browser WebMCP tools for product search, product navigation, cart additions, and wishlist updates when the experimental API is available

The demo promo code is `LITTLELOVE10`.

## Project structure

```text
src/
  components/       Shared navigation, cards, drawers, viewers, motion, WebMCP
  data/             Typed mock product catalog
  hooks/            Motion and device capability helpers
  pages/            Route-level storefront screens
  scenes/           React Three Fiber scenes and procedural preview models
  state/            Cart/wishlist context and pure reducer logic
public/
  assets/            Local hero and product photography
  models/            Vendored GLB files and licenses
tests/
  browser/           End-to-end storefront journeys
  store.test.mjs     Cart persistence and pricing tests
```

## Replacing placeholder 3D models

1. Optimize the real product model as a `.glb` with embedded textures. Keep individual files small; compress geometry and resize textures before shipping.
2. Place it in `public/models/products/` and preserve its license or supplier attribution beside the asset.
3. Add its public path to the product's `modelUrl` in `src/data/products.ts`.
4. In `src/scenes/Models.tsx`, load it with `useGLTF`, clone the scene before changing materials, and normalize its scale and center with Drei's `Center` component.
5. Keep `ProductImage` as the fallback for reduced-motion, low-power devices, and model-load failures.

The included Duck model is © 2006 Sony under the SCEA Shared Source License 1.0 and is distributed through Khronos glTF Sample Assets. Its license is included at `public/models/licenses/SCEA.txt`.

## Production notes

Product specifications, reviews, shipping policy, returns policy, toy age guidance, and checkout are explicitly marked as samples. Replace them with verified business data before launch. Connect the existing state actions to real services only after backend, identity, inventory, tax, shipping, and payment requirements are defined.
