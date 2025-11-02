import { EventType } from "../types";
import { sendEventToApi } from "./http";
import { isRegistryPath } from "./utils";

export async function captureRegistryEvent<T extends Request>(
  token: string,
  request: T,
  type: EventType = "installed"
): Promise<void> {
  if (!isRegistryPath(request)) return;

  return await sendEventToApi(request, token, type);
}
