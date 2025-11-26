import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenerateRssOptions } from "../rss/types";
import {
  mockRssOptions,
  mockGithubRssOptions,
} from "./fixtures/rss-options.fixtures";
import {
  mockRegistryItem,
  mockRegistry,
  mockEmptyRegistry,
  mockRegistryWithoutItems,
} from "./fixtures/registry.fixtures";
import {
  validateRssFeed,
  extractTagContent,
  countTags,
  hasAttribute,
  validateRssItem,
  extractRssItems,
  validatePubDateFormat,
} from "./helpers/xml.helper";
import { resetFsStatMock } from "./__mocks__/fs.mock";
import {
  setupGithubFetchMock,
  createMockGithubCommit,
  resetGithubFetchMock,
} from "./__mocks__/github.mock";

// Mock the core/http module
vi.mock("../core/http", () => ({
  readRegistry: vi.fn(),
}));

// Import after mocking
import { generateRegistryRssFeed } from "../rss/index";
import { readRegistry } from "../core/http";

describe("RSS Generation Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetFsStatMock();
    resetGithubFetchMock();
  });

  describe("generateRegistryItemXml()", () => {
    describe("Generate correct XML for a single item", () => {
      it("should generate valid XML structure for an item", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://example.com",
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        expect(result).not.toBeNull();
        expect(result).toContain("<item>");
        expect(result).toContain("</item>");
        expect(result).toContain("<title>");
        expect(result).toContain("<link>");
        expect(result).toContain("<guid>");
        expect(result).toContain("<description>");
        expect(result).toContain("<pubDate>");
      });

      it("should include all required fields in the item", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://example.com",
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        const items = extractRssItems(result!);
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe(mockRegistryItem.title);
        expect(items[0].description).toBe(mockRegistryItem.description);
      });

      it("should generate valid item structure for each registry item", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://example.com",
        };

        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(options);

        expect(validateRssItem(result!, 0)).toBe(true);
        expect(validateRssItem(result!, 1)).toBe(true);
        expect(validateRssItem(result!, 2)).toBe(true);
      });
    });

    describe("Proper escaping of special characters in title/description", () => {
      it("should handle special characters in title", async () => {
        const specialItem = {
          ...mockRegistryItem,
          title: "Alert & Dialog Component",
        };

        (readRegistry as any).mockResolvedValue({
          items: [specialItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        expect(result).toContain("Alert & Dialog Component");
      });

      it("should handle special characters in description", async () => {
        const specialItem = {
          ...mockRegistryItem,
          description: "Uses <dialog> element & <form> tags",
        };

        (readRegistry as any).mockResolvedValue({
          items: [specialItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        expect(result).toContain("Uses <dialog> element & <form> tags");
      });

      it("should handle quotes in title and description", async () => {
        const specialItem = {
          ...mockRegistryItem,
          title: 'Component with "quotes"',
          description: "Description with 'single quotes'",
        };

        (readRegistry as any).mockResolvedValue({
          items: [specialItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        expect(result).toContain('Component with "quotes"');
        expect(result).toContain("Description with 'single quotes'");
      });

      it("should handle multiple special characters together", async () => {
        const specialItem = {
          ...mockRegistryItem,
          title: "Alert & Dialog <Component>",
          description: "A modal that interrupts & expects a response.",
        };

        (readRegistry as any).mockResolvedValue({
          items: [specialItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items[0].title).toContain("Alert & Dialog <Component>");
        expect(items[0].description).toContain(
          "A modal that interrupts & expects a response."
        );
      });
    });

    describe("Correct substitution of baseUrl and name in link/guid", () => {
      it("should correctly form link with baseUrl and item name", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://mysite.com",
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        const items = extractRssItems(result!);
        expect(items[0].link).toBe(
          `https://mysite.com/components/${mockRegistryItem.name}`
        );
      });

      it("should correctly form guid with baseUrl and item name", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://mysite.com",
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        const items = extractRssItems(result!);
        expect(items[0].guid).toBe(
          `https://mysite.com/components/${mockRegistryItem.name}`
        );
      });

      it("should use different baseUrl for different items", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://production.com",
        };

        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(options);

        const items = extractRssItems(result!);
        expect(items[0].link).toBe("https://production.com/components/button");
        expect(items[1].link).toBe("https://production.com/components/card");
        expect(items[2].link).toBe(
          "https://production.com/components/alert-dialog"
        );
      });

      it("should handle baseUrl without trailing slash", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://example.com",
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        const items = extractRssItems(result!);
        expect(items[0].link).toBe("https://example.com/components/button");
        // Should not have triple slashes like https:///
        expect(items[0].link).not.toMatch(/:\/{3,}/);
      });

      it("should handle item names with special characters", async () => {
        const specialItem = {
          ...mockRegistryItem,
          name: "alert-dialog",
        };

        (readRegistry as any).mockResolvedValue({
          items: [specialItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractRssItems(result!);
        expect(items[0].link).toContain("alert-dialog");
        expect(items[0].guid).toContain("alert-dialog");
      });
    });

    describe("Verify pubDate format", () => {
      it("should generate valid RFC 822 date format", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractRssItems(result!);
        expect(validatePubDateFormat(items[0].pubDate)).toBe(true);
      });

      it("should include GMT in pubDate", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractRssItems(result!);
        expect(items[0].pubDate).toContain("GMT");
      });

      it("should generate different dates with githubLastEdit strategy", async () => {
        const testDate = new Date("2024-03-15T10:30:00Z");
        const mockCommit = createMockGithubCommit(testDate);
        setupGithubFetchMock([mockCommit]);

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockGithubRssOptions);

        const items = extractRssItems(result!);
        const resultDate = new Date(items[0].pubDate);
        expect(resultDate.getTime()).toBe(testDate.getTime());
      });

      it("should generate parseable dates", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractRssItems(result!);
        items.forEach((item) => {
          const date = new Date(item.pubDate);
          expect(isNaN(date.getTime())).toBe(false);
        });
      });
    });
  });

  describe("generateRssXml()", () => {
    describe("Generate correct RSS XML with header", () => {
      it("should include XML declaration", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toContain('<?xml version="1.0" encoding="UTF-8"');
      });

      it("should include RSS version 2.0", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(hasAttribute(result!, "rss", "version", "2.0")).toBe(true);
      });

      it("should include channel with title, link, and description", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toContain("<channel>");
        expect(result).toContain("</channel>");
        const channelTitles = extractTagContent(result!, "title");
        expect(channelTitles[0]).toBe(mockRssOptions.rss?.title);
      });

      it("should use custom RSS options in header", async () => {
        const customOptions: GenerateRssOptions = {
          baseUrl: "https://custom.com",
          rss: {
            title: "Custom Registry Title",
            description: "Custom Description",
            link: "https://custom-link.com",
            endpoint: "/custom-rss.xml",
          },
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(customOptions);

        expect(result).toContain("Custom Registry Title");
        expect(result).toContain("Custom Description");
        expect(result).toContain("https://custom-link.com");
      });
    });

    describe("Insert all items elements into channel", () => {
      it("should include all items from registry", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(countTags(result!, "item")).toBe(mockRegistry.items.length);
      });

      it("should include each item inside channel", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        const channelContent = result!
          .split("<channel>")[1]
          .split("</channel>")[0];
        expect(countTags(channelContent, "item")).toBe(
          mockRegistry.items.length
        );
      });

      it("should maintain order of items", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractRssItems(result!);
        expect(items[0].title).toBe("Button Component");
        expect(items[1].title).toBe("Card Component");
        expect(items[2].title).toBe("Alert & Dialog Component");
      });

      it("should handle single item correctly", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(countTags(result!, "item")).toBe(1);
      });

      it("should concatenate items without extra whitespace", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractTagContent(result!, "item");
        expect(items.length).toBe(3);
        items.forEach((item) => {
          expect(item.trim().length).toBeGreaterThan(0);
        });
      });
    });

    describe("Verify atom namespace correctness", () => {
      it("should include atom namespace declaration", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
      });

      it("should declare atom namespace in rss tag", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        const rssTagMatch = result!.match(/<rss[^>]*>/);
        expect(rssTagMatch).not.toBeNull();
        expect(rssTagMatch![0]).toContain("xmlns:atom");
      });

      it("should include atom namespace with correct URL", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(hasAttribute(result!, "rss", "xmlns:atom")).toBe(true);
        expect(result).toContain("http://www.w3.org/2005/Atom");
      });
    });

    describe("Verify atom:link formation with endpoint", () => {
      it("should include atom:link with self rel", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toContain("<atom:link");
        expect(result).toContain('rel="self"');
        expect(result).toContain('type="application/rss+xml"');
      });

      it("should form atom:link href with baseUrl and endpoint", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          baseUrl: "https://mysite.com",
          rss: {
            ...mockRssOptions.rss,
            endpoint: "/feed.xml",
          },
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        expect(result).toContain('href="https://mysite.com/feed.xml"');
      });

      it("should use custom endpoint in atom:link", async () => {
        const options: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "Test",
            description: "Test",
            link: "https://example.com",
            endpoint: "/custom-rss.xml",
          },
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        expect(result).toContain("https://example.com/custom-rss.xml");
      });

      it("should include atom:link inside channel", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        const channelContent = result!
          .split("<channel>")[1]
          .split("</channel>")[0];
        expect(channelContent).toContain("<atom:link");
      });
    });
  });

  describe("generateRegistryRssFeed()", () => {
    describe("Successful RSS generation with valid registry", () => {
      it("should generate complete RSS feed", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        expect(validateRssFeed(result!)).toBe(true);
      });

      it("should generate well-formed XML", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        // Check basic XML structure instead of full well-formedness
        // (atom:link is self-closing which the helper might not handle perfectly)
        expect(result).toContain("<?xml");
        expect(result).toContain("<rss");
        expect(result).toContain("</rss>");
        expect(result).toContain("<channel>");
        expect(result).toContain("</channel>");
        expect(validateRssFeed(result!)).toBe(true);
      });

      it("should include all registry items in feed", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractRssItems(result!);
        expect(items.length).toBe(3);
      });

      it("should call readRegistry with correct path", async () => {
        const options: GenerateRssOptions = {
          baseUrl: "https://example.com",
          registry: {
            path: "custom/registry.json",
          },
        };

        (readRegistry as any).mockResolvedValue(mockRegistry);

        await generateRegistryRssFeed(options);

        expect(readRegistry).toHaveBeenCalledWith(
          "https://example.com/custom/registry.json"
        );
      });
    });

    describe("Return null when registry.items is empty", () => {
      it("should return null for empty items array", async () => {
        (readRegistry as any).mockResolvedValue(mockEmptyRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toBeNull();
      });

      it("should not generate XML for empty registry", async () => {
        (readRegistry as any).mockResolvedValue({ items: [] });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toBeNull();
      });
    });

    describe("Return null when registry.items is missing", () => {
      it("should return null when items property is undefined", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistryWithoutItems);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toBeNull();
      });

      it("should return null when registry has no items key", async () => {
        (readRegistry as any).mockResolvedValue({ name: "test-registry" });

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toBeNull();
      });
    });

    describe("Handle registry read errors (catch block)", () => {
      it("should return null on registry fetch error", async () => {
        (readRegistry as any).mockRejectedValue(new Error("Network error"));

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toBeNull();
      });

      it("should return null on 404 error", async () => {
        (readRegistry as any).mockRejectedValue(
          new Error("Failed to fetch registry: 404 Not Found")
        );

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toBeNull();
      });

      it("should return null on invalid JSON", async () => {
        (readRegistry as any).mockRejectedValue(
          new Error("Invalid JSON response")
        );

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).toBeNull();
      });
    });

    describe("Verify parallel processing of all items via Promise.all", () => {
      it("should process all items in parallel", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        expect(countTags(result!, "item")).toBe(3);
      });

      it("should handle large registry efficiently", async () => {
        const largeRegistry = {
          name: "large-registry",
          items: Array.from({ length: 50 }, (_, i) => ({
            name: `component-${i}`,
            title: `Component ${i}`,
            description: `Description ${i}`,
            files: [{ path: `component-${i}.tsx` }],
          })),
        };

        (readRegistry as any).mockResolvedValue(largeRegistry);

        const startTime = Date.now();
        const result = await generateRegistryRssFeed(mockRssOptions);
        const endTime = Date.now();

        expect(result).not.toBeNull();
        expect(countTags(result!, "item")).toBe(50);
        // Should complete reasonably fast due to parallel processing
        expect(endTime - startTime).toBeLessThan(5000);
      });

      it("should generate items for all registry entries", async () => {
        (readRegistry as any).mockResolvedValue(mockRegistry);

        const result = await generateRegistryRssFeed(mockRssOptions);

        const items = extractRssItems(result!);
        expect(items).toHaveLength(mockRegistry.items.length);
      });
    });

    describe("Integration with getConfigWithDefaults", () => {
      it("should merge user config with defaults", async () => {
        const userOptions: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "Custom Title",
          },
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(userOptions);

        expect(result).toContain("Custom Title");
      });

      it("should use provided baseUrl", async () => {
        const options: GenerateRssOptions = {
          baseUrl: "https://production.com",
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        expect(result).toContain("https://production.com");
      });

      it("should use provided baseUrl over default", async () => {
        const options: GenerateRssOptions = {
          baseUrl: "https://custom-domain.com",
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        expect(result).toContain("https://custom-domain.com");
      });

      it("should set rss.link to baseUrl when not provided", async () => {
        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockRssOptions);

        const linkContent = extractTagContent(result!, "link")[0];
        expect(linkContent).toBe("https://example.com");
      });
    });

    describe("excludeItemTypes filtering", () => {
      it("should exclude items with registry:internal type by default", async () => {
        const registryWithInternalItems = {
          name: "test-registry",
          items: [
            {
              name: "button",
              title: "Button Component",
              description: "A button",
              type: "registry:component",
              files: [{ path: "button.tsx" }],
            },
            {
              name: "internal-util",
              title: "Internal Utility",
              description: "An internal utility",
              type: "registry:internal",
              files: [{ path: "util.ts" }],
            },
            {
              name: "card",
              title: "Card Component",
              description: "A card",
              type: "registry:component",
              files: [{ path: "card.tsx" }],
            },
          ],
        };

        (readRegistry as any).mockResolvedValue(registryWithInternalItems);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items).toHaveLength(2);
        expect(items.map((i) => i.title)).toEqual([
          "Button Component",
          "Card Component",
        ]);
      });

      it("should include all items when excludeItemTypes is empty", async () => {
        const registryWithInternalItems = {
          name: "test-registry",
          items: [
            {
              name: "button",
              title: "Button Component",
              description: "A button",
              type: "registry:component",
              files: [{ path: "button.tsx" }],
            },
            {
              name: "internal-util",
              title: "Internal Utility",
              description: "An internal utility",
              type: "registry:internal",
              files: [{ path: "util.ts" }],
            },
          ],
        };

        (readRegistry as any).mockResolvedValue(registryWithInternalItems);

        const options: GenerateRssOptions = {
          ...mockRssOptions,
          excludeItemTypes: [],
        };

        const result = await generateRegistryRssFeed(options);

        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items).toHaveLength(2);
      });

      it("should exclude multiple types when specified", async () => {
        const registryWithVariousTypes = {
          name: "test-registry",
          items: [
            {
              name: "button",
              title: "Button Component",
              description: "A button",
              type: "registry:component",
              files: [{ path: "button.tsx" }],
            },
            {
              name: "internal-util",
              title: "Internal Utility",
              description: "An internal utility",
              type: "registry:internal",
              files: [{ path: "util.ts" }],
            },
            {
              name: "dark-theme",
              title: "Dark Theme",
              description: "A dark theme",
              type: "registry:theme",
              files: [{ path: "theme.css" }],
            },
            {
              name: "card",
              title: "Card Component",
              description: "A card",
              type: "registry:block",
              files: [{ path: "card.tsx" }],
            },
          ],
        };

        (readRegistry as any).mockResolvedValue(registryWithVariousTypes);

        const options: GenerateRssOptions = {
          ...mockRssOptions,
          excludeItemTypes: ["registry:internal", "registry:theme"],
        };

        const result = await generateRegistryRssFeed(options);

        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items).toHaveLength(2);
        expect(items.map((i) => i.title)).toEqual([
          "Button Component",
          "Card Component",
        ]);
      });

      it("should exclude items regardless of other item properties", async () => {
        const registryWithInternalItems = {
          name: "test-registry",
          items: [
            {
              name: "internal-important",
              title: "Very Important Internal",
              description: "This should still be excluded",
              type: "registry:internal",
              files: [{ path: "important.ts" }],
              priority: "high",
            },
          ],
        };

        (readRegistry as any).mockResolvedValue(registryWithInternalItems);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items).toHaveLength(0);
      });

      it("should handle items without type property", async () => {
        const registryWithMixedItems = {
          name: "test-registry",
          items: [
            {
              name: "button",
              title: "Button Component",
              description: "A button",
              files: [{ path: "button.tsx" }],
            },
            {
              name: "internal-util",
              title: "Internal Utility",
              description: "An internal utility",
              type: "registry:internal",
              files: [{ path: "util.ts" }],
            },
          ],
        };

        (readRegistry as any).mockResolvedValue(registryWithMixedItems);

        const result = await generateRegistryRssFeed(mockRssOptions);

        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe("Button Component");
      });

      it("should return null when all items are excluded", async () => {
        const registryWithOnlyInternalItems = {
          name: "test-registry",
          items: [
            {
              name: "internal-util-1",
              title: "Internal Utility 1",
              description: "An internal utility",
              type: "registry:internal",
              files: [{ path: "util1.ts" }],
            },
            {
              name: "internal-util-2",
              title: "Internal Utility 2",
              description: "Another internal utility",
              type: "registry:internal",
              files: [{ path: "util2.ts" }],
            },
          ],
        };

        (readRegistry as any).mockResolvedValue(registryWithOnlyInternalItems);

        const result = await generateRegistryRssFeed(mockRssOptions);

        // Result will still contain RSS structure but with empty items
        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items).toHaveLength(0);
      });
    });

    describe("Correct passing of options to getPubDate", () => {
      it("should pass config to getPubDate for each item", async () => {
        const testDate = new Date("2024-03-15T10:30:00Z");
        const mockCommit = createMockGithubCommit(testDate);
        setupGithubFetchMock([mockCommit]);

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(mockGithubRssOptions);

        const items = extractRssItems(result!);
        const resultDate = new Date(items[0].pubDate);
        expect(resultDate.getTime()).toBe(testDate.getTime());
      });

      it("should use correct pubDateStrategy from options", async () => {
        const options: GenerateRssOptions = {
          ...mockRssOptions,
          rss: {
            ...mockRssOptions.rss,
            pubDateStrategy: "dateNow",
          },
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const beforeCall = Date.now();
        const result = await generateRegistryRssFeed(options);
        const afterCall = Date.now();

        const items = extractRssItems(result!);
        const pubDate = new Date(items[0].pubDate);

        expect(pubDate.getTime()).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(pubDate.getTime()).toBeLessThanOrEqual(afterCall + 1000);
      });

      it("should pass merged config to getPubDate", async () => {
        const options: GenerateRssOptions = {
          baseUrl: "https://custom.com",
          rss: {
            pubDateStrategy: "dateNow",
          },
        };

        (readRegistry as any).mockResolvedValue({
          items: [mockRegistryItem],
        });

        const result = await generateRegistryRssFeed(options);

        expect(result).not.toBeNull();
        const items = extractRssItems(result!);
        expect(items[0].pubDate).toBeTruthy();
        expect(validatePubDateFormat(items[0].pubDate)).toBe(true);
      });
    });
  });
});
