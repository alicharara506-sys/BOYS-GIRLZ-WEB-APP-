import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, redirect, useLocation, useRouteError, useRouteLoaderData } from "react-router";
import { globalStructuredData } from "./config/seo";
import { buildPageMeta } from "./config/meta";
import Analytics from "./components/Analytics";
import { Link } from "./components/LocalizedLink";
import { StoreProvider, useStore } from "./state/Store";
import { Header } from "./components/Layout";
import Footer from "./components/Footer";
import { CartDrawer } from "./pages/Cart";
import { FlyToBag, RouteEffects } from "./components/MotionEffects";
import { FloatingWhatsApp } from "./components/WhatsAppLink";
import { business } from "./config/business";
import { LocaleProvider, useLocale, type Language } from "./i18n/Locale";
import type { LoaderFunctionArgs, ShouldRevalidateFunctionArgs } from "react-router";
import type { Route } from "./+types/root";
import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/600.css";
import "@fontsource/quicksand/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "./styles.css";
import "./shop.css";
import "./redesign.css";
import "./motion.css";
import "./toybox.css";
import "./hero.css";
import "./rtl.css";
import "./cards.css";
import "./sections.css";
import "./footer.css";
import "./header.css";
import "./shop-v2.css";
import "./about.css";
import "./contact.css";
import "./faq.css";
import "./help.css";
import "./bag.css";
import "./product.css";
import "./tones.css";
import "./brands.css";

export const meta: Route.MetaFunction = ({ location }) => buildPageMeta(location.pathname, new URLSearchParams(location.search).get("lang") === "ar" ? "ar" : "en");

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const canonical = new URL(business.siteUrl);
  const next = new URL(url);
  next.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  if (url.searchParams.has("lang") && url.searchParams.get("lang") !== "ar") next.searchParams.delete("lang");
  const isPublicHost = url.hostname === canonical.hostname || url.hostname === `www.${canonical.hostname}`;
  const forwardedHttps = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  if (isPublicHost && (url.hostname !== canonical.hostname || (url.protocol !== "https:" && !forwardedHttps))) {
    next.host = canonical.host;
    next.protocol = "https:";
  }
  if (next.href !== url.href && request.method === "GET") throw redirect(next.href, 308);
  const language: Language = url.searchParams.get("lang") === "ar" ? "ar" : "en";
  return { language };
}

// Language variants have stable URLs; filter changes do not reload root data.
export function shouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  if (currentUrl.searchParams.get("lang") !== nextUrl.searchParams.get("lang")) return true;
  return formMethod ? defaultShouldRevalidate : false;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const language = useRouteLoaderData<typeof loader>("root")?.language || "en";
  const organization = globalStructuredData({ ...business, language, sameAs: [business.instagram, business.facebook, business.tiktok] });
  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {import.meta.env.VITE_GOOGLE_SITE_VERIFICATION && <meta name="google-site-verification" content={import.meta.env.VITE_GOOGLE_SITE_VERIFICATION} />}
        {import.meta.env.VITE_BING_SITE_VERIFICATION && <meta name="msvalidate.01" content={import.meta.env.VITE_BING_SITE_VERIFICATION} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
      </head>
      <body>
        <LocaleProvider initialLanguage={language}>{children}<Analytics /></LocaleProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell() {
  const { notice } = useStore();
  const { t } = useLocale();
  const { pathname } = useLocation();
  return (
    <>
      <a className="skip-link" href="#main">{t("Skip to content")}</a>
      <Header />
      <RouteEffects />
      <main id="main"><Outlet /></main>
      <Footer />
      <CartDrawer />
      {!["/cart", "/checkout"].includes(pathname) && <FloatingWhatsApp />}
      <FlyToBag />
      <div className={`toast ${notice ? "visible" : ""}`} role="status" aria-live="polite">{notice}</div>
    </>
  );
}

export default function Root() {
  return <StoreProvider><Shell /></StoreProvider>;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useLocale();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="page-width page-heading" id="main">
      <h1>{t(missing ? "Page not found" : "Something went wrong")}</h1>
      <p>{t(missing ? "That page or product is no longer available." : "Please try again in a moment.")}</p>
      <Link className="btn btn-blue" to="/">{t("Back to the shop")}</Link>
      <p><Link to="/shop">{t("Shop all")}</Link> · <Link to="/faq">{t("Help & FAQs")}</Link> · <Link to="/contact">{t("Contact")}</Link></p>
    </main>
  );
}
