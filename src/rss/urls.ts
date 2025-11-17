import { GenerateRssOptions, RegistryItem } from "./types";
import { determineRegistryItemType } from "./type-determiner";

export const getRegistryItemPath = (
  registryItem: RegistryItem,
  config: GenerateRssOptions
) => {
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
