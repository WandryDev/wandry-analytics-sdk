import { GenerateRssOptions } from "./types";

const defaultOptions: GenerateRssOptions = {
  rss: {
    title: "Shadcn Registry",
    description:
      "Use the Wandry UI CLI to install custom components and templates from the community.",
    endpoint: "/rss.xml",
    pubDateStatagy: "dateNow",
  },
  registry: {
    path: "r/registry.json",
  },
};

export function getConfigWithDefaults<T extends Request>(
  request: T,
  config?: GenerateRssOptions
): GenerateRssOptions {
  const baseUrl = new URL(request.url).origin ?? "";

  return {
    ...config,
    ...defaultOptions,

    baseUrl: config?.baseUrl ?? baseUrl,
    rss: {
      ...defaultOptions.rss,
      ...(config?.rss ?? {}),
      link: config?.rss?.link ?? baseUrl,
    },
    registry: {
      ...defaultOptions.registry,
      ...config?.registry,
    },
  };
}
