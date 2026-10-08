import type { MetaDescriptor } from "react-router";
import { business } from "./business";

export function pageMeta(title: string, description: string, path: string): MetaDescriptor[] {
  const fullTitle = `${title} | ${business.name}`;
  const canonical = business.siteUrl ? `${business.siteUrl}${path}` : "";
  return [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    ...(canonical ? [{ tagName: "link" as const, rel: "canonical", href: canonical }, { property: "og:url", content: canonical }] : []),
  ];
}
