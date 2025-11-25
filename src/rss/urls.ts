import { GenerateRssOptions, RegistryItem, UrlResolver } from "./types";
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
 * Generates the full URL for a registry item based on configuration and item type.
 * Handles both string paths and custom resolver functions.
 */
export const getItemUrl = (
  item: RegistryItem,
  options: GenerateRssOptions
): string => {
  const pathOrResolver = getRegistryItemPath(item, options);

  if (typeof pathOrResolver === "function") {
    // If resolver is provided, it returns the full relative or absolute path
    const resolved = pathOrResolver(item.name) ?? "";
    return concatUrlParts(options.baseUrl, resolved);
  }

  // If string, it's a path prefix, so we append item.name
  const path = pathOrResolver;
  return concatUrlParts(options.baseUrl, path, item.name);
};
