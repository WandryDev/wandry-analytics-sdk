import { describe, it, expect, beforeEach } from "vitest";
import { getConfigWithDefaults } from "../rss/config";
import { GenerateRssOptions } from "../rss/types";
import { mockRequest } from "./fixtures/rss-options.fixtures";

describe("config.ts - Configuration testing", () => {
  describe("getConfigWithDefaults()", () => {
    describe("Merging default options with user options", () => {
      it("should return default options when no config is provided", () => {
        const request = mockRequest("https://example.com/test");
        const result = getConfigWithDefaults(request);

        expect(result.rss?.title).toBe("Shadcn Registry");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.endpoint).toBe("/rss.xml");
        expect(result.rss?.pubDateStatagy).toBe("dateNow");
        expect(result.registry?.path).toBe("r/registry.json");
      });

      it("should merge user options with defaults", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            title: "Custom Registry",
            endpoint: "/custom-rss.xml",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.title).toBe("Custom Registry");
        expect(result.rss?.endpoint).toBe("/custom-rss.xml");
        // Default values should still be present
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.pubDateStatagy).toBe("dateNow");
      });

      it("should preserve all user-provided options", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://custom.com",
          rss: {
            title: "My Registry",
            description: "My custom description",
            link: "https://mylink.com",
            endpoint: "/my-rss.xml",
            pubDateStatagy: "githubLastEdit",
          },
          registry: {
            path: "custom/registry.json",
          },
          github: {
            owner: "test-owner",
            repo: "test-repo",
            token: "test-token",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.baseUrl).toBe("https://custom.com");
        expect(result.rss?.title).toBe("My Registry");
        expect(result.rss?.description).toBe("My custom description");
        expect(result.rss?.link).toBe("https://mylink.com");
        expect(result.rss?.endpoint).toBe("/my-rss.xml");
        expect(result.rss?.pubDateStatagy).toBe("githubLastEdit");
        expect(result.registry?.path).toBe("custom/registry.json");
        expect(result.github?.owner).toBe("test-owner");
        expect(result.github?.repo).toBe("test-repo");
        expect(result.github?.token).toBe("test-token");
      });
    });

    describe("Extracting baseUrl from request.url", () => {
      it("should extract origin from request URL", () => {
        const request = mockRequest("https://example.com/some/path");
        const result = getConfigWithDefaults(request);

        expect(result.baseUrl).toBe("https://example.com");
      });

      it("should extract origin from request URL with port", () => {
        const request = mockRequest("https://example.com:3000/api/test");
        const result = getConfigWithDefaults(request);

        expect(result.baseUrl).toBe("https://example.com:3000");
      });

      it("should extract origin from localhost URL", () => {
        const request = mockRequest("http://localhost:3000/path");
        const result = getConfigWithDefaults(request);

        expect(result.baseUrl).toBe("http://localhost:3000");
      });

      it("should extract origin from URL with query parameters", () => {
        const request = mockRequest("https://example.com/path?query=value");
        const result = getConfigWithDefaults(request);

        expect(result.baseUrl).toBe("https://example.com");
      });

      it("should extract origin from URL with hash", () => {
        const request = mockRequest("https://example.com/path#section");
        const result = getConfigWithDefaults(request);

        expect(result.baseUrl).toBe("https://example.com");
      });
    });

    describe("Using provided baseUrl instead of extracted one", () => {
      it("should use provided baseUrl over extracted origin", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://custom-domain.com",
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.baseUrl).toBe("https://custom-domain.com");
      });

      it("should use provided baseUrl even when request URL is different", () => {
        const request = mockRequest("http://localhost:3000/test");
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://production.com",
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.baseUrl).toBe("https://production.com");
      });

      it("should use provided empty string baseUrl if specified", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          baseUrl: "",
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.baseUrl).toBe("");
      });
    });

    describe("Correct merging of nested objects (rss, registry)", () => {
      it("should merge rss nested object correctly", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            title: "Custom Title",
            // description is not provided, should use default
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.title).toBe("Custom Title");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.endpoint).toBe("/rss.xml");
        expect(result.rss?.pubDateStatagy).toBe("dateNow");
      });

      it("should merge registry nested object correctly", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          registry: {
            path: "custom/path/registry.json",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.registry?.path).toBe("custom/path/registry.json");
      });

      it("should handle empty rss object by using all defaults", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {},
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.title).toBe("Shadcn Registry");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.endpoint).toBe("/rss.xml");
        expect(result.rss?.pubDateStatagy).toBe("dateNow");
      });

      it("should handle empty registry object by using all defaults", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          registry: {},
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.registry?.path).toBe("r/registry.json");
      });

      it("should merge multiple nested objects simultaneously", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            title: "Custom RSS",
            endpoint: "/feed.xml",
          },
          registry: {
            path: "custom/registry.json",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.title).toBe("Custom RSS");
        expect(result.rss?.endpoint).toBe("/feed.xml");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.registry?.path).toBe("custom/registry.json");
      });
    });

    describe("Setting rss.link to baseUrl if not specified", () => {
      it("should set rss.link to extracted baseUrl when not provided", () => {
        const request = mockRequest("https://example.com/test");
        const result = getConfigWithDefaults(request);

        expect(result.rss?.link).toBe("https://example.com");
      });

      it("should set rss.link to extracted baseUrl when rss is provided but link is not", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            title: "Custom Registry",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.link).toBe("https://example.com");
      });

      it("should use provided rss.link instead of baseUrl", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            link: "https://custom-link.com",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.link).toBe("https://custom-link.com");
      });

      it("should set rss.link to custom baseUrl when provided", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://custom.com",
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.link).toBe("https://example.com");
        expect(result.baseUrl).toBe("https://custom.com");
      });

      it("should prefer rss.link over both baseUrl and extracted origin", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://custom.com",
          rss: {
            link: "https://rss-link.com",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.link).toBe("https://rss-link.com");
        expect(result.baseUrl).toBe("https://custom.com");
      });
    });

    describe("Priority of user settings over defaults", () => {
      it("should give priority to user rss.title over default", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            title: "User Title",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.title).toBe("User Title");
      });

      it("should give priority to user rss.description over default", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            description: "User Description",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.description).toBe("User Description");
      });

      it("should give priority to user rss.endpoint over default", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            endpoint: "/user-feed.xml",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.endpoint).toBe("/user-feed.xml");
      });

      it("should give priority to user rss.pubDateStatagy over default", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            pubDateStatagy: "fileMtime",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.rss?.pubDateStatagy).toBe("fileMtime");
      });

      it("should give priority to user registry.path over default", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          registry: {
            path: "user/path/registry.json",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        expect(result.registry?.path).toBe("user/path/registry.json");
      });

      it("should override all defaults when all user options are provided", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://user.com",
          rss: {
            title: "User Registry",
            description: "User Description",
            link: "https://user-link.com",
            endpoint: "/user-rss.xml",
            pubDateStatagy: "githubLastEdit",
          },
          registry: {
            path: "user/registry.json",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        // All values should be from user config
        expect(result.baseUrl).toBe("https://user.com");
        expect(result.rss?.title).toBe("User Registry");
        expect(result.rss?.description).toBe("User Description");
        expect(result.rss?.link).toBe("https://user-link.com");
        expect(result.rss?.endpoint).toBe("/user-rss.xml");
        expect(result.rss?.pubDateStatagy).toBe("githubLastEdit");
        expect(result.registry?.path).toBe("user/registry.json");

        // Nothing should match defaults
        expect(result.rss?.title).not.toBe("Shadcn Registry");
        expect(result.rss?.endpoint).not.toBe("/rss.xml");
        expect(result.registry?.path).not.toBe("r/registry.json");
      });

      it("should handle falsy user values correctly (not override with defaults)", () => {
        const request = mockRequest("https://example.com/test");
        const userConfig: GenerateRssOptions = {
          rss: {
            title: "",
            endpoint: "",
          },
        };

        const result = getConfigWithDefaults(request, userConfig);

        // Empty strings should be preserved, not replaced with defaults
        expect(result.rss?.title).toBe("");
        expect(result.rss?.endpoint).toBe("");
      });
    });
  });
});
