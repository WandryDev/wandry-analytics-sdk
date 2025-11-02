import { EventType } from "../types";
import { sendEventToApi } from "./http";
import { isGetRequest, isRegistryPath } from "./utils";

export async function captureRegistryEvent<T extends Request>(
  token: string,
  request: T,
  type: EventType = "installed"
): Promise<void> {
  if (!isGetRequest(request) || !isRegistryPath(request)) return;

  return await sendEventToApi(request, token, type);
}
