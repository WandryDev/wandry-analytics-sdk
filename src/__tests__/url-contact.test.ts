import { describe, it, expect } from "vitest";
import { concatUrlParts } from "../utils/url-contact";

describe("url-contact.ts - URL concatenation", () => {
  describe("concatUrlParts()", () => {
    describe("Empty inputs", () => {
      it("should return empty string when no arguments provided", () => {
        expect(concatUrlParts()).toBe("");
      });

      it("should return empty string when all arguments are undefined", () => {
        expect(concatUrlParts(undefined, undefined, undefined)).toBe("");
      });

      it("should filter out undefined values", () => {
        expect(concatUrlParts("https://example.com", undefined, "path")).toBe(
          "https://example.com/path"
        );
      });

      it("should filter out empty strings", () => {
        expect(concatUrlParts("https://example.com", "", "path")).toBe(
          "https://example.com/path"
        );
      });
    });

    describe("Absolute URLs (http/https)", () => {
      it("should join simple parts with https", () => {
        expect(concatUrlParts("https://example.com", "path", "item")).toBe(
          "https://example.com/path/item"
        );
      });

      it("should join simple parts with http", () => {
        expect(concatUrlParts("http://example.com", "path", "item")).toBe(
          "http://example.com/path/item"
        );
      });

      it("should remove duplicate leading slashes", () => {
        expect(concatUrlParts("https://example.com", "/path", "/item")).toBe(
          "https://example.com/path/item"
        );
      });

      it("should remove duplicate trailing slashes", () => {
        expect(concatUrlParts("https://example.com/", "path/", "item/")).toBe(
          "https://example.com/path/item"
        );
      });

      it("should handle base URL with trailing slash", () => {
        expect(concatUrlParts("https://example.com/", "path", "item")).toBe(
          "https://example.com/path/item"
        );
      });

      it("should handle base URL without trailing slash", () => {
        expect(concatUrlParts("https://example.com", "path", "item")).toBe(
          "https://example.com/path/item"
        );
      });

      it("should handle multiple slashes in parts", () => {
        expect(
          concatUrlParts("https://example.com", "///path///", "///item///")
        ).toBe("https://example.com/path/item");
      });

      it("should preserve pathname from base URL", () => {
        expect(
          concatUrlParts("https://example.com/existing", "path", "item")
        ).toBe("https://example.com/existing/path/item");
      });

      it("should work with single path segment", () => {
        expect(concatUrlParts("https://example.com", "item")).toBe(
          "https://example.com/item"
        );
      });

      it("should handle empty path between base and item", () => {
        expect(concatUrlParts("https://example.com", undefined, "item")).toBe(
          "https://example.com/item"
        );
      });

      it("should preserve query parameters from base URL", () => {
        const result = concatUrlParts(
          "https://example.com?query=test",
          "path",
          "item"
        );
        expect(result).toBe("https://example.com/path/item?query=test");
      });

      it("should preserve hash from base URL", () => {
        const result = concatUrlParts(
          "https://example.com#hash",
          "path",
          "item"
        );
        expect(result).toBe("https://example.com/path/item#hash");
      });

      it("should preserve both query and hash from base URL", () => {
        const result = concatUrlParts(
          "https://example.com?query=test#hash",
          "path",
          "item"
        );
        expect(result).toBe("https://example.com/path/item?query=test#hash");
      });

      it("should handle URL with port", () => {
        expect(concatUrlParts("https://example.com:3000", "path", "item")).toBe(
          "https://example.com:3000/path/item"
        );
      });

      it("should remove trailing slash from result", () => {
        expect(concatUrlParts("https://example.com", "path", "item/")).toBe(
          "https://example.com/path/item"
        );
      });

      it("should keep root pathname", () => {
        expect(
          concatUrlParts("https://example.com", undefined, undefined)
        ).toBe("https://example.com");
      });
    });

    describe("Relative paths", () => {
      it("should join simple relative parts", () => {
        expect(concatUrlParts("path", "to", "item")).toBe("path/to/item");
      });

      it("should remove duplicate leading slashes in relative paths", () => {
        expect(concatUrlParts("/path", "/to", "/item")).toBe("path/to/item");
      });

      it("should remove duplicate trailing slashes in relative paths", () => {
        expect(concatUrlParts("path/", "to/", "item/")).toBe("path/to/item");
      });

      it("should handle multiple slashes in relative paths", () => {
        expect(concatUrlParts("///path///", "///to///", "///item///")).toBe(
          "path/to/item"
        );
      });

      it("should work with single relative part", () => {
        expect(concatUrlParts("item")).toBe("item");
      });

      it("should handle empty strings in relative paths", () => {
        expect(concatUrlParts("path", "", "item")).toBe("path/item");
      });

      it("should filter out undefined in relative paths", () => {
        expect(concatUrlParts("path", undefined, "item")).toBe("path/item");
      });

      it("should handle path starting with slash", () => {
        expect(concatUrlParts("/absolute", "path", "item")).toBe(
          "absolute/path/item"
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle all empty parts", () => {
        expect(concatUrlParts("", "", "")).toBe("");
      });

      it("should handle mixed empty and valid parts", () => {
        expect(concatUrlParts("", "path", "")).toBe("path");
      });

      it("should handle URL with subdomain", () => {
        expect(concatUrlParts("https://sub.example.com", "path", "item")).toBe(
          "https://sub.example.com/path/item"
        );
      });

      it("should handle complex URL with path, query, and hash", () => {
        const result = concatUrlParts(
          "https://example.com/existing?q=1#h",
          "new",
          "item"
        );
        expect(result).toBe("https://example.com/existing/new/item?q=1#h");
      });

      it("should handle very long path segments", () => {
        const longPath = "a".repeat(100);
        expect(concatUrlParts("https://example.com", longPath, "item")).toBe(
          `https://example.com/${longPath}/item`
        );
      });

      it("should handle special characters in path", () => {
        expect(
          concatUrlParts("https://example.com", "path-with-dashes", "item_name")
        ).toBe("https://example.com/path-with-dashes/item_name");
      });

      it("should handle path with encoded characters", () => {
        expect(
          concatUrlParts("https://example.com", "path%20with%20spaces", "item")
        ).toBe("https://example.com/path%20with%20spaces/item");
      });
    });

    describe("Real-world scenarios", () => {
      it("should handle RSS endpoint concatenation", () => {
        expect(concatUrlParts("https://example.com", "/rss.xml")).toBe(
          "https://example.com/rss.xml"
        );
      });

      it("should handle registry path concatenation", () => {
        expect(concatUrlParts("https://example.com", "r/registry.json")).toBe(
          "https://example.com/r/registry.json"
        );
      });

      it("should handle component URL concatenation", () => {
        expect(
          concatUrlParts("https://example.com", "components", "button")
        ).toBe("https://example.com/components/button");
      });

      it("should handle block URL concatenation", () => {
        expect(
          concatUrlParts("https://example.com", "blocks", "hero-section")
        ).toBe("https://example.com/blocks/hero-section");
      });

      it("should handle URL with existing pathname", () => {
        expect(
          concatUrlParts("https://example.com/docs", "components", "button")
        ).toBe("https://example.com/docs/components/button");
      });

      it("should handle base URL ending with slash and path starting with slash", () => {
        expect(
          concatUrlParts("https://example.com/", "/components", "button")
        ).toBe("https://example.com/components/button");
      });
    });
  });
});
