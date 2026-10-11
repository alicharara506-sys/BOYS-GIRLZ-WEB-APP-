import type { MetaDescriptor } from "react-router";
import { business } from "./business";
import { translate, type Language } from "../i18n/Locale";

export function languageFromMatches(matches: readonly ({ id: string; data?: unknown } | undefined)[]): Language {
  const root = matches.find((match) => match?.id === "root")?.data;
  return root && typeof root === "object" && "language" in root && root.language === "ar" ? "ar" : "en";
}

export function localizedMeta(title: string, description: string, path: string) {
  return ({ matches }: { matches: readonly ({ id: string; data?: unknown } | undefined)[] }) =>
    pageMeta(title, description, path, languageFromMatches(matches));
}

export function pageMeta(title: string, description: string, path: string, language: Language = "en"): MetaDescriptor[] {
  const fullTitle = `${translate(title, language)} | ${business.name}`;
  const localizedDescription = language === "ar"
    ? "تسوّق ملابس الأطفال والرضّع والألعاب والإكسسوارات وملابس الأمومة من بويز آند غيرلز في لبنان. التوصيل داخل لبنان فقط."
    : description;
  const canonical = business.siteUrl ? `${business.siteUrl}${path}` : "";
  return [
    { title: fullTitle },
    { name: "description", content: localizedDescription },
    { property: "og:type", content: "website" },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: localizedDescription },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: localizedDescription },
    ...(canonical ? [{ tagName: "link" as const, rel: "canonical", href: canonical }, { property: "og:url", content: canonical }] : []),
  ];
}
