import { getPubDate } from "./pub-date";
import { GenerateRssOptions, Registry, RegistryItem } from "./types";
import { getConfigWithDefaults } from "./config";
import { readRegistry } from "../core/http";
import { getRegistryItemPath } from "./urls";
import { concatUrlParts } from "../utils/url-contact";

const generateRegistryItemXml = async (
  item: RegistryItem,
  options: GenerateRssOptions
) => {
  const pubDate = await getPubDate(item, options);
  const path = getRegistryItemPath(item, options);
  const itemUrl = concatUrlParts(options.baseUrl, path, item.name);

  return `<item>
      <title>${item.title ?? ""}</title>
      <link>${itemUrl}</link>
      <guid>${itemUrl}</guid>
      <description>${item.description ?? ""}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
};

const generateRssXml = (items: string[], config: GenerateRssOptions) => {
  const rssEndpoint = concatUrlParts(config.baseUrl, config.rss?.endpoint);

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${config.rss?.title ?? ""}</title>
    <link>${config.rss?.link ?? ""}</link>
    <description>${config.rss?.description ?? ""}</description>
    <atom:link href="${rssEndpoint}" rel="self" type="application/rss+xml" />
  ${items.join("")}
  </channel>
</rss>
`;
};

export async function generateRegistryRssFeed(
  options: GenerateRssOptions
): Promise<string | null> {
  const config = getConfigWithDefaults(options);

  try {
    const registryPath = concatUrlParts(
      config.baseUrl,
      config.registry?.path ?? "r/registry.json"
    );
    const registry: Registry = await readRegistry(registryPath);

    if (!registry.items || registry.items.length === 0) {
      return null;
    }

    const items = await Promise.all(
      registry.items.map(async (item: RegistryItem) => {
        return await generateRegistryItemXml(item, config);
      })
    );

    return generateRssXml(items, config);
  } catch (error) {
    return null;
  }
}
