import { categories, productById, products, type Product } from "../data/products.ts";

// This module is also used by the sitemap generator and SEO report. Keep it free of
// browser APIs and build-time environment access so the same facts are used everywhere.
export type SeoLanguage = "en" | "ar";
export type SeoKind = "home" | "page" | "collection" | "product" | "utility" | "error";
export type SeoOptions = { catalogVerified?: boolean };
export type Breadcrumb = { path: string; name: string };
export type PageSeo = {
  path: string;
  title: string;
  description: string;
  h1: string;
  kind: SeoKind;
  indexable: boolean;
  breadcrumbs: Breadcrumb[];
};

type PageCopy = { title: string; description: string; h1: string; label: string };
type PageDefinition = { kind?: SeoKind; en: PageCopy; ar: PageCopy };
const pages: Record<string, PageDefinition> = {
  "/": {
    kind: "home",
    en: { title: "Kids Clothes, Baby Essentials & Toys | Boys & Girlz", description: "Explore kids clothes, baby essentials, toys, maternity and Like New finds at Boys & Girlz. Delivery within Lebanon; Cash on Delivery available.", h1: "Little clothes, for big smiles.", label: "Home" },
    ar: { title: "ملابس أطفال وألعاب في لبنان | بويز آند غيرلز", description: "اكتشف ملابس الأطفال ومستلزمات الرضّع والألعاب وملابس الأمومة وقطع الأوتليت شبه الجديدة لدى بويز آند غيرلز. توصيل داخل لبنان ودفع عند الاستلام.", h1: "ملابس صغيرة، لفرحة كبيرة.", label: "الرئيسية" },
  },
  "/shop": {
    kind: "collection",
    en: { title: "Shop Kids Clothes & Baby Essentials | Boys & Girlz", description: "Browse children's clothing, baby essentials, toys, accessories, maternity and Like New outlet items at Boys & Girlz in Lebanon.", h1: "All the little things.", label: "Shop" },
    ar: { title: "تسوّق ملابس الأطفال ومستلزماتهم | بويز آند غيرلز", description: "تصفّح ملابس الأطفال ومستلزمات الرضّع والألعاب والإكسسوارات وملابس الأمومة وقطع الأوتليت شبه الجديدة لدى بويز آند غيرلز في لبنان.", h1: "كل ما يحتاجه الصغار.", label: "المتجر" },
  },
  "/about": {
    en: { title: "About Our Children's Shop in Lebanon | Boys & Girlz", description: "Learn about Boys & Girlz, a children's shop in Lebanon for kids clothes, baby items, toys, accessories, maternity and Like New finds.", h1: "For their firsts. And everything after.", label: "About us" },
    ar: { title: "عن متجر الأطفال في لبنان | بويز آند غيرلز", description: "تعرّف إلى بويز آند غيرلز، متجر في لبنان لملابس الأطفال ومستلزمات الرضّع والألعاب والإكسسوارات وملابس الأمومة وقطع الأوتليت شبه الجديدة.", h1: "للحظاتهم الأولى. ولكل ما يأتي بعدها.", label: "من نحن" },
  },
  "/brands": {
    en: { title: "Children's Clothing Brands in Lebanon | Boys & Girlz", description: "Explore the shop's confirmed brand directory, including Carter's, Disney, Gap and more. Ask Boys & Girlz about current products in Lebanon.", h1: "The brands we trust.", label: "Brands" },
    ar: { title: "علامات ملابس الأطفال في لبنان | بويز آند غيرلز", description: "اكتشف دليل العلامات التجارية المعتمد للمتجر، ومنها كارترز وديزني وغاب. تواصل مع بويز آند غيرلز للاستفسار عن المنتجات الحالية في لبنان.", h1: "علامات تجارية نثق بها.", label: "العلامات التجارية" },
  },
  "/contact": {
    en: { title: "Contact Boys & Girlz in Lebanon", description: "Contact Boys & Girlz on WhatsApp or social media about children's clothes, product details, sizing and delivery within Lebanon.", h1: "A little hello goes a long way.", label: "Contact" },
    ar: { title: "تواصل مع بويز آند غيرلز في لبنان", description: "تواصل مع بويز آند غيرلز عبر واتساب أو مواقع التواصل للاستفسار عن ملابس الأطفال وتفاصيل المنتجات والمقاسات والتوصيل داخل لبنان.", h1: "كلمة صغيرة تصنع فرقاً كبيراً.", label: "اتصل بنا" },
  },
  "/faq": {
    en: { title: "Delivery, Payment & Shopping FAQs | Boys & Girlz", description: "Find answers about delivery within Lebanon, Cash on Delivery, sizing, returns and Like New outlet shopping at Boys & Girlz.", h1: "Frequently asked questions", label: "Frequently asked questions" },
    ar: { title: "أسئلة التوصيل والدفع والتسوّق | بويز آند غيرلز", description: "إجابات عن التوصيل داخل لبنان والدفع عند الاستلام والمقاسات والإرجاع والتسوّق من الأوتليت شبه الجديد لدى بويز آند غيرلز.", h1: "الأسئلة الشائعة", label: "الأسئلة الشائعة" },
  },
  "/help/shipping": {
    en: { title: "Delivery in Lebanon & Cash on Delivery | Boys & Girlz", description: "Boys & Girlz delivers within Lebanon with Cash on Delivery. Orders over $99 qualify for free delivery; ask the shop about timing and charges.", h1: "Delivery in Lebanon", label: "Delivery in Lebanon" },
    ar: { title: "التوصيل في لبنان والدفع عند الاستلام | بويز آند غيرلز", description: "توصيل بويز آند غيرلز داخل لبنان مع الدفع عند الاستلام. التوصيل مجاني للطلبات فوق 99$؛ تواصل مع المتجر لمعرفة الموعد والرسوم الحالية.", h1: "التوصيل في لبنان", label: "التوصيل في لبنان" },
  },
  "/help/returns": {
    en: { title: "Returns & Exchanges Information | Boys & Girlz", description: "Contact Boys & Girlz before ordering for current return and exchange conditions. A confirmed returns policy has not yet been published.", h1: "Returns and exchanges", label: "Returns and exchanges" },
    ar: { title: "معلومات الإرجاع والاستبدال | بويز آند غيرلز", description: "تواصل مع بويز آند غيرلز قبل الطلب للاستفسار عن شروط الإرجاع والاستبدال الحالية. لم تُنشر بعد سياسة إرجاع مؤكّدة.", h1: "الإرجاع والاستبدال", label: "الإرجاع والاستبدال" },
  },
  "/help/sizing": {
    en: { title: "Baby, Kids & Maternity Size Guide | Boys & Girlz", description: "Browse baby and children's size guidance and maternity sizes S–XXL. Ask Boys & Girlz for item measurements before ordering in Lebanon.", h1: "Just the right little fit.", label: "Size guide" },
    ar: { title: "دليل مقاسات الأطفال والأمومة | بويز آند غيرلز", description: "راجع إرشادات مقاسات الرضّع والأطفال ومقاسات الأمومة من S إلى XXL. اطلب من بويز آند غيرلز قياسات القطعة قبل الطلب داخل لبنان.", h1: "المقاس المناسب تماماً.", label: "دليل المقاسات" },
  },
  "/cart": {
    kind: "utility",
    en: { title: "Your Shopping Bag | Boys & Girlz", description: "Review the items in your Boys & Girlz shopping bag before requesting delivery within Lebanon.", h1: "Your shopping bag.", label: "Your bag" },
    ar: { title: "سلّة التسوّق | بويز آند غيرلز", description: "راجع المنتجات في سلّة التسوّق لدى بويز آند غيرلز قبل طلب التوصيل داخل لبنان.", h1: "سلّة التسوّق الخاصة بك.", label: "سلّتك" },
  },
  "/checkout": {
    kind: "utility",
    en: { title: "Checkout & Delivery Details | Boys & Girlz", description: "Review your Boys & Girlz order and delivery details for Lebanon. Item availability and final totals are checked before an order is accepted.", h1: "Checkout", label: "Checkout" },
    ar: { title: "إتمام الطلب وتفاصيل التوصيل | بويز آند غيرلز", description: "راجع طلب بويز آند غيرلز وتفاصيل التوصيل داخل لبنان. يُتحقّق من توفّر المنتجات والمجموع النهائي قبل قبول الطلب.", h1: "إتمام الطلب", label: "إتمام الطلب" },
  },
  "/wishlist": {
    kind: "utility",
    en: { title: "Your Saved Wishlist | Boys & Girlz", description: "Revisit your saved Boys & Girlz favorites and explore children's clothing, toys and little essentials in Lebanon.", h1: "Your little wishlist.", label: "Wishlist" },
    ar: { title: "قائمة المنتجات المفضّلة | بويز آند غيرلز", description: "عُد إلى منتجاتك المفضّلة المحفوظة لدى بويز آند غيرلز واكتشف ملابس الأطفال والألعاب والمستلزمات الصغيرة في لبنان.", h1: "قائمة مفضّلاتك الصغيرة.", label: "المفضّلة" },
  },
};

const categoryCopy: Record<string, { en: PageCopy; ar: PageCopy }> = {
  Boys: {
    en: { title: "Boys' Clothes in Lebanon | Boys & Girlz", description: "Explore the boys' clothing collection at Boys & Girlz in Lebanon. Check listed sizes and colors, and contact the shop for current item details.", h1: "Little boys.", label: "Boys" },
    ar: { title: "ملابس الأولاد في لبنان | بويز آند غيرلز", description: "اكتشف مجموعة ملابس الأولاد لدى بويز آند غيرلز في لبنان. راجع المقاسات والألوان المدرجة وتواصل مع المتجر لتأكيد تفاصيل القطع الحالية.", h1: "للأولاد الصغار.", label: "الأولاد" },
  },
  Girls: {
    en: { title: "Girls' Clothes in Lebanon | Boys & Girlz", description: "Browse the girls' clothing collection at Boys & Girlz in Lebanon. Explore listed sizes and colors and ask the shop for measurements before ordering.", h1: "Little girls.", label: "Girls" },
    ar: { title: "ملابس البنات في لبنان | بويز آند غيرلز", description: "تصفّح مجموعة ملابس البنات لدى بويز آند غيرلز في لبنان. اكتشف المقاسات والألوان المدرجة واطلب من المتجر قياسات القطعة قبل الطلب.", h1: "للبنات الصغيرات.", label: "البنات" },
  },
  Unisex: {
    en: { title: "Unisex Baby & Kids Clothes in Lebanon | Boys & Girlz", description: "Explore unisex baby and children's clothing at Boys & Girlz in Lebanon. Review listed sizes and colors and confirm current details with the shop.", h1: "Little unisex.", label: "Unisex" },
    ar: { title: "ملابس رضّع وأطفال للجميع في لبنان | بويز آند غيرلز", description: "اكتشف ملابس الرضّع والأطفال المناسبة للجميع لدى بويز آند غيرلز في لبنان. راجع المقاسات والألوان وتواصل مع المتجر لتأكيد التفاصيل الحالية.", h1: "قطع تناسب الجميع.", label: "للجميع" },
  },
  Accessories: {
    en: { title: "Baby & Kids Accessories in Lebanon | Boys & Girlz", description: "Browse baby and children's accessories at Boys & Girlz in Lebanon. Contact the shop for current product photos, measurements and availability.", h1: "Little accessories.", label: "Accessories" },
    ar: { title: "إكسسوارات الرضّع والأطفال في لبنان | بويز آند غيرلز", description: "تصفّح إكسسوارات الرضّع والأطفال لدى بويز آند غيرلز في لبنان. تواصل مع المتجر للحصول على صور المنتجات الحالية وقياساتها وتأكيد توفّرها.", h1: "إكسسوارات الصغار.", label: "الإكسسوارات" },
  },
  Maternity: {
    en: { title: "Maternity Clothes in Lebanon | Boys & Girlz", description: "Explore maternity clothing at Boys & Girlz in Lebanon, with listed sizes S–XXL. Ask the shop for garment measurements and current product details.", h1: "For mama.", label: "Maternity" },
    ar: { title: "ملابس الأمومة في لبنان | بويز آند غيرلز", description: "اكتشفي ملابس الأمومة لدى بويز آند غيرلز في لبنان بمقاسات مدرجة من S إلى XXL. اطلبي من المتجر قياسات القطع وتفاصيل المنتجات الحالية.", h1: "راحة للأم.", label: "ملابس الأمومة" },
  },
  Toys: {
    en: { title: "Toys & Gifts in Lebanon | Boys & Girlz", description: "Explore the toy collection and gift ideas at Boys & Girlz in Lebanon. Ask the shop for current photos, product details and availability before ordering.", h1: "A little playtime.", label: "Toys" },
    ar: { title: "ألعاب وهدايا في لبنان | بويز آند غيرلز", description: "اكتشف مجموعة الألعاب وأفكار الهدايا لدى بويز آند غيرلز في لبنان. اطلب من المتجر الصور الحالية وتفاصيل المنتجات وتأكّد من توفّرها قبل الطلب.", h1: "وقت اللعب.", label: "الألعاب" },
  },
  Outlet: {
    en: { title: "Like New Children's Outlet in Lebanon | Boys & Girlz", description: "Discover Like New outlet items at Boys & Girlz: pre-owned pieces in excellent condition at reduced prices. Ask the shop for current item details.", h1: "Like New little finds.", label: "Like New outlet" },
    ar: { title: "أوتليت أطفال شبه جديد في لبنان | بويز آند غيرلز", description: "اكتشف أوتليت بويز آند غيرلز: قطع مستعملة بحالة ممتازة بأسعار مخفّضة. تواصل مع المتجر للحصول على الصور الحالية وتفاصيل حالة كل قطعة.", h1: "قطع شبه جديدة.", label: "أوتليت شبه جديد" },
  },
  Sale: {
    en: { title: "Children's Sale Collection in Lebanon | Boys & Girlz", description: "Browse the sale collection of new items at Boys & Girlz in Lebanon. Contact the shop to confirm current prices, available sizes and item details.", h1: "Sale.", label: "Sale" },
    ar: { title: "تخفيضات ملابس الأطفال في لبنان | بويز آند غيرلز", description: "تصفّح مجموعة المنتجات الجديدة المخفّضة لدى بويز آند غيرلز في لبنان. تواصل مع المتجر لتأكيد الأسعار الحالية والمقاسات المتاحة وتفاصيل القطع.", h1: "تخفيضات.", label: "التخفيضات" },
  },
};

const arabicProducts: Record<string, string> = {
  "Everyday Overshirt": "قميص يومي واسع", "Gingham Day Dress": "فستان مربعات يومي", "Happy Days Tee": "قميص أيام سعيدة",
  "Adventure Overalls": "أوفرول المغامرات", "Fleece Bear Overall": "أوفرول الدب الناعم", "Little Safari Romper": "رومبر السفاري الصغير",
  "Knit Hooded Cardigan": "كارديغان محبوك بغطاء رأس", "Teddy Bear Sweater Set": "طقم كنزة الدب", "Cloud Puffer Overall": "أوفرول شتوي مبطّن",
  "Little Cloud Booties": "حذاء السحابة الصغير", "Bunny’s First Cuddles": "أرنب العناق الأول", "The Sunday Maternity Dress": "فستان أمومة ليوم الأحد",
  "Blueberry Snuggle Suit": "بدلة التوت الأزرق الناعمة", "Little Explorer Playsuit": "بدلة المستكشف الصغير",
  "Rosebud Knit Cardigan": "كارديغان الورد المحبوك", "Sweet Dreams Romper": "رومبر أحلام سعيدة",
  "Blush Teddy Cardigan": "كارديغان الدب الوردي", "Little Cub Lounge Set": "طقم الدب الصغير المريح",
  "Everyday Safari Sleepsuit": "بدلة نوم السفاري", "First Steps Knit Booties": "حذاء الخطوات الأولى المحبوك",
  "Cozy Toes Gift Set": "طقم هدية للأقدام الدافئة", "Tiny Treasures Booties": "حذاء الكنوز الصغيرة", "Bedtime Bunny": "أرنب وقت النوم",
  "Little Friend Plush Bunny": "أرنب الصديق الصغير", "Golden Bath Duck": "بطّة الاستحمام الذهبية", "Soft Embrace Nursing Dress": "فستان رضاعة ناعم",
  "Bloom Maternity Wrap": "فستان أمومة ملفوف", "Easy Days Maternity Dress": "فستان أمومة مريح", "Winter Bear Snowsuit": "بدلة الدب الشتوية",
  "Peach Blossom Cardigan": "كارديغان زهر الخوخ", "Oatmeal Teddy Set": "طقم الدب بلون الشوفان", "Hug Me Bunny Gift": "هدية الأرنب عانقني",
  "Like New Bear Playsuit": "بدلة الدب شبه الجديدة", "Like New Blush Cardigan": "كارديغان وردي شبه جديد", "Like New Cozy Gift Set": "طقم هدية دافئ شبه جديد",
};

export function cleanPath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
}

export function localizedPath(path: string, language: SeoLanguage): string {
  const pathname = cleanPath(path);
  return language === "ar" ? `${pathname}?lang=ar` : pathname;
}

export function canonicalUrl(path: string, language: SeoLanguage, siteUrl: string): string {
  if (!siteUrl) return "";
  return `${siteUrl.replace(/\/+$/, "")}${localizedPath(path, language)}`;
}

export function productName(product: Product, language: SeoLanguage): string {
  return language === "ar" ? arabicProducts[product.name] || product.name : product.name;
}

export function getPageSeo(path: string, language: SeoLanguage = "en", { catalogVerified = false }: SeoOptions = {}): PageSeo {
  const pathname = cleanPath(path);
  const home = { path: "/", name: pages["/"][language].label };
  const definition = pages[pathname];
  if (definition) {
    const copy = definition[language];
    const kind = definition.kind || "page";
    return { path: pathname, ...copy, kind, indexable: kind !== "utility", breadcrumbs: pathname === "/" ? [] : [home, { path: pathname, name: copy.label }] };
  }
  const category = categories.find((item) => pathname === `/category/${item.toLowerCase()}`);
  if (category) {
    const copy = categoryCopy[category][language];
    return { path: pathname, ...copy, kind: "collection", indexable: true, breadcrumbs: [home, { path: "/shop", name: pages["/shop"][language].label }, { path: pathname, name: copy.label }] };
  }
  const product = pathname.startsWith("/product/") ? productById(pathname.slice("/product/".length)) : undefined;
  if (product) {
    const name = productName(product, language);
    return {
      path: pathname,
      title: language === "ar" ? `${name} | بويز آند غيرلز` : `${name} | Boys & Girlz`,
      description: language === "ar"
        ? `${name} لدى بويز آند غيرلز في لبنان. راجع تفاصيل المنتج المدرجة وتواصل مع المتجر لتأكيد التوفّر الحالي قبل الطلب.`
        : `${name} in Lebanon at Boys & Girlz. Check the listed details and ask the shop about current availability before ordering.`,
      h1: name,
      kind: "product",
      indexable: catalogVerified,
      breadcrumbs: [home, { path: `/category/${product.category.toLowerCase()}`, name: categoryCopy[product.category][language].label }, { path: pathname, name }],
    };
  }
  return {
    path: pathname,
    title: language === "ar" ? "الصفحة غير موجودة | بويز آند غيرلز" : "Page Not Found | Boys & Girlz",
    description: language === "ar" ? "تعذّر العثور على هذه الصفحة. عُد إلى متجر بويز آند غيرلز أو تواصل معنا للمساعدة." : "We could not find this page. Return to the Boys & Girlz shop or contact us for help.",
    h1: language === "ar" ? "الصفحة غير موجودة" : "Page not found",
    kind: "error",
    indexable: false,
    breadcrumbs: [],
  };
}

export const PUBLIC_PAGE_PATHS = [
  "/", "/shop", "/about", "/brands", "/contact", "/faq", "/help/shipping", "/help/returns", "/help/sizing",
  ...categories.map((category) => `/category/${category.toLowerCase()}`),
  ...products.map((product) => `/product/${product.id}`),
];

export function getPublicPagePaths(options: SeoOptions = {}): string[] {
  return PUBLIC_PAGE_PATHS.filter((path) => getPageSeo(path, "en", options).indexable);
}

export function breadcrumbStructuredData(page: PageSeo, language: SeoLanguage, siteUrl: string) {
  if (!siteUrl || !page.breadcrumbs.length) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: page.breadcrumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: canonicalUrl(crumb.path, language, siteUrl) })),
  };
}

export function pageStructuredData(page: PageSeo, language: SeoLanguage, siteUrl: string, options: SeoOptions = {}) {
  if (!siteUrl || !page.indexable) return undefined;
  const url = canonicalUrl(page.path, language, siteUrl);
  if (page.kind === "collection") return { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${url}#page`, url, name: page.title, description: page.description, inLanguage: language };
  if (page.kind !== "product" || !options.catalogVerified) return undefined;
  const product = productById(page.path.slice("/product/".length));
  if (!product) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: productName(product, language),
    description: product.description,
    category: categoryCopy[product.category][language].label,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      itemCondition: product.condition === "like-new" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
      seller: { "@id": `${siteUrl.replace(/\/+$/, "")}#organization` },
    },
  };
}

type GlobalSchemaOptions = {
  language: SeoLanguage;
  siteUrl?: string;
  name?: string;
  phone?: string;
  whatsappPhone?: string;
  email?: string;
  address?: string;
  hours?: string;
  founded?: string;
  locality?: string;
  postalCode?: string;
  countryCode?: string;
  latitude?: string;
  longitude?: string;
  sameAs?: string[];
  catalogVerified?: boolean;
};

export function globalStructuredData({ language, siteUrl = "", name = "Boys & Girlz", phone = "", whatsappPhone = "", email = "", address = "", hours = "", founded = "", locality = "", postalCode = "", countryCode = "LB", latitude = "", longitude = "", sameAs = [] }: GlobalSchemaOptions) {
  const base = siteUrl.replace(/\/+$/, "");
  const hasLocation = Boolean(address && locality);
  const validHours = hours.split(/[;\n]/).map(value => value.trim()).filter(value => /^(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))? (?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d$/.test(value));
  const validGeo = latitude !== "" && longitude !== "" && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180;
  const organization = {
    "@type": hasLocation ? "ClothingStore" : "Organization",
    ...(base ? { "@id": `${base}#organization`, url: base, logo: `${base}/assets/boys-girlz-logo.webp` } : {}),
    name,
    description: "A Lebanon-based children's shop offering clothing, baby items, toys, accessories, maternity and Like New outlet items.",
    areaServed: { "@type": "Country", name: "Lebanon" },
    ...(phone || whatsappPhone ? { telephone: phone || whatsappPhone } : {}),
    ...(email ? { email } : {}),
    ...(hasLocation ? { address: { "@type": "PostalAddress", streetAddress: address, addressLocality: locality, addressCountry: countryCode, ...(postalCode ? { postalCode } : {}) } } : {}),
    ...(hasLocation && validHours.length ? { openingHours: validHours } : {}),
    ...(hasLocation && validGeo ? { geo: { "@type": "GeoCoordinates", latitude: Number(latitude), longitude: Number(longitude) } } : {}),
    ...(/^\d{4}$/.test(founded) ? { foundingDate: founded } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  const website = {
    "@type": "WebSite",
    ...(base ? { "@id": `${base}#website`, url: base, publisher: { "@id": `${base}#organization` } } : {}),
    name,
    inLanguage: ["en", "ar"],
    ...(base ? {
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${canonicalUrl("/shop", language, base)}${language === "ar" ? "&" : "?"}q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    } : {}),
  };
  return { "@context": "https://schema.org", "@graph": [organization, website] };
}
