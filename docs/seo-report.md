# Boys & Girlz — SEO, AEO and GEO implementation report

Public domain confirmed by the owner: **https://boysandgirlz.com**. This report covers the `website-cleanup` source branch and local production build. It does not claim that DNS, hosting, search-console verification or live deployment has been completed.

## Audit and complete page tables

The audit was completed before implementation. Framework: React Router 7, React 19 and Vite, with route metadata in `src/routes` and `src/config/meta.ts`. The initial implementation used SSR plus English path-based prerendering. Important content was already in HTML. Missing items included a production URL, canonicals, social preview images, sitemap modification dates, breadcrumbs, reliable language URLs, private-page noindex and analytics hooks. Cookie-only Arabic content and an unverified physical-store schema needed correction.

- [Before-change audit: all 55 content and user-state paths](seo-audit-before.md)
- [Final table: URL, title, description, actual H1, schema and indexability for every page in both languages](seo-pages.md)

The final table was generated from **110 server responses**, parsing their actual HTML and JSON-LD. There are 52 public content paths plus cart, checkout and wishlist, in English and Arabic. Form endpoints and invalid URLs are documented separately. The headings in the table are the rendered headings, including the empty-bag checkout state.

## SEO changes

- Shared bilingual page metadata: unique titles up to 60 characters, descriptions up to 155 characters, one H1 per rendered page, descriptive category/product titles, and individual delivery/returns/sizing descriptions.
- Canonicals use the confirmed HTTPS non-www domain. Tracking, search and filter parameters are excluded from canonical links. Arabic has a self-referencing `?lang=ar` canonical; English uses the clean URL. Application normalization redirects trailing slashes, unsupported language parameters and public-domain www/HTTP variants. Host/CDN redirects and TLS still need live verification after deployment.
- Reciprocal `en`, `ar` and `x-default` hreflang tags. Internal links, programmatic navigation and filter resets preserve the selected language. Language switching updates the URL and metadata; saved cookies cannot change the HTML of a crawlable URL.
- **Server rendering for every page**, including Arabic. Production testing showed that path-only static prerender files could serve English for `?lang=ar`; prerendering was removed to prevent that mismatch. Hosting must run the Node server rather than serve the build as a static-only site.
- Open Graph and Twitter metadata use the existing 1600 × 800 logo image as the default share image.
- `robots.txt` allows search and AI crawlers, including GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and Google-Extended through `User-agent: *`. It points to the sitemap. Cart, checkout and wishlist are crawlable with `noindex`, allowing crawlers to read that directive.
- XML sitemap includes **34 URLs**: 17 indexable paths in two languages, reciprocal language annotations and actual Git content modification dates. No build-date fabrication. Demo product details are excluded until verified.
- Unknown pages, products, categories and help topics return HTTP 404 with noindex metadata and links to useful pages. `/newsletter` is an action-only endpoint whose GET response is 404 with an `X-Robots-Tag: noindex, nofollow` header.
- Existing logo/character graphics use lossless WebP copies. Product sprite cells became individual WebP images with descriptive alt text, dimensions, asynchronous decoding and native lazy loading; the main product-detail image loads eagerly. The twelve preview images total about **470 KB**, compared with the original two sheets totaling **3.83 MB**. This preserves the existing previews; it does not turn them into verified product photos.
- Helpful links connect FAQs, delivery, sizing, returns, contact and shopping pages. Help cards now use semantic H2 headings with the existing visual styling.

Core Web Vitals field scores are not claimed: LCP, CLS and INP must be measured on the deployed domain with PageSpeed Insights and real-user data. The source improvements reduce image transfer and defer below-the-fold downloads without replacing the approved artwork.

## Structured data

- `Organization` and `WebSite` share stable identifiers, name, logo, URL, the configured public contact number and social profiles. `SearchAction` uses the actual `/shop?q=` search.
- Every valid inner page has `BreadcrumbList`; shop/category pages have `CollectionPage`.
- The FAQ page has `FAQPage`, generated from the exact questions and answers used by the visible page. Filtered FAQ markup follows the displayed results. Collapsed answers are present in the initial HTML.
- A physical `ClothingStore`, postal address, coordinates, hours and founding year are emitted only when the corresponding confirmed fields are provided. The current configuration correctly uses `Organization` without invented premises or history.
- Repository setup documentation explicitly calls the catalog mock data. Product details therefore stay `noindex` and omit `Product`/`Offer` until the owner verifies them and sets `VITE_CATALOG_VERIFIED=true`. The verified-data path supports actual product names, categories, condition and listed offers; it invents no ratings, reviews, stock availability or photographic evidence.

JSON-LD syntax and route-level contracts were tested locally. Google's hosted Rich Results Test remains a post-deployment check; a valid schema does not promise a particular search display.

## AEO changes and final FAQ wording

Existing customer questions remain on `/faq`; duplicate question-style headings on About were replaced with descriptive headings. Answers begin directly, use the current site facts and contain 40–60 English words. Brand headlines and design remain intact. Help pages link to the relevant information without publishing duplicate FAQ questions or unsupported policies.

1. **Where does Boys & Girlz deliver?**

   Boys & Girlz delivers within Lebanon only, with free delivery on orders over $99 before promo discounts. For the current delivery estimate or charges on a smaller order, contact the shop before ordering; availability, delivery charges and the final total are confirmed with the shop.

2. **Can I pay on delivery?**

   Yes, Cash on Delivery is available for Boys & Girlz orders within Lebanon. If you request an order through WhatsApp, the shop confirms product availability, the delivery charge and the final total before the order is placed, so check those details in the conversation.

3. **What is the returns policy?**

   The Boys & Girlz returns and exchanges policy has not been confirmed for publication yet. Contact the shop before ordering to ask about eligibility, time limits and any conditions for the items you want; the website does not currently publish a confirmed return window.

   This explicit fallback is replaced by the owner's configured `VITE_RETURNS_POLICY` once supplied. Its Arabic version must also be reviewed when a new policy is supplied.

4. **How do I choose a size?**

   Check the available sizes for each item and ask Boys & Girlz for garment measurements before ordering. The children's size filters run from New Born to 5–6 Years, while maternity filters use S to XXL; availability and fit depend on the individual product and brand.

5. **What does Like New mean?**

   Like New outlet items are pre-owned pieces in excellent condition offered at reduced prices by Boys & Girlz. Before ordering, ask the shop for current photos, condition details and availability for the particular item, along with any measurements you need to check its fit.

The corresponding Arabic answers are included in the translation data and rendered server-side. No answers were invented for missing return windows, delivery times or other unconfirmed details.

### Ten suggested questions — not published

1. How long does delivery take to my area?
2. What is the delivery fee below the free-delivery threshold?
3. Can I collect my order in person?
4. What are your opening and customer-service hours?
5. How many days do I have to request a return or exchange?
6. Which items are excluded from returns?
7. How do you check and describe Like New items?
8. Can you send current product photos and garment measurements?
9. Which payment methods are accepted besides Cash on Delivery?
10. How do I change or cancel an order after contacting the shop?

## GEO changes

About now states the shop's offering, Lebanon service area, ordering/contact method and links to supporting pages in plain text. WhatsApp **+961 81 061 731** is formatted from the same configuration used throughout the site; machine-readable schema uses **+96181061731**. These are the same number. Missing street address, hours, city, email and founding history remain absent rather than guessed.

`/llms.txt` contains a short factual business summary, explicit preview-catalog limitations, and absolute Markdown links to key English and Arabic pages. It is an optional convention, not a ranking mechanism. Google states that existing SEO practices remain relevant to AI results and that special AI files or markup are not required. [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features)

The brief's FAQ-rich-result note is now outdated: Google stopped displaying FAQ rich results in May 2026 and removed that feature's documentation in June. FAQ content and schema are retained for accurate answers and machine-readable meaning, without promising search features. [Google's documented FAQ retirement](https://developers.google.com/search/updates#june-2026)

## Analytics and verification settings

`.env.example` documents optional public values:

- `VITE_GA_MEASUREMENT_ID` — GA4 ID; blank means no analytics script or requests. When configured, the script loads asynchronously and records SPA page views without query strings/fragments. Advertising signals are disabled.
- `VITE_GOOGLE_SITE_VERIFICATION` — Search Console HTML verification token.
- `VITE_BING_SITE_VERIFICATION` — Bing Webmaster Tools HTML verification token.

No analytics accounts, IDs or private secrets were invented. Configure applicable consent/privacy requirements before enabling analytics for visitors. Use environment settings at **build time**, because Vite embeds these public values in the build.

## Owner TODOs

1. Confirm the exact city/street address and whether customers can visit a physical location. Supply confirmed coordinates only if appropriate. Until then, no physical-location claims are published.
2. Supply opening/customer-service hours, public email, any separate voice phone and the founding year if you want those published.
3. Confirm delivery times, delivery charges, the free-shipping terms and full returns/exchanges eligibility, deadlines and exclusions. Review both English and Arabic policy wording. Existing checkout behavior was preserved.
4. Verify every catalog product's identity, descriptions, brand, images, prices, stock, sizes, condition and toy safety/age claims. Replace the demo catalog and preview photography. Only then enable `VITE_CATALOG_VERIFIED=true` and rebuild to allow product indexing and Product/Offer markup.
5. Provide GA4 and verification values if desired. Confirm control of the domain and connect it to the SSR host. The SEO work does not purchase or configure hosting/DNS.
6. Confirm the preferred target searches and local city focus. Current metadata uses existing factual categories and Lebanon; it does not invent a local address or publish city-specific landing pages.

## Validation and deployment steps

- Production build and TypeScript checking passed.
- ESLint and 19 unit tests passed.
- All 14 browser tests passed, covering desktop/mobile Arabic, shopping, checkout safeguards, logo preservation, SSR, FAQ/schema consistency and real 404 responses. Final changed paths received focused regression checks as well.
- The production HTML audit checked 110 bilingual responses, one H1 per page, canonical/hreflang tags, JSON-LD, and internal page links.
- Additional HTTP checks cover query canonicalization, trailing-slash redirects, error-page noindex and cookie-independent language HTML.

After deploying:

1. Deploy the Node SSR build using `npm run build` and `npm run preview` (or the equivalent Node host command), set the public environment values, and connect **boysandgirlz.com** with HTTPS. Redirect www/HTTP at the host/CDN too; check redirects on the live domain. Do not publish only `build/client` on static hosting.
2. Verify the domain in [Google Search Console](https://search.google.com/search-console/) and [Bing Webmaster Tools](https://www.bing.com/webmasters/). Submit **https://boysandgirlz.com/sitemap.xml** in both. Check that `/robots.txt`, `/sitemap.xml` and `/llms.txt` return 200.
3. Use URL Inspection for the homepage, a category, FAQ and Arabic equivalents. Confirm the fetched HTML is in the correct language and the selected canonical is correct. Product detail noindex remains intentional while the catalog is unverified.
4. Claim/update [Google Business Profile](https://www.google.com/business/) if the business meets its eligibility rules. Use the exact confirmed business name, address and contact details; do not create an unverified storefront address.
5. Test live pages with [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema.org Validator](https://validator.schema.org/). FAQ markup is not a promise of a Google FAQ rich result.
6. Run [PageSpeed Insights](https://pagespeed.web.dev/) for the homepage, category, product and Arabic pages on mobile and desktop. Review LCP, CLS and INP after traffic supplies field data. No synthetic or field score is claimed in this report.
7. Monitor indexing, crawl errors, canonical selection and search performance after deployment. Rankings, featured snippets and AI citations are determined by the platforms, not guaranteed by this implementation.

Reproduce the page audit against a running server with `python scripts/audit-seo.py http://127.0.0.1:5181`. Run `npm test`, `npm run lint`, `npm run test:e2e` and `npm run build` for validation. Crawl outputs are regenerated before each build; `lastmod` comes from actual content commits, not build time.
