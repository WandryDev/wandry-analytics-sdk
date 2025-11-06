import { EventRequest } from "../types";

const REGISTRY_PATH = /^\/r(?:\/[A-Za-z0-9_-]+)*\/?$/;

export const isGetRequest = (request: EventRequest): boolean =>
  request.method.toUpperCase() === "GET";

export const isValidRegistryComponent = (request: EventRequest): boolean => {
  console.log(
    `[Wandry Analytics]: Validating request ${request.method} ${request.url}`
  );
  const pathname = new URL(request.url).pathname;

  if (!isGetRequest(request)) return false;

  if (!isRegistryPath(request)) return false;

  if (!pathname.endsWith(".json")) return false;

  if (pathname.includes(encodeURIComponent("{name}"))) return false;

  return true;
};

export const isRegistryPath = (request: EventRequest): boolean =>
  REGISTRY_PATH.test(new URL(request.url).pathname);
