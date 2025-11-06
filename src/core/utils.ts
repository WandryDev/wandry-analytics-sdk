import { EventRequest } from "../types";
import { getEnv } from "./config";

const { registryPegexp, sdkHeader } = getEnv();

export const isGetRequest = (request: EventRequest): boolean =>
  request.method.toUpperCase() === "GET";

export const isSDKRequest = (request: EventRequest): boolean =>
  request.headers.get(sdkHeader) === "true";

export const isValidRegistryComponent = (request: EventRequest): boolean => {
  const pathname = new URL(request.url).pathname;

  console.log(`[Wandry Analytics]: Validating request for ${request.url}`);

  if (isSDKRequest(request)) return false;

  console.log(`[Wandry Analytics]: is sdk request ${isSDKRequest(request)}`);

  if (!isGetRequest(request)) return false;

  console.log(`[Wandry Analytics]: is get request ${isGetRequest(request)}`);

  if (!isRegistryPath(request)) return false;

  console.log(
    `[Wandry Analytics]: is registry path ${isRegistryPath(request)}`
  );

  if (!pathname.endsWith(".json")) return false;

  console.log(
    `[Wandry Analytics]: is ends with .json ${pathname.endsWith(".json")}`
  );

  if (pathname.includes(encodeURIComponent("{name}"))) return false;

  console.log(
    `[Wandry Analytics]: is included {name} ${pathname.includes(
      encodeURIComponent("{name}")
    )}`
  );

  return true;
};

export const isRegistryPath = (request: EventRequest): boolean =>
  registryPegexp.test(new URL(request.url).pathname);
