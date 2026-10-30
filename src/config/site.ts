export const defaultSiteUrl = "https://boysandgirlz.com";

export function normalizeSiteUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/") {
    throw new Error("The public site URL must be an HTTPS origin without a path, port, credentials, query or fragment.");
  }
  return url.origin;
}
