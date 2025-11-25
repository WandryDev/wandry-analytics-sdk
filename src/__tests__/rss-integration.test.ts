import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { RegistryItem, GenerateRssOptions } from "../rss/types";
import { getRegistryItemPath } from "../rss/urls";
import { determineRegistryItemType } from "../rss/type-determiner";
import { generateRegistryRssFeed } from "../rss/index";
import { extractRssItems, validateRssFeed } from "./helpers/xml.helper";

// Mock the core/http module
vi.mock("../core/http", () => ({
  readRegistry: vi.fn(),
}));

// Import after mocking
import { readRegistry } from "../core/http";

// Load real registries fixtures using relative path from test file
// Using process.cwd() as base since tests run from project root
const fixturesPath = join(
  process.cwd(),
  "src/__tests__/fixtures/registries-fixtures.json"
);
const registriesFixtures = JSON.parse(
  readFileSync(fixturesPath, "utf-8")
) as Array<{
  name: string;
  homepage: string;
  url: string;
  description: string;
  data: {
    items: RegistryItem[];
    [key: string]: any;
  };
}>;

describe("RSS Integration Tests with Real Registries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Type determination for all registry items", () => {
    // Test type determination for all items in all registries
    registriesFixtures.forEach((registryFixture) => {
      describe(`Registry: ${registryFixture.name}`, () => {
        it(`should correctly determine types for all items in ${registryFixture.name}`, () => {
          const { items } = registryFixture.data;

          if (!items || items.length === 0) {
            console.warn(
              `Registry ${registryFixture.name} has no items, skipping...`
            );
            return;
          }

          items.forEach((item) => {
            const determinedType = determineRegistryItemType(item);

            // Verify that the type is one of the expected values
            // The actual type determination logic is tested in urls.ts
            // Here we just verify the function returns a valid type
            expect([
              "component",
              "block",
              "lib",
              "hook",
              "file",
              "style",
              "theme",
              "item",
              "unknown",
            ]).toContain(determinedType);
          });
        });

        it(`should generate correct URLs based on determined types for ${registryFixture.name}`, () => {
          const { items } = registryFixture.data;

          if (!items || items.length === 0) {
            return;
          }

          const config: GenerateRssOptions = {
            baseUrl: "https://example.com",
            componentsUrl: "components",
            blocksUrl: "blocks",
            libsUrl: "libs",
            hooksUrl: "hooks",
            filesUrl: "files",
            stylesUrl: "styles",
            themesUrl: "themes",
            itemsUrl: "items",
          };

          items.forEach((item) => {
            const determinedType = determineRegistryItemType(item);
            const path = getRegistryItemPath(item, config);

            switch (determinedType) {
              case "component":
                expect(path).toBe("components");
                break;
              case "block":
                expect(path).toBe("blocks");
                break;
              case "lib":
                expect(path).toBe("libs");
                break;
              case "hook":
                expect(path).toBe("hooks");
                break;
              case "file":
                expect(path).toBe("files");
                break;
              case "style":
                expect(path).toBe("styles");
                break;
              case "theme":
                expect(path).toBe("themes");
                break;
              case "item":
                expect(path).toBe("items");
                break;
              default:
                expect(path).toBe("");
            }
          });
        });
      });
    });
  });

  describe("RSS feed generation for real registries", () => {
    registriesFixtures.forEach((registryFixture) => {
      describe(`Registry: ${registryFixture.name}`, () => {
        it(`should generate valid RSS feed for ${registryFixture.name}`, async () => {
          const registryData = registryFixture.data;

          if (!registryData.items || registryData.items.length === 0) {
            console.warn(
              `Registry ${registryFixture.name} has no items, skipping...`
            );
            return;
          }

          const options: GenerateRssOptions = {
            baseUrl: registryFixture.homepage,
            componentsUrl: "components",
            blocksUrl: "blocks",
            libsUrl: "libs",
            hooksUrl: "hooks",
            filesUrl: "files",
            stylesUrl: "styles",
            themesUrl: "themes",
            itemsUrl: "items",
            rss: {
              title: `${registryFixture.name} Registry`,
              description: registryFixture.description,
              link: registryFixture.homepage,
              endpoint: "/rss.xml",
              pubDateStrategy: "dateNow",
            },
          };

          (readRegistry as any).mockResolvedValue(registryData);

          const rssXml = await generateRegistryRssFeed(options);

          expect(rssXml).not.toBeNull();
          expect(validateRssFeed(rssXml!)).toBe(true);

          // Verify RSS contains all items
          const items = extractRssItems(rssXml!);
          expect(items.length).toBe(registryData.items.length);

          // Verify that URLs are correctly formed based on item types
          items.forEach((rssItem, index) => {
            const registryItem = registryData.items[index];
            const path = getRegistryItemPath(registryItem, options);

            if (path) {
              expect(rssItem.link).toContain(`/${path}/`);
            }

            // Verify item data is correct
            // Handle undefined values - RSS generator converts undefined to empty string
            expect(rssItem.title).toBe(registryItem.title ?? "");
            expect(rssItem.description).toBe(registryItem.description ?? "");
          });
        });

        it(`should use correct paths in RSS links for ${registryFixture.name}`, async () => {
          const registryData = registryFixture.data;

          if (!registryData.items || registryData.items.length === 0) {
            return;
          }

          const options: GenerateRssOptions = {
            baseUrl: registryFixture.homepage,
            componentsUrl: "components",
            blocksUrl: "blocks",
            libsUrl: "libs",
            hooksUrl: "hooks",
            filesUrl: "files",
            stylesUrl: "styles",
            themesUrl: "themes",
            itemsUrl: "items",
            rss: {
              title: `${registryFixture.name} Registry`,
              description: registryFixture.description,
              link: registryFixture.homepage,
              endpoint: "/rss.xml",
              pubDateStrategy: "dateNow",
            },
          };

          (readRegistry as any).mockResolvedValue(registryData);

          const rssXml = await generateRegistryRssFeed(options);

          expect(rssXml).not.toBeNull();

          const items = extractRssItems(rssXml!);

          // Verify each item's link uses the correct path based on determined type
          items.forEach((rssItem, index) => {
            const registryItem = registryData.items[index];
            const path = getRegistryItemPath(registryItem, options);

            if (path) {
              expect(rssItem.link).toContain(`/${path}/`);
            } else {
              // For unknown types, the path should be empty
              // So the link should be baseUrl/itemName without any type path
              expect(rssItem.link).not.toContain("/components/");
              expect(rssItem.link).not.toContain("/blocks/");
              expect(rssItem.link).not.toContain("/libs/");
              expect(rssItem.link).not.toContain("/hooks/");
              expect(rssItem.link).not.toContain("/files/");
              expect(rssItem.link).not.toContain("/styles/");
              expect(rssItem.link).not.toContain("/themes/");
              expect(rssItem.link).not.toContain("/items/");
            }

            // Verify guid matches link
            expect(rssItem.guid).toBe(rssItem.link);
          });
        });
      });
    });
  });

  describe("Custom URL resolvers", () => {
    it("should use function-based URL resolver when provided", async () => {
      const registryData = {
        items: [
          {
            name: "custom-component",
            title: "Custom Component",
            type: "registry:component",
            files: [],
          },
        ],
      };

      (readRegistry as any).mockResolvedValue(registryData);

      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (itemName) => `https://cdn.example.com/${itemName}`,
        rss: {
          title: "Custom Registry",
          description: "Custom description",
          link: "https://example.com",
          endpoint: "/rss.xml",
          pubDateStrategy: "dateNow",
        },
      };

      const rssXml = await generateRegistryRssFeed(options);

      expect(rssXml).not.toBeNull();
      expect(rssXml).toContain(
        "<link>https://cdn.example.com/custom-component</link>"
      );
      expect(rssXml).toContain(
        "<guid>https://cdn.example.com/custom-component</guid>"
      );
    });
  });

  describe("Type determination edge cases from real data", () => {
    it("should return valid type for all items", () => {
      registriesFixtures.forEach((registryFixture) => {
        const { items } = registryFixture.data;

        if (!items || items.length === 0) {
          return;
        }

        items.forEach((item) => {
          const type = determineRegistryItemType(item);

          // Just verify the function returns a valid type
          // The actual logic is tested in urls.ts
          expect([
            "component",
            "block",
            "lib",
            "hook",
            "file",
            "style",
            "theme",
            "item",
            "unknown",
          ]).toContain(type);
        });
      });
    });
  });
});
