import { EventRequest, EventType } from "../types";
import { getEnv } from "./config";

export const sendEventToApi = async (
  request: EventRequest,
  token: string,
  type: EventType = "installed"
) => {
  const { apiUrl } = getEnv();

  const body = makeEventPayload(request, type);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `[Wandry Analytics]: Failed to send event: ${JSON.stringify(response)}`
    );
  }
};

const makeEventPayload = (request: EventRequest, type: EventType): string => {
  const payload = {
    component: new URL(request.url).pathname
      .replace("/r/", "")
      .replace(".json", ""),
    type,
  };

  return JSON.stringify(payload);
};
