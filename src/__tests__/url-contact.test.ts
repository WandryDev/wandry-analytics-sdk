import { describe, it, expect } from "vitest";
import { concatUrlParts } from "../utils/url-contact";

describe("url-contact.ts - URL concatenation", () => {
  describe("concatUrlParts()", () => {
    describe("Basic functionality", () => {
      it("should return empty string when no arguments provided", () => {
        expect(concatUrlParts()).toBe("");
      });

      it("should filter out undefined and empty values", () => {
        expect(concatUrlParts("path", undefined, "", "item")).toBe("path/item");
      });

      it("should join simple path parts", () => {
        expect(concatUrlParts("path", "to", "item")).toBe("path/to/item");
      });
    });

    describe("Absolute URLs override", () => {
      it("should use the last absolute URL as base", () => {
        expect(
          concatUrlParts(
            "http://base.com",
            "path",
            "http://newbase.com",
            "item"
          )
        ).toBe("http://newbase.com/item");
      });

      it("should ignore parts before an absolute URL", () => {
        expect(
          concatUrlParts("ignore", "me", "https://example.com", "path")
        ).toBe("https://example.com/path");
      });
    });

    describe("Slash normalization", () => {
      it("should remove duplicate slashes", () => {
        expect(concatUrlParts("path/", "/to/", "/item")).toBe("path/to/item");
      });

      it("should handle multiple slashes", () => {
        expect(concatUrlParts("path///", "///to///", "///item")).toBe(
          "path/to/item"
        );
      });
    });

    describe("Query parameters handling", () => {
      it("should preserve query parameters from base", () => {
        expect(concatUrlParts("http://base.com?a=1", "path")).toBe(
          "http://base.com/path?a=1"
        );
      });

      it("should preserve query parameters from parts", () => {
        expect(concatUrlParts("http://base.com", "path?b=2")).toBe(
          "http://base.com/path?b=2"
        );
      });

      it("should merge query parameters", () => {
        // Note: URLSearchParams might reorder params, but keys/values should be present
        const result = concatUrlParts("http://base.com?a=1", "path?b=2");
        expect(result).toContain("a=1");
        expect(result).toContain("b=2");
        expect(result).toMatch(/^http:\/\/base\.com\/path\?/);
      });

      it("should handle query parameters in relative paths", () => {
        expect(concatUrlParts("path?a=1", "item?b=2")).toMatch(
          /^path\/item\?(a=1&b=2|b=2&a=1)$/
        );
      });
    });

    describe("Hash fragments handling", () => {
      it("should preserve hash from base", () => {
        expect(concatUrlParts("http://base.com#hash", "path")).toBe(
          "http://base.com/path#hash"
        );
      });

      it("should allow overriding hash", () => {
        expect(concatUrlParts("http://base.com#old", "path#new")).toBe(
          "http://base.com/path#new"
        );
      });

      it("should handle both query and hash", () => {
        expect(concatUrlParts("http://base.com?a=1#hash", "path?b=2")).toMatch(
          /^http:\/\/base\.com\/path\?(a=1&b=2|b=2&a=1)#hash$/
        );
      });
    });

    describe("Real-world scenarios", () => {
      it("should handle component URL with params", () => {
        expect(
          concatUrlParts(
            "https://example.com",
            "components?target=block",
            "hero"
          )
        ).toBe("https://example.com/components/hero?target=block");
      });

      it("should handle resolver returning absolute URL", () => {
        expect(
          concatUrlParts("https://example.com", "https://cdn.com/item?v=1")
        ).toBe("https://cdn.com/item?v=1");
      });
    });
  });
});
