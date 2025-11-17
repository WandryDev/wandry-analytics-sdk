/**
 * Joins URL parts properly, avoiding duplicate slashes
 * Uses URL constructor for proper normalization
 */
export function concatUrlParts(...parts: (string | undefined)[]): string {
  const validParts = parts.filter((part): part is string => Boolean(part));
  if (validParts.length === 0) return "";

  const base = validParts[0];
  const rest = validParts.slice(1);

  // If we have a full URL (starts with http), use URL constructor
  if (base.startsWith("http://") || base.startsWith("https://")) {
    const baseUrl = new URL(base);
    const pathname = [baseUrl.pathname, ...rest]
      .filter((p) => p)
      .map((p) => p.replace(/^\/+|\/+$/g, ""))
      .filter((p) => p)
      .join("/");

    baseUrl.pathname = pathname || "/";
    return baseUrl.href.replace(/\/$/, ""); // Remove trailing slash except for root
  }

  // For relative paths, just normalize slashes
  return [base, ...rest]
    .filter((p) => p)
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter((p) => p)
    .join("/");
}
