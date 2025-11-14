import { vi } from "vitest";

export const mockStat = vi.fn();

export const createMockFileStat = (mtime: Date) => {
  mockStat.mockResolvedValue({
    mtime,
    atime: new Date(),
    ctime: new Date(),
    birthtime: new Date(),
    size: 1024,
    isFile: () => true,
    isDirectory: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  });
  return mockStat;
};

export const createMockFileStatError = (error: Error) => {
  mockStat.mockRejectedValue(error);
  return mockStat;
};

export const resetFsStatMock = () => {
  mockStat.mockReset();
};

vi.mock("fs/promises", () => ({
  default: {
    stat: mockStat,
  },
  stat: mockStat,
}));
