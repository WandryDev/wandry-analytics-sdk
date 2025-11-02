import { EventRequest, EventType } from "../types";
import { getEnv } from "./config";

const pendingRequests = new Map(); // выполняющиеся запросы
const cache = new Map(); // время последнего запроса

export const sendEventToApi = async (
  request: EventRequest,
  token: string,
  type: EventType = "installed"
) => {
  const { apiUrl, ttl } = getEnv();

  const body = makeEventPayload(request, type);

  const key = getRequestKey(apiUrl, body, token);

  await firewall(key, ttl);

  const promise = fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
  })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}));
      pendingRequests.delete(key);
      cache.set(key, Date.now());
      return json;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw new Error(
        `[Wandry Analytics]: Failed to send event: ${JSON.stringify(error)}`
      );
    });

  pendingRequests.set(key, promise);
  return promise;
};

const firewall = (key: string, ttl: number) => {
  const now = Date.now();

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const lastSent = cache.get(key);
  if (lastSent && now - lastSent < ttl) {
    return Promise.resolve({ skipped: true });
  }
};

const getRequestKey = (url: string, payload: string, token: string) => {
  const method = "POST";
  return `${method}:${url}:${payload}:${token}`;
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
