import { EventRequest, EventType } from "../types";
import { sendEventToApi } from "./http";

export const sendEvent = async (
  request: EventRequest,
  token: string,
  type: EventType = "installed"
): Promise<void> => {
  await sendEventToApi(request, token, type);
};
