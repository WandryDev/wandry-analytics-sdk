import { vi } from "vitest";

export interface MockGithubCommit {
  sha: string;
  commit: {
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
}

export const createMockGithubCommit = (date: Date): MockGithubCommit => ({
  sha: "abc123def456",
  commit: {
    committer: {
      name: "Test User",
      email: "test@example.com",
      date: date.toISOString(),
    },
    message: "Test commit message",
  },
});

export const mockGithubApiResponse = (commits: MockGithubCommit[] = []) => {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(commits),
    text: vi.fn().mockResolvedValue(JSON.stringify(commits)),
  };
};

export const mockGithubApiError = (
  status: number = 404,
  message: string = "Not Found"
) => {
  return {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ message }),
    text: vi.fn().mockResolvedValue(message),
  };
};

export const setupGithubFetchMock = (commits: MockGithubCommit[] = []) => {
  const mockFetch = vi.fn().mockResolvedValue(mockGithubApiResponse(commits));
  global.fetch = mockFetch as any;
  return mockFetch;
};

export const setupGithubFetchError = (status: number = 404) => {
  const mockFetch = vi.fn().mockResolvedValue(mockGithubApiError(status));
  global.fetch = mockFetch as any;
  return mockFetch;
};

export const resetGithubFetchMock = () => {
  vi.restoreAllMocks();
};
