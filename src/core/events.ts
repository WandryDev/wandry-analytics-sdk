import { EventType } from "../types";
import { sendEventToApi } from "./http";
import { isValidRegistryComponent } from "./utils";

export async function captureRegistryEvent<T extends Request>(
  request: T,
  token: string,
  type: EventType = "installed"
): Promise<void> {
  if (!isValidRegistryComponent(request)) return;

  return await sendEventToApi(request, token, type);
}
