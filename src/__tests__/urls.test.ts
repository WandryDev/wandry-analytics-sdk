import { describe, it, expect, vi } from "vitest";
import { getItemUrl } from "../rss/urls";
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

  describe("getItemUrl()", () => {
    it("should use string path resolver from config", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: "ui",
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/ui/test-component");
    });

    it("should use function resolver from config", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (name) => `components/${name}/view`,
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/components/test-component/view");
    });

    it("should handle absolute URLs from function resolver", () => {
      const options: GenerateRssOptions = {
        baseUrl: "https://example.com",
        componentsUrl: (name) => `https://cdn.example.com/${name}`,
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
        componentsUrl: (name) => `components/${name}?v=1`,
      };

      const url = getItemUrl(mockItem, options);
      expect(url).toBe("https://example.com/components/test-component?v=1");
    });
  });
});
