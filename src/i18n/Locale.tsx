import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { translate, type Language } from "./translations";

export { translate, localizedCount, type Language } from "./translations";

const LocaleContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (text: string) => string } | null>(null);

export function LocaleProvider({ initialLanguage, children }: { initialLanguage: Language; children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    document.cookie = `bg-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };
  useEffect(() => {
    // Static prerendered pages cannot read cookies on the server; restore the choice after hydration.
    const saved: Language = /(?:^|;\s*)bg-language=ar(?:;|$)/.test(document.cookie) ? "ar" : "en";
    if (saved !== initialLanguage) setLanguageState(saved);
  }, [initialLanguage]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const t = (text: string) => translate(text, language);
  return <LocaleContext.Provider value={{ language, setLanguage, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider is required");
  return context;
}
