import { ApiError } from "./errors";

/**
 * The one place the app talks to a server.
 *
 * Two drivers:
 *   - "mock" (default today) routes through `src/mock/router.js`
 *   - "live" issues real fetch calls against VITE_API_BASE_URL
 *
 * Flip with VITE_API_MODE=live in `.env`. Nothing above this file changes.
 */
const MODE = import.meta.env?.VITE_API_MODE ?? "mock";
const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "/api";

/* --------------------------------------------------------------- auth token */

let accessToken = null;
let onUnauthorized = null;

/** Called by AuthProvider after sign-in. Swap for httpOnly cookies if preferred. */
export const setAccessToken = (token) => {
  accessToken = token;
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

/* -------------------------------------------------------------- live driver */

const buildUrl = (path, params) => {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

async function liveRequest(method, path, { params, body, signal } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError("Network request failed", { code: "network", path, details: cause });
  }

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Session expired", { status: 401, code: "unauthorized", path });
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Request failed", {
      status: response.status,
      code: payload?.code ?? "http_error",
      details: payload?.errors ?? null,
      path,
    });
  }

  return payload;
}

/* -------------------------------------------------------------- mock driver */

let mockRouter = null;

async function mockRequest(method, path, options) {
  if (!mockRouter) {
    // lazily imported so a live build can tree-shake the whole mock folder away
    mockRouter = (await import("@/mock/router")).mockRouter;
  }
  return mockRouter(method, path, options);
}

/* -------------------------------------------------------------------- api */

const request = (method, path, options) =>
  MODE === "live" ? liveRequest(method, path, options) : mockRequest(method, path, options);

export const api = {
  get: (path, params, options) => request("GET", path, { params, ...options }),
  post: (path, body, options) => request("POST", path, { body, ...options }),
  patch: (path, body, options) => request("PATCH", path, { body, ...options }),
  put: (path, body, options) => request("PUT", path, { body, ...options }),
  delete: (path, options) => request("DELETE", path, options),
  mode: MODE,
};
