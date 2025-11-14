import { EventRequest, EventType } from "../types";
import { getEnv } from "./config";
import { getComponentNameFromUrl } from "./utils";

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
    component: getComponentNameFromUrl(request),
    ip: anonymizeIp(ip),
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

export const anonymizeIp = (ip: string): string => {
  const octets = ip.split(".");

  octets[3] = "0";
  return octets.join(".");
};

export const readRegistry = async (path: string) => {
  const { sdkHeader } = getEnv();

  const res = await fetch(path, {
    headers: { "Cache-Control": "no-cache", [sdkHeader]: "true" },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch registry from ${path}: ${await res.text()}`
    );
  }

  return res.json();
};
