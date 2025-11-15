import { describe, it, expect, beforeEach } from "vitest";
import { getConfigWithDefaults } from "../rss/config";
import { GenerateRssOptions } from "../rss/types";

describe("config.ts - Configuration testing", () => {
  describe("getConfigWithDefaults()", () => {
    describe("Merging default options with user options", () => {
      it("should return default options when no config is provided", () => {
        const result = getConfigWithDefaults();

        expect(result.rss?.title).toBe("Shadcn Registry");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.endpoint).toBe("/rss.xml");
        expect(result.rss?.pubDateStrategy).toBe("dateNow");
        expect(result.registry?.path).toBe("r/registry.json");
      });

      it("should merge user options with defaults", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "Custom Registry",
            endpoint: "/custom-rss.xml",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.title).toBe("Custom Registry");
        expect(result.rss?.endpoint).toBe("/custom-rss.xml");
        // Default values should still be present
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.pubDateStrategy).toBe("dateNow");
      });

      it("should preserve all user-provided options", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://custom.com",
          rss: {
            title: "My Registry",
            description: "My custom description",
            link: "https://mylink.com",
            endpoint: "/my-rss.xml",
            pubDateStrategy: "githubLastEdit",
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

        const result = getConfigWithDefaults(userConfig);

        expect(result.baseUrl).toBe("https://custom.com");
        expect(result.rss?.title).toBe("My Registry");
        expect(result.rss?.description).toBe("My custom description");
        expect(result.rss?.link).toBe("https://mylink.com");
        expect(result.rss?.endpoint).toBe("/my-rss.xml");
        expect(result.rss?.pubDateStrategy).toBe("githubLastEdit");
        expect(result.registry?.path).toBe("custom/registry.json");
        expect(result.github?.owner).toBe("test-owner");
        expect(result.github?.repo).toBe("test-repo");
        expect(result.github?.token).toBe("test-token");
      });
    });

    describe("Using provided baseUrl", () => {
      it("should use provided baseUrl", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.baseUrl).toBe("https://example.com");
      });

      it("should use provided baseUrl with port", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com:3000",
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.baseUrl).toBe("https://example.com:3000");
      });

      it("should use provided localhost URL", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "http://localhost:3000",
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.baseUrl).toBe("http://localhost:3000");
      });

      it("should handle empty baseUrl", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "",
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.baseUrl).toBe("");
      });

      it("should use default empty baseUrl when not provided", () => {
        const result = getConfigWithDefaults();

        expect(result.baseUrl).toBe("");
      });
    });

    describe("Correct merging of nested objects (rss, registry)", () => {
      it("should merge rss nested object correctly", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "Custom Title",
            // description is not provided, should use default
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.title).toBe("Custom Title");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.endpoint).toBe("/rss.xml");
        expect(result.rss?.pubDateStrategy).toBe("dateNow");
      });

      it("should merge registry nested object correctly", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          registry: {
            path: "custom/path/registry.json",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.registry?.path).toBe("custom/path/registry.json");
      });

      it("should handle empty rss object by using all defaults", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {},
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.title).toBe("Shadcn Registry");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.rss?.endpoint).toBe("/rss.xml");
        expect(result.rss?.pubDateStrategy).toBe("dateNow");
      });

      it("should handle empty registry object by using all defaults", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          registry: {},
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.registry?.path).toBe("r/registry.json");
      });

      it("should merge multiple nested objects simultaneously", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "Custom RSS",
            endpoint: "/feed.xml",
          },
          registry: {
            path: "custom/registry.json",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.title).toBe("Custom RSS");
        expect(result.rss?.endpoint).toBe("/feed.xml");
        expect(result.rss?.description).toBe(
          "Use the Wandry UI CLI to install custom components and templates from the community."
        );
        expect(result.registry?.path).toBe("custom/registry.json");
      });
    });

    describe("Setting rss.link to baseUrl if not specified", () => {
      it("should set rss.link to empty string when no config provided", () => {
        const result = getConfigWithDefaults();

        expect(result.rss?.link).toBe("");
      });

      it("should set rss.link to baseUrl when rss.link is not provided", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "Custom Registry",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.link).toBe("https://example.com");
      });

      it("should use provided rss.link instead of baseUrl", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            link: "https://custom-link.com",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.link).toBe("https://custom-link.com");
      });

      it("should set rss.link to custom baseUrl when provided", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://custom.com",
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.link).toBe("https://custom.com");
        expect(result.baseUrl).toBe("https://custom.com");
      });

      it("should prefer rss.link over baseUrl", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://custom.com",
          rss: {
            link: "https://rss-link.com",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.link).toBe("https://rss-link.com");
        expect(result.baseUrl).toBe("https://custom.com");
      });
    });

    describe("Priority of user settings over defaults", () => {
      it("should give priority to user rss.title over default", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "User Title",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.title).toBe("User Title");
      });

      it("should give priority to user rss.description over default", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            description: "User Description",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.description).toBe("User Description");
      });

      it("should give priority to user rss.endpoint over default", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            endpoint: "/user-feed.xml",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.endpoint).toBe("/user-feed.xml");
      });

      it("should give priority to user rss.pubDateStrategy over default", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            pubDateStrategy: "fileMtime",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.rss?.pubDateStrategy).toBe("fileMtime");
      });

      it("should give priority to user registry.path over default", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          registry: {
            path: "user/path/registry.json",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        expect(result.registry?.path).toBe("user/path/registry.json");
      });

      it("should override all defaults when all user options are provided", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://user.com",
          rss: {
            title: "User Registry",
            description: "User Description",
            link: "https://user-link.com",
            endpoint: "/user-rss.xml",
            pubDateStrategy: "githubLastEdit",
          },
          registry: {
            path: "user/registry.json",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        // All values should be from user config
        expect(result.baseUrl).toBe("https://user.com");
        expect(result.rss?.title).toBe("User Registry");
        expect(result.rss?.description).toBe("User Description");
        expect(result.rss?.link).toBe("https://user-link.com");
        expect(result.rss?.endpoint).toBe("/user-rss.xml");
        expect(result.rss?.pubDateStrategy).toBe("githubLastEdit");
        expect(result.registry?.path).toBe("user/registry.json");

        // Nothing should match defaults
        expect(result.rss?.title).not.toBe("Shadcn Registry");
        expect(result.rss?.endpoint).not.toBe("/rss.xml");
        expect(result.registry?.path).not.toBe("r/registry.json");
      });

      it("should handle falsy user values correctly (not override with defaults)", () => {
        const userConfig: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "",
            endpoint: "",
          },
        };

        const result = getConfigWithDefaults(userConfig);

        // Empty strings should be preserved, not replaced with defaults
        expect(result.rss?.title).toBe("");
        expect(result.rss?.endpoint).toBe("");
      });
    });
  });
});
