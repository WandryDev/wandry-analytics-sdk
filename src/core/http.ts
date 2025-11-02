import { EventRequest, EventType } from "../types";
import { getEnv } from "./config";

export async function sendEventToApi<T extends Request>(
  request: T,
  token: string,
  type: EventType = "installed"
) {
  // TODO: Need to handle 404s and not send events for them
  // if (!(await isResourceFound(request.url))) return;

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

const isResourceFound = async (url: string): Promise<boolean> => {
  console.log(`[Wandry Analytics]: Checking resource at ${url}`);
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
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
