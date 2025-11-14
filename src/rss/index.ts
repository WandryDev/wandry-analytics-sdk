import { getPubDate } from "./pub-date";
import { GenerateRssOptions } from "./types";
import { getConfigWithDefaults } from "./config";
import { readRegistry } from "../core/http";

const generateRegistryItemXml = async (
  item: any,
  options: GenerateRssOptions
) => {
  const pubDate = await getPubDate(item, options);

  return `<item>
      <title>${item.title}</title>
      <link>${options.baseUrl}/${item.name}</link>
      <guid>${options.baseUrl}/${item.name}</guid>
      <description>${item.description}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
};

const generateRssXml = (items: string[], config: GenerateRssOptions) => {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${config.rss?.title}</title>
    <link>${config.rss?.link}</link>
    <description>${config.rss?.description}</description>
    <atom:link href="${config.baseUrl}${
    config.rss?.endpoint
  }" rel="self" type="application/rss+xml" />
  ${items.join("")}
  </channel>
</rss>
`;
};

export async function generateRegistryRssFeed<T extends Request>(
  request: T,
  options?: GenerateRssOptions
): Promise<string | null> {
  const config = getConfigWithDefaults(request, options);

  try {
    const registry = await readRegistry(
      `${config.baseUrl}/${config.registry!.path}`
    );

    if (!registry.items || registry.items.length === 0) {
      return null;
    }

    const items = await Promise.all(
      registry.items.map(async (item: any) => {
        return await generateRegistryItemXml(item, config);
      })
    );

    return generateRssXml(items, config);
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return null;
  }
}
