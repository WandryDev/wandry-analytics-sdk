import { GenerateRssOptions } from "../../rss/types";

export const mockRequest = (
  url: string = "https://example.com/test"
): Request => {
  return new Request(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const mockRssOptions: GenerateRssOptions = {
  baseUrl: "https://example.com",
  rss: {
    title: "Test Registry",
    description: "Test registry description",
    link: "https://example.com",
    endpoint: "/rss.xml",
    pubDateStatagy: "dateNow",
  },
  registry: {
    path: "r/registry.json",
  },
};

export const mockGithubRssOptions: GenerateRssOptions = {
  ...mockRssOptions,
  rss: {
    ...mockRssOptions.rss,
    pubDateStatagy: "githubLastEdit",
  },
  github: {
    owner: "test-owner",
    repo: "test-repo",
    token: "ghp_test_token_123",
  },
};

export const mockFileMtimeRssOptions: GenerateRssOptions = {
  ...mockRssOptions,
  rss: {
    ...mockRssOptions.rss,
    pubDateStatagy: "fileMtime",
  },
};

export const mockCustomPubDateFunction = (component: any): Date => {
  return new Date("2024-01-15T12:00:00Z");
};

export const mockCustomFunctionRssOptions: GenerateRssOptions = {
  ...mockRssOptions,
  rss: {
    ...mockRssOptions.rss,
    pubDateStatagy: mockCustomPubDateFunction,
  },
};
