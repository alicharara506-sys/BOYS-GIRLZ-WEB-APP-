import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useLocale } from "../i18n/Locale";
import { business } from "../config/business";

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

export default function Analytics() {
  const { pathname } = useLocation();
  const { language } = useLocale();
  const initialized = useRef(false);
  useEffect(() => {
    if (!/^G-[A-Z0-9]+$/.test(measurementId)) return;
    if (!initialized.current) {
      initialized.current = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => { window.dataLayer!.push(args); };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
    // Exclude query strings and fragments (searches, order tokens, contact details).
    window.gtag?.("event", "page_view", { page_location: `${business.siteUrl}${pathname}`, page_title: document.title, language });
  }, [pathname, language]);
  return null;
}
