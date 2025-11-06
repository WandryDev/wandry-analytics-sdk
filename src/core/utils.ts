import { EventRequest } from "../types";
import { getEnv } from "./config";

const { registryPegexp, sdkHeader } = getEnv();

export const isGetRequest = (request: EventRequest): boolean =>
  request.method.toUpperCase() === "GET";

export const isSDKRequest = (request: EventRequest): boolean =>
  request.headers.get(sdkHeader) === "true";

export const isValidRegistryComponent = (request: EventRequest): boolean => {
  const pathname = new URL(request.url).pathname;

  if (isSDKRequest(request)) return false;

  if (!isGetRequest(request)) return false;

  if (!isRegistryPath(request)) return false;

  if (!pathname.endsWith(".json")) return false;

  if (pathname.includes(encodeURIComponent("{name}"))) return false;

  return true;
};

export const isRegistryPath = (request: EventRequest): boolean =>
  registryPegexp.test(new URL(request.url).pathname);
