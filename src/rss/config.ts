import { GenerateRssOptions } from "./types";

const defaultOptions: GenerateRssOptions = {
  baseUrl: "",
  componentsUrl: "components",
  blocksUrl: "blocks",
  libsUrl: "libs",
  hooksUrl: "hooks",
  filesUrl: "files",
  stylesUrl: "styles",
  themesUrl: "themes",
  itemsUrl: "items",
  rss: {
    title: "Shadcn Registry",
    description:
      "Use the Wandry UI CLI to install custom components and templates from the community.",
    endpoint: "/rss.xml",
    pubDateStrategy: "dateNow",
  },
  registry: {
    path: "r/registry.json",
  },
};

export function getConfigWithDefaults(
  config?: GenerateRssOptions
): GenerateRssOptions {
  return {
    ...defaultOptions,
    ...config,
    rss: {
      ...defaultOptions.rss,
      ...(config?.rss ?? {}),
      link: config?.rss?.link ?? config?.baseUrl ?? "",
    },
    registry: {
      ...defaultOptions.registry,
      ...config?.registry,
    },
  };
}
