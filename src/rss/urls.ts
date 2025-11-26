import {
  GenerateRssOptions,
  RegistryItem,
  UrlResolver,
  UrlResolverByItem,
  UrlResolverByName,
} from "./types";
import { determineRegistryItemType } from "./type-determiner";
import { concatUrlParts } from "../utils/url-contact";

export const getRegistryItemPath = (
  registryItem: RegistryItem,
  config: GenerateRssOptions
): UrlResolver => {
  const type = determineRegistryItemType(registryItem);

  switch (type) {
    case "block":
      return config.blocksUrl ?? "";
    case "component":
      return config.componentsUrl ?? "";
    case "lib":
      return config.libsUrl ?? "";
    case "hook":
      return config.hooksUrl ?? "";
    case "file":
      return config.filesUrl ?? "";
    case "style":
      return config.stylesUrl ?? "";
    case "theme":
      return config.themesUrl ?? "";
    case "item":
      return config.itemsUrl ?? "";
    default:
      return "";
  }
};

/**
 * Unified resolver type that can accept either a string or RegistryItem.
 * Used internally to handle both name-based and item-based resolvers.
 */
type UnifiedResolver = (input: string | RegistryItem) => string;

/**
 * Type guard to check if a resolved URL contains coerced object artifacts.
 * When a name-based resolver receives an object, JavaScript coerces it to "[object Object]".
 */
function hasCoercedObjectString(value: string | null | undefined): boolean {
  return typeof value === "string" && value.includes("[object Object]");
}

/**
 * Calls the URL resolver function with backward compatibility.
 * Supports both (itemName: string) => string and (item: RegistryItem) => string signatures.
 *
 * Detection strategy: Call with full item first. If the result contains "[object Object]",
 * it means the function expected a string and coerced the object, so we fall back to item.name.
 *
 * @param resolver - The URL resolver function (either name-based or item-based)
 * @param item - The registry item to resolve the URL for
 * @returns The resolved URL string
 */
export const resolveUrl = (
  resolver: UrlResolverByName | UrlResolverByItem,
  item: RegistryItem
): string => {
  const unifiedResolver = resolver as UnifiedResolver;
  const resolved = unifiedResolver(item);

  if (hasCoercedObjectString(resolved)) {
    return unifiedResolver(item.name) ?? "";
  }

  return resolved ?? "";
};

/**
 * Generates the full URL for a registry item based on configuration and item type.
 * Handles both string paths and custom resolver functions.
 *
 * Resolver functions can accept either:
 * - (itemName: string) => string - receives just the item name
 * - (item: RegistryItem) => string - receives the full registry item
 */
export const getItemUrl = (
  item: RegistryItem,
  options: GenerateRssOptions
): string => {
  const pathOrResolver = getRegistryItemPath(item, options);

  if (typeof pathOrResolver === "function") {
    // If resolver is provided, it returns the full relative or absolute path
    const resolved = resolveUrl(pathOrResolver, item);
    return concatUrlParts(options.baseUrl, resolved);
  }

  // If string, it's a path prefix, so we append item.name
  const path = pathOrResolver;
  return concatUrlParts(options.baseUrl, path, item.name);
};
