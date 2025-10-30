import { EventRequest, EventType } from "../types";
import { getEnv } from "./config";

export const sendEventToApi = async (
  request: EventRequest,
  token: string,
  type: EventType = "installed"
) => {
  const { apiUrl, endpoint } = getEnv();

  const body = makeEventPayload(request, token, type);

  const response = await fetch(`${apiUrl}/${endpoint}`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to send event: ${response.statusText}`);
  }
};

const makeEventPayload = (
  request: EventRequest,
  token: string,
  type: EventType
): string => {
  const payload = {
    domain: new URL(request.url).hostname,
    type,
    token,
  };

  return JSON.stringify(payload);
};
