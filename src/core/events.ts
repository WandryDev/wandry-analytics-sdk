import { EventRequest, EventType } from "../types";
import { sendEventToApi } from "./http";
import { isRegistryPath } from "./utils";

export const captureRegistryEvent = async (
  token: string,
  request: EventRequest,
  type: EventType = "installed"
): Promise<void> => {
  if (!isRegistryPath(request)) return;

  return await sendEventToApi(request, token, type);
};
