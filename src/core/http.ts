import { EventRequest, EventType } from "../types";
import { getEnv } from "./config";

export async function sendEventToApi<T extends Request>(
  request: T,
  token: string,
  type: EventType = "installed"
) {
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
}

const makeEventPayload = (request: EventRequest, type: EventType): string => {
  const payload = {
    component: new URL(request.url).pathname
      .replace("/r/", "")
      .replace(".json", ""),
    type,
  };

  return JSON.stringify(payload);
};

export const ensureResourceExist = async (url: string): Promise<boolean> => {
  const { sdkHeader } = getEnv();

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        [sdkHeader]: "true",
      },
    });

    console.log(
      `[Wandry Analytics]: Resource check for ${url} returned ${response.status}`
    );

    return response.ok;
  } catch (error) {
    console.error(
      `[Wandry Analytics]: Error checking resource ${url}: ${error}`
    );
    return false;
  }
};
