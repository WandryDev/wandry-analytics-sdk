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
  const ip = getClientIp(request);
  const payload = {
    component: new URL(request.url).pathname
      .replace("/r/", "")
      .replace(".json", ""),
    ip,
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
    return response.ok;
  } catch (error) {
    return false;
  }
};

export function getClientIp<T extends Request>(request: T): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  const ipFromForwardedFor = forwardedFor?.split(",")[0]?.trim();

  const ip =
    ipFromForwardedFor ||
    realIp ||
    // @ts-ignore
    request.ip ||
    "unknown";

  return ip;
}
