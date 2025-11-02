import { EventRequest } from "../types";

const REGISTRY_PATH = /^\/r(?:\/.*)?$/;

export const isRegistryPath = (request: EventRequest): boolean =>
  REGISTRY_PATH.test(new URL(request.url).pathname);
