import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenerateRssOptions } from "../rss/types";
import {
  mockRssOptions,
  mockGithubRssOptions,
  mockFileMtimeRssOptions,
  mockCustomFunctionRssOptions,
} from "./fixtures/rss-options.fixtures";
import { mockRegistryItem } from "./fixtures/registry.fixtures";
import {
  createMockGithubCommit,
  setupGithubFetchMock,
  setupGithubFetchError,
  resetGithubFetchMock,
} from "./__mocks__/github.mock";
import { createMockFileStat, resetFsStatMock } from "./__mocks__/fs.mock";

// Import getPubDate after mocks are set up
import { getPubDate } from "../rss/pub-date";
import path from "path";

describe("pub-date.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetGithubFetchMock();
    resetFsStatMock();
  });

  describe("getPubDate()", () => {
    describe("dateNow", () => {
      it("should return the current date now as a UTC string", async () => {
        const beforeCall = Date.now();
        const result = await getPubDate(mockRegistryItem, mockRssOptions);
        const afterCall = Date.now();

        expect(typeof result).toBe("string");

        const resultDate = new Date(result as string);

        expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall + 1000);

        expect(resultDate.toString()).not.toBe("Invalid Date");
      });

      it("should return the date in the correct UTC format", async () => {
        const result = await getPubDate(mockRegistryItem, mockRssOptions);

        expect(result).toMatch(/GMT/);
      });
    });

    describe("githubLastEdit", () => {
      it("should return the date of the last commit from the GitHub API", async () => {
        const testDate = new Date("2024-03-15T10:30:00Z");
        const mockCommit = createMockGithubCommit(testDate);
        setupGithubFetchMock([mockCommit]);

        const result = await getPubDate(mockRegistryItem, mockGithubRssOptions);

        const resultDate = new Date(result);
        expect(resultDate.getTime()).toBe(testDate.getTime());
      });

      it("should call the GitHub API with the correct parameters", async () => {
        const testDate = new Date("2024-03-15T10:30:00Z");
        const mockCommit = createMockGithubCommit(testDate);
        const mockFetch = setupGithubFetchMock([mockCommit]);

        await getPubDate(mockRegistryItem, mockGithubRssOptions);

        expect(mockFetch).toHaveBeenCalled();

        const callUrl = mockFetch.mock.calls[0][0] as string;

        expect(callUrl).toContain("/repos/test-owner/test-repo/commits");
        expect(decodeURIComponent(callUrl)).toContain(
          `path=${mockRegistryItem.files[0].path}`
        );
        expect(callUrl).toContain("page=1");
        expect(callUrl).toContain("per_page=1");
      });

      it("should pass the authorization token in headers", async () => {
        const testDate = new Date("2024-03-15T10:30:00Z");
        const mockCommit = createMockGithubCommit(testDate);
        const mockFetch = setupGithubFetchMock([mockCommit]);

        await getPubDate(mockRegistryItem, mockGithubRssOptions);

        const callOptions = mockFetch.mock.calls[0][1] as RequestInit;
        const headers = callOptions.headers as Headers;

        expect(headers.get("authorization")).toBe("ghp_test_token_123");
      });

      it("should fallback to current date if the commits array is empty", async () => {
        setupGithubFetchMock([]);

        const beforeCall = Date.now();
        const result = await getPubDate(mockRegistryItem, mockGithubRssOptions);
        const afterCall = Date.now();

        // When the commits array is empty, getGithubLastEdit returns null, which falls back to dateNow
        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);

        const resultDate = new Date(result);
        expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall + 1000);
      });
    });

    describe("githubLastEdit with API error (fallback to dateNow)", () => {
      it("should return the current date on API error", async () => {
        setupGithubFetchError(404);

        const beforeCall = Date.now();
        const result = await getPubDate(mockRegistryItem, mockGithubRssOptions);
        const afterCall = Date.now();

        expect(typeof result).toBe("string");

        const resultDate = new Date(result as string);

        expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall + 1000);
      });

      it("should return fallback date on 500 error", async () => {
        setupGithubFetchError(500);

        const result = await getPubDate(mockRegistryItem, mockGithubRssOptions);

        expect(typeof result).toBe("string");
        const resultDate = new Date(result as string);
        expect(resultDate.toString()).not.toBe("Invalid Date");
      });

      it("should return fallback date on network error", async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
        global.fetch = mockFetch as any;

        const result = await getPubDate(mockRegistryItem, mockGithubRssOptions);

        expect(typeof result).toBe("string");
        const resultDate = new Date(result as string);
        expect(resultDate.toString()).not.toBe("Invalid Date");
      });
    });

    describe("fileMtime strategy - returns file modification time", () => {
      it("should return file modification time", async () => {
        const testMtime = new Date("2024-02-20T15:45:00Z");
        createMockFileStat(testMtime);

        const result = await getPubDate(
          mockRegistryItem,
          mockFileMtimeRssOptions
        );

        const resultDate = new Date(result as string);
        expect(resultDate.getTime()).toBe(testMtime.getTime());
      });

      it("should call fs.stat with the correct path", async () => {
        const testMtime = new Date("2024-02-20T15:45:00Z");
        const mockStat = createMockFileStat(testMtime);

        await getPubDate(mockRegistryItem, mockFileMtimeRssOptions);

        expect(mockStat).toHaveBeenCalledWith(
          path.resolve(process.cwd(), mockRegistryItem.files[0].path)
        );
      });

      it("should return date in UTC string format", async () => {
        const testMtime = new Date("2024-02-20T15:45:00Z");
        createMockFileStat(testMtime);

        const result = await getPubDate(
          mockRegistryItem,
          mockFileMtimeRssOptions
        );

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT/);
      });
    });

    describe("Custom function strategy (PubDateStrategyFn) tests", () => {
      it("should call custom function and return its result", async () => {
        const result = await getPubDate(
          mockRegistryItem,
          mockCustomFunctionRssOptions
        );

        const expectedDate = new Date("2024-01-15T12:00:00Z");
        const resultDate = new Date(result as string);

        expect(resultDate.getTime()).toBe(expectedDate.getTime());
      });

      it("should pass the component to the custom function", async () => {
        const customFn = vi
          .fn()
          .mockReturnValue(new Date("2024-01-15T12:00:00Z"));

        const customOptions: GenerateRssOptions = {
          ...mockRssOptions,
          rss: {
            ...mockRssOptions.rss,
            pubDateStrategy: customFn,
          },
        };

        await getPubDate(mockRegistryItem, customOptions);

        expect(customFn).toHaveBeenCalledWith(mockRegistryItem);
      });

      it("should work with async custom function", async () => {
        const asyncCustomFn = vi
          .fn()
          .mockResolvedValue(new Date("2024-01-15T12:00:00Z"));

        const customOptions: GenerateRssOptions = {
          ...mockRssOptions,
          rss: {
            ...mockRssOptions.rss,
            pubDateStrategy: asyncCustomFn,
          },
        };

        const result = await getPubDate(mockRegistryItem, customOptions);

        const expectedDate = new Date("2024-01-15T12:00:00Z");
        const resultDate = new Date(result as string);

        expect(resultDate.getTime()).toBe(expectedDate.getTime());
      });

      it("should return result in UTC string format", async () => {
        const result = await getPubDate(
          mockRegistryItem,
          mockCustomFunctionRssOptions
        );

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT/);
      });
    });

    describe("Error throwing check for invalid strategy", () => {
      it("should fallback to dateNow for invalid string strategy", async () => {
        const invalidOptions: GenerateRssOptions = {
          ...mockRssOptions,
          rss: {
            ...mockRssOptions.rss,
            pubDateStrategy: "invalidStrategy" as any,
          },
        };

        const beforeCall = Date.now();
        const result = await getPubDate(mockRegistryItem, invalidOptions);
        const afterCall = Date.now();

        // Invalid strategy falls back to dateNow
        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);

        const resultDate = new Date(result);
        expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall + 1000);
      });

      it("should use dateNow for null strategy", async () => {
        const invalidOptions: GenerateRssOptions = {
          ...mockRssOptions,
          rss: {
            ...mockRssOptions.rss,
            pubDateStrategy: null as any,
          },
        };

        const beforeCall = Date.now();
        const result = await getPubDate(mockRegistryItem, invalidOptions);
        const afterCall = Date.now();

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);

        const resultDate = new Date(result);
        expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall + 1000);
      });

      it("should use dateNow when strategy is undefined (if rss is defined)", async () => {
        const invalidOptions: GenerateRssOptions = {
          ...mockRssOptions,
          rss: {
            ...mockRssOptions.rss,
            pubDateStrategy: undefined as any,
          },
        };

        const beforeCall = Date.now();
        const result = await getPubDate(mockRegistryItem, invalidOptions);
        const afterCall = Date.now();

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);

        const resultDate = new Date(result);
        expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall + 1000);
      });
    });

    describe("Behavior check when pubDateStrategy is not specified (default dateNow)", () => {
      it("should use dateNow when pubDateStrategy is not specified", async () => {
        const optionsWithoutStrategy: GenerateRssOptions = {
          ...mockRssOptions,
          rss: {
            ...mockRssOptions.rss,
            pubDateStrategy: undefined,
          },
        };

        const beforeCall = Date.now();
        const result = await getPubDate(
          mockRegistryItem,
          optionsWithoutStrategy
        );
        const afterCall = Date.now();

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);

        const resultTime = new Date(result).getTime();
        expect(resultTime).toBeGreaterThanOrEqual(beforeCall - 1000);
        expect(resultTime).toBeLessThanOrEqual(afterCall + 1000);
      });

      it("should use dateNow when rss.pubDateStrategy is not defined", async () => {
        const optionsWithoutPubDate: GenerateRssOptions = {
          baseUrl: "https://example.com",
          rss: {
            title: "Test",
            description: "Test",
            link: "https://example.com",
          },
        };

        const result = await getPubDate(
          mockRegistryItem,
          optionsWithoutPubDate
        );

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);
        expect(new Date(result).toString()).not.toBe("Invalid Date");
      });

      it("should use dateNow when rss is not defined", async () => {
        const optionsWithoutRss: GenerateRssOptions = {
          baseUrl: "https://example.com",
        };

        const result = await getPubDate(mockRegistryItem, optionsWithoutRss);

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);
        expect(new Date(result).toString()).not.toBe("Invalid Date");
      });

      it("should return UTC string by default", async () => {
        const optionsWithoutStrategy: GenerateRssOptions = {
          baseUrl: "https://example.com",
        };

        const result = await getPubDate(
          mockRegistryItem,
          optionsWithoutStrategy
        );

        expect(typeof result).toBe("string");
        expect(result).toMatch(/GMT$/);
      });
    });
  });
});
