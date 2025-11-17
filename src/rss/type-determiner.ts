import { RegistryItem, RegistryItemType } from "./types";

const isFileContains = (
  registryItem: RegistryItem,
  patterns: string[]
): boolean => {
  return (
    registryItem.files?.some((file) =>
      patterns.some((pattern) => file.path.includes(pattern))
    ) ?? false
  );
};

const isFileItemContainsType = (
  registryItem: RegistryItem,
  types: string[]
): boolean => {
  return registryItem.files?.some((file) => types.includes(file.type)) ?? false;
};

const isBlockType = (registryItem: RegistryItem): boolean => {
  if (isFileContains(registryItem, ["/blocks/", "/block/"])) {
    return true;
  }

  if (
    isFileItemContainsType(registryItem, ["registry:block", "registry:page"])
  ) {
    return true;
  }

  if (
    registryItem.type === "registry:block" ||
    registryItem.type === "registry:page"
  ) {
    return true;
  }

  return false;
};

const isComponentType = (registryItem: RegistryItem): boolean => {
  if (isFileContains(registryItem, ["/ui/", "/components/", "/component/"])) {
    return true;
  }

  if (isFileItemContainsType(registryItem, ["registry:component"])) {
    return true;
  }

  if (
    (registryItem.type === "registry:ui" ||
      registryItem.type === "registry:component") &&
    !isFileContains(registryItem, ["/blocks/", "/block/"])
  ) {
    return true;
  }

  return false;
};

const isLibType = (registryItem: RegistryItem): boolean => {
  if (
    isFileContains(registryItem, [
      "/lib/",
      "/libs/",
      "/library/",
      "/libraries/",
    ])
  ) {
    return true;
  }

  if (isFileItemContainsType(registryItem, ["registry:lib"])) {
    return true;
  }

  if (
    registryItem.type === "registry:lib" &&
    !isFileContains(registryItem, [
      "/blocks/",
      "/components/",
      "/ui/",
      "/hooks/",
      "/files/",
    ])
  ) {
    return true;
  }

  return false;
};

const isHookType = (registryItem: RegistryItem): boolean => {
  if (isFileContains(registryItem, ["/hooks/", "/hook/"])) {
    return true;
  }

  if (isFileItemContainsType(registryItem, ["registry:hook"])) {
    return true;
  }

  if (
    registryItem.type === "registry:hook" &&
    !isFileContains(registryItem, ["/blocks/", "/components/", "/ui/"])
  ) {
    return true;
  }

  return false;
};

const isFileType = (registryItem: RegistryItem): boolean => {
  if (isFileItemContainsType(registryItem, ["registry:file"])) {
    return true;
  }

  if (
    registryItem.type === "registry:file" &&
    !isFileContains(registryItem, [
      "/blocks/",
      "/components/",
      "/ui/",
      "/hooks/",
      "/lib/",
      "/libs/",
    ])
  ) {
    return true;
  }

  return false;
};

const isStyleType = (registryItem: RegistryItem): boolean => {
  if (isFileContains(registryItem, ["/styles/", "/style/"])) {
    return true;
  }

  if (isFileItemContainsType(registryItem, ["registry:style"])) {
    return true;
  }

  if (
    registryItem.type === "registry:style" &&
    !isFileContains(registryItem, [
      "/blocks/",
      "/components/",
      "/ui/",
      "/hooks/",
      "/lib/",
    ])
  ) {
    return true;
  }

  return false;
};

const isThemeType = (registryItem: RegistryItem): boolean => {
  if (isFileContains(registryItem, ["/themes/", "/theme/"])) {
    return true;
  }

  if (isFileItemContainsType(registryItem, ["registry:theme"])) {
    return true;
  }

  if (
    registryItem.type === "registry:theme" &&
    !isFileContains(registryItem, [
      "/blocks/",
      "/components/",
      "/ui/",
      "/hooks/",
      "/lib/",
    ])
  ) {
    return true;
  }

  return false;
};

const isItemType = (registryItem: RegistryItem): boolean => {
  if (
    isFileContains(registryItem, [
      "/blocks/",
      "/components/",
      "/ui/",
      "/hooks/",
      "/lib/",
      "/libs/",
      "/styles/",
      "/themes/",
      "/files/",
    ])
  ) {
    return false;
  }

  if (isFileItemContainsType(registryItem, ["registry:item"])) {
    return true;
  }

  if (registryItem.type === "registry:item") {
    if (isFileContains(registryItem, ["/lib/", "/libs/"])) {
      return false;
    }
    return true;
  }

  return false;
};

export const determineRegistryItemType = (
  registryItem: RegistryItem
): RegistryItemType => {
  if (isBlockType(registryItem)) {
    return "block";
  }

  if (isComponentType(registryItem)) {
    return "component";
  }

  if (isLibType(registryItem)) {
    return "lib";
  }

  if (isHookType(registryItem)) {
    return "hook";
  }

  if (isFileType(registryItem)) {
    return "file";
  }

  if (isStyleType(registryItem)) {
    return "style";
  }

  if (isThemeType(registryItem)) {
    return "theme";
  }

  if (isItemType(registryItem)) {
    return "item";
  }

  return "unknown";
};
