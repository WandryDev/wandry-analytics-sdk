import { GenerateRssOptions, RegistryItem, RegistryItemType } from "./types";

const isFileContains = (
  registryItem: RegistryItem,
  fileType: string
): boolean => {
  return registryItem.files.some((file) => file.path.includes(fileType));
};

export const determinateRegistyItemType = (
  registryItem: RegistryItem
): RegistryItemType => {
  if (
    ["registry:ui", "registry:component"].includes(registryItem.type) ||
    isFileContains(registryItem, "ui") ||
    isFileContains(registryItem, "component")
  ) {
    return "component";
  }

  if (
    ["registry:block", "registry:page"].includes(registryItem.type) ||
    isFileContains(registryItem, "blocks")
  ) {
    return "block";
  }

  return "unknown";
};

export const getRegistryItemPath = (
  registryItem: RegistryItem,
  config: GenerateRssOptions
) => {
  const type = determinateRegistyItemType(registryItem);

  if (type === "component") {
    return config.componentsUrl;
  }

  if (type === "block") {
    return config.blocksUrl;
  }

  return "";
};
