import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, useRouteError, useRouteLoaderData } from "react-router";
import { StoreProvider, useStore } from "./state/Store";
import { Footer, Header } from "./components/Layout";
import { CartDrawer } from "./pages/Cart";
import { FlyToBag, RouteEffects } from "./components/MotionEffects";
import WhatsAppLink from "./components/WhatsAppLink";
import { business } from "./config/business";
import { LocaleProvider, useLocale, type Language } from "./i18n/Locale";
import type { LoaderFunctionArgs } from "react-router";
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
import "./rtl.css";

export function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("cookie") || "";
  const language: Language = /(?:^|;\s*)bg-language=ar(?:;|$)/.test(cookie) ? "ar" : "en";
  return { language };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const language = useRouteLoaderData<typeof loader>("root")?.language || "en";
  const organization = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: business.name,
        ...(business.siteUrl ? { url: business.siteUrl } : {}),
        sameAs: [business.instagram],
      },
      {
        "@type": "ClothingStore",
        name: business.name,
        ...(business.siteUrl ? { url: business.siteUrl } : {}),
        ...(business.phone ? { telephone: business.phone } : {}),
        ...(business.address ? { address: business.address } : {}),
        areaServed: { "@type": "Country", name: "Lebanon" },
      },
    ],
  };
  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      </head>
      <body>
        <LocaleProvider initialLanguage={language}>{children}</LocaleProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell() {
  const { notice } = useStore();
  const { language, t } = useLocale();
  const { pathname } = useLocation();
  return (
    <>
      <a className="skip-link" href="#main">{t("Skip to content")}</a>
      <Header />
      <RouteEffects />
      <main id="main"><Outlet /></main>
      <Footer />
      <CartDrawer />
      {pathname !== "/cart" && pathname !== "/checkout" && <WhatsAppLink className="whatsapp-floating" label={t("Chat with us")} ariaLabel={t("Chat with Boys & Girlz on WhatsApp")} message={language === "ar" ? "مرحباً بويز آند غيرلز! لدي سؤال عن المتجر." : "Hello Boys & Girlz! I have a question about your shop."} />}
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
      <a className="btn btn-blue" href="/">{t("Back to the shop")}</a>
    </main>
  );
}
