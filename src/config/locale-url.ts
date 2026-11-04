import type { To } from "react-router";

export function localizeTo(to: To, language: "en" | "ar"): To {
  if (typeof to === "string" && (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(to) || to.startsWith("#"))) return to;
  const path = typeof to === "string" ? to : `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
  const [withoutHash, fragment] = path.split("#", 2);
  const [pathname, search = ""] = withoutHash.split("?", 2);
  const params = new URLSearchParams(search);
  if (language === "ar") params.set("lang", "ar");
  else params.delete("lang");
  const query = params.toString();
  const result = `${pathname}${query ? `?${query}` : ""}${fragment !== undefined ? `#${fragment}` : ""}`;
  return typeof to === "string" ? result : { ...to, pathname: to.pathname, search: query ? `?${query}` : "", hash: to.hash };
}
