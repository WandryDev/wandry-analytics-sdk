import { describe, it, expect, vi } from "vitest";
import { getItemUrl, resolveUrl } from "../rss/urls";
import { GenerateRssOptions, RegistryItem } from "../rss/types";

// Mock determineRegistryItemType to simplify testing
vi.mock("../rss/type-determiner", () => ({
  determineRegistryItemType: vi.fn().mockImplementation((item) => {
    return item.type === "registry:block" ? "block" : "component";
  }),
}));

describe("urls.ts - URL generation", () => {
  const mockItem: RegistryItem = {
    name: "test-component",
    title: "Test Component",
    description: "A test component",
    type: "registry:component",
    files: [],
  };

  const mockBlockItem: RegistryItem = {
    name: "test-block",
    title: "Test Block",
    description: "A test block",
    type: "registry:block",
    files: [],
  };

  const mockItemWithFiles: RegistryItem = {
    name: "card",
    title: "Card Component",
    description: "A card with multiple files",
    type: "registry:component",
    files: [
      { path: "components/ui/card.tsx", type: "registry:component" },
      { path: "components/ui/card-header.tsx", type: "registry:component" },
    ],
  };

  describe("resolveUrl()", () => {
    describe("name-based resolver (backward compatibility)", () => {
      it("should work with simple string concatenation", () => {
        const resolver = (name: string) => `components/${name}`;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("components/test-component");
      });

      it("should work with template literals", () => {
        const resolver = (name: string) => `ui/${name}/view`;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("ui/test-component/view");
      });

      it("should work with query parameters", () => {
        const resolver = (name: string) => `docs/${name}?tab=preview`;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("docs/test-component?tab=preview");
      });

      it("should work with absolute URLs", () => {
        const resolver = (name: string) => `https://cdn.example.com/${name}`;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("https://cdn.example.com/test-component");
      });
    });

    describe("item-based resolver (new functionality)", () => {
      it("should receive full RegistryItem and access name", () => {
        const resolver = (item: RegistryItem) => `components/${item.name}`;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("components/test-component");
      });

      it("should access item title", () => {
        const resolver = (item: RegistryItem) =>
          `docs/${item.name}?title=${encodeURIComponent(item.title)}`;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("docs/test-component?title=Test%20Component");
      });

      it("should access item description", () => {
        const resolver = (item: RegistryItem) =>
          item.description.length > 10
            ? `detailed/${item.name}`
            : `simple/${item.name}`;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("detailed/test-component");
      });

      it("should access item type", () => {
        const resolver = (item: RegistryItem) => {
          const typeSlug = item.type?.replace("registry:", "") ?? "unknown";
          return `${typeSlug}/${item.name}`;
        };
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("component/test-component");
      });

      it("should access item files array", () => {
        const resolver = (item: RegistryItem) => {
          const fileCount = item.files?.length ?? 0;
          return fileCount > 1
            ? `multi-file/${item.name}`
            : `single-file/${item.name}`;
        };
        const result = resolveUrl(resolver, mockItemWithFiles);
        expect(result).toBe("multi-file/card");
      });

      it("should access file paths from item", () => {
        const resolver = (item: RegistryItem) => {
          const firstFilePath = item.files?.[0]?.path ?? "";
          const dir = firstFilePath.split("/").slice(0, -1).join("/");
          return `${dir}/${item.name}`;
        };
        const result = resolveUrl(resolver, mockItemWithFiles);
        expect(result).toBe("components/ui/card");
      });

      it("should support custom item properties", () => {
        const itemWithCustomProps: RegistryItem = {
          ...mockItem,
          category: "forms",
          version: "2.0",
        };
        const resolver = (item: RegistryItem) =>
          `${item.category}/${item.name}/v${item.version}`;
        const result = resolveUrl(resolver, itemWithCustomProps);
        expect(result).toBe("forms/test-component/v2.0");
      });

      it("should handle conditional logic based on item properties", () => {
        const resolver = (item: RegistryItem) => {
          if (item.type === "registry:block") {
            return `blocks/${item.name}`;
          }
          return `components/${item.name}`;
        };

        expect(resolveUrl(resolver, mockItem)).toBe(
          "components/test-component"
        );
        expect(resolveUrl(resolver, mockBlockItem)).toBe("blocks/test-block");
      });
    });

    describe("edge cases", () => {
      it("should handle resolver returning empty string", () => {
        const resolver = () => "";
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("");
      });

      it("should handle resolver returning null/undefined", () => {
        const resolver = () => null as unknown as string;
        const result = resolveUrl(resolver, mockItem);
        expect(result).toBe("");
      });

      it("should distinguish between name-based and item-based resolvers correctly", () => {
        // This name-based resolver would produce [object Object] if called with item
        const nameResolver = (name: string) => "prefix-" + name + "-suffix";
        const resultName = resolveUrl(nameResolver, mockItem);
        expect(resultName).toBe("prefix-test-component-suffix");

        // This item-based resolver properly uses item.name
        const itemResolver = (item: RegistryItem) =>
          "prefix-" + item.name + "-suffix";
        const resultItem = resolveUrl(itemResolver, mockItem);
        expect(resultItem).toBe("prefix-test-component-suffix");
      });
    });
  });

  describe("getItemUrl()", () => {
    it("should use string path resolver from config", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: "ui",
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/ui/test-component");
    });

    it("should use name-based function resolver from config", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (name: string) => `components/${name}/view`,
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/components/test-component/view");
    });

    it("should use item-based function resolver from config", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (item: RegistryItem) =>
          `${item.type?.replace("registry:", "")}/${item.name}`,
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/component/test-component");
    });

    it("should allow item-based resolver to access files", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (item: RegistryItem) => {
          const fileCount = item.files?.length ?? 0;
          return `components/${item.name}?files=${fileCount}`;
        },
      };

      const url = getItemUrl(mockItemWithFiles, options);
      expect(url).toBe("https://example.com/components/card?files=2");
    });

    it("should handle absolute URLs from function resolver", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (name: string) => `https://cdn.example.com/${name}`,
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://cdn.example.com/test-component");
    });

    it("should handle different item types (blocks)", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        blocksUrl: "sections",
      };

      const url = getItemUrl(mockBlockItem, options);
      expect(url).toBe("https://example.com/sections/test-block");
    });

    it("should fallback to baseUrl/name if no specific config provided", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/test-component");
    });

    it("should handle query parameters from resolver", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (name: string) => `components/${name}?v=1`,
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/components/test-component?v=1");
    });

    it("should support item-based resolver for blocks", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        blocksUrl: (item: RegistryItem) =>
          `blocks/${item.title.toLowerCase().replace(/\s+/g, "-")}`,
      };

      const url = getItemUrl(mockBlockItem, options);
      expect(url).toBe("https://example.com/blocks/test-block");
    });
  });
});
