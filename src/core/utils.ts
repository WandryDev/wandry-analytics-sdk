import { EventRequest } from "../types";

const REGISTRY_PATH = /^\/r(?:\/.*)?$/;

export const isGetRequest = (request: EventRequest): boolean =>
  request.method.toUpperCase() === "GET";

export const isValidRegistryComponent = (request: EventRequest): boolean => {
  const pathname = new URL(request.url).pathname;

  if (!isGetRequest(request)) return false;

  if (!isRegistryPath(request)) return false;

  if (!pathname.endsWith(".json")) return false;

  if (pathname.includes("{name}")) return false;

  return true;
};

export const isRegistryPath = (request: EventRequest): boolean =>
  REGISTRY_PATH.test(new URL(request.url).pathname);
