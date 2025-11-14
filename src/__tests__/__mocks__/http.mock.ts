import { vi } from "vitest";

export const mockReadRegistry = vi.fn();

export const createMockReadRegistry = (data: any) => {
  mockReadRegistry.mockResolvedValue(data);
  return mockReadRegistry;
};

export const createMockReadRegistryError = (error: Error) => {
  mockReadRegistry.mockRejectedValue(error);
  return mockReadRegistry;
};

export const resetReadRegistryMock = () => {
  mockReadRegistry.mockReset();
};
