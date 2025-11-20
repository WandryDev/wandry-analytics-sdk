import { EventType } from "../types";
import { ensureResourceExist, sendEventToApi } from "./http";
import { isValidRegistryComponent } from "./utils";

export async function captureRegistryEvent<T extends Request>(
  request: T,
  token: string,
  type: EventType = "installed"
): Promise<void> {
  if (!isValidRegistryComponent(request)) return;

  const isResourceExist = await ensureResourceExist(request.url);

  if (!isResourceExist) return;

  return await sendEventToApi(request, token, type);
}

export async function capturePrivateRegistryEvent<T extends Request>(
  request: T,
  token: string,
  type: EventType = "installed"
): Promise<void> {
  return await sendEventToApi(request, token, type);
}
