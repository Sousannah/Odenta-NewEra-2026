import { ApiError } from "./errors";

/**
 * The one place the app talks to a server.
 *
 * There used to be two drivers here — an in-process mock that served
 * `src/mock/router.js`, and this one. The mock is gone: it had become a second
 * implementation of the product that agreed with the API on shape and not
 * always on behaviour, and the disagreements were invisible precisely because
 * both sides passed. Several endpoints were only discovered to be returning
 * nothing at all once the mock stopped answering for them.
 *
 * `VITE_API_BASE_URL` is same-origin by default, because the refresh cookie is
 * httpOnly and first-party — see the proxy note in `vite.config.js`.
 */
const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "/api";

/* --------------------------------------------------------------- auth token */

let accessToken = null;
let onUnauthorized = null;
let refreshSession = null;

/**
 * Held in memory only.
 *
 * Deliberately not in localStorage: anything a script can read is anything an
 * injected script can read, and an access token in localStorage survives the
 * tab that earned it. The cost of keeping it here is that a page reload loses
 * it — which is what `setSessionRefresher` below exists to solve, using the
 * httpOnly refresh cookie the server sets.
 */
export const setAccessToken = (token) => {
  accessToken = token;
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

/**
 * How to get a new access token when one expires mid-session.
 *
 * Access tokens are short-lived by design, so a supervisor who leaves the
 * review queue open over lunch will hit a 401 on their next click. Rather than
 * bouncing them to the sign-in screen, the first 401 triggers one refresh
 * against the cookie and the original request is replayed — so the expiry is
 * invisible unless the session is genuinely over.
 */
export const setSessionRefresher = (refresher) => {
  refreshSession = refresher;
};

/**
 * The double-submit CSRF token.
 *
 * Readable by script by design — the server sets it non-httpOnly precisely so
 * it can be echoed back in a header, which a cross-site request cannot do.
 * Only sent on the mutating verbs, because that is all the server checks.
 */
const csrfToken = () =>
  document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("odenta_csrf="))
    ?.split("=")[1] ?? null;

/* -------------------------------------------------------------- live driver */

const buildUrl = (path, params) => {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function send(method, path, { params, body, signal, cache } = {}) {
  const csrf = SAFE_METHODS.has(method) ? null : csrfToken();

  return fetch(buildUrl(path, params), {
    method,
    signal,
    /* Only ever set by the 304 re-fetch above; everything else uses the
       browser's default, which is what makes conditional GETs free. */
    ...(cache ? { cache } : {}),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Only one refresh runs at a time, however many requests hit 401 together. */
let inFlightRefresh = null;

/**
 * The paging state a list response carries in its headers.
 *
 * `X-Continuation` is Cosmos's own opaque token, relayed by the server. It is
 * not a page number and cannot be turned into one — which is the point: page
 * forty of a list costs what page one costs, where an OFFSET would charge for
 * all thirty-nine pages it skipped.
 *
 * `X-Request-Charge` is the request-unit cost of the call. It rides on every
 * response so the browser's network tab is a cost profiler while a screen is
 * being built, rather than something discovered on an invoice a month later.
 */
const metaOf = (response) => ({
  continuation: response.headers.get("X-Continuation"),
  total: Number(response.headers.get("X-Total-Count")) || null,
  charge: Number(response.headers.get("X-Request-Charge")) || null,
});

async function liveRequest(method, path, options = {}, { retried = false } = {}) {
  let response;
  try {
    response = await send(method, path, options);
  } catch (cause) {
    throw new ApiError("Network request failed", { code: "network", path, details: cause });
  }

  if (response.status === 401) {
    /**
     * One attempt to renew, then give up.
     *
     * A 401 on the refresh endpoint itself, or a second 401 after a successful
     * refresh, means the session is genuinely over — retrying past that would
     * be a loop. The `retried` flag is what bounds it.
     */
    const renewable = !retried && refreshSession && !path.startsWith("/auth/");
    if (renewable) {
      inFlightRefresh = inFlightRefresh ?? refreshSession().finally(() => {
        inFlightRefresh = null;
      });
      const renewed = await inFlightRefresh.catch(() => null);
      if (renewed) return liveRequest(method, path, options, { retried: true });
    }

    onUnauthorized?.();
    throw new ApiError("Session expired", { status: 401, code: "unauthorized", path });
  }

  /**
   * A 304 that reaches this code is a screen with no data on it.
   *
   * The comment that used to be here said `fetch` had already replayed the
   * cached body, so there was nothing to parse — and that is true of the normal
   * path: the browser revalidates, gets a 304, and hands JavaScript a **200**
   * with the cached body. Verified, not assumed. Every authenticated endpoint
   * sends `private, max-age=0, must-revalidate`, so this happens constantly and
   * correctly.
   *
   * But when a 304 *does* surface — an intermediary that revalidates on its own
   * behalf, a request whose cache entry was evicted between the conditional
   * header being attached and the response arriving — returning `null` hands a
   * list screen nothing and it renders empty. Silently, with no error for
   * anything to catch.
   *
   * So it is re-fetched once, bypassing the cache, which is guaranteed to carry
   * a body. Rare by construction, bounded to one extra request, and the failure
   * it replaces is a blank page nobody can diagnose from the outside.
   */
  if (response.status === 304 && !options.__revalidated) {
    return liveRequest(method, path, { ...options, __revalidated: true, cache: "reload" }, { retried });
  }

  const payload =
    response.status === 204 || response.status === 304
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Request failed", {
      status: response.status,
      code: payload?.code ?? "http_error",
      details: payload?.errors ?? null,
      path,
    });
  }

  /**
   * `meta: true` asks for the paging state alongside the body.
   *
   * Opt-in, so every existing caller keeps receiving a bare array and nothing
   * above this file had to change to gain cursor paging. Only the handful of
   * screens with a "load more" ask for it.
   */
  return options.meta ? { data: payload, ...metaOf(response) } : payload;
}

/* -------------------------------------------------------------------- api */

const request = (method, path, options) => liveRequest(method, path, options);

export const api = {
  get: (path, params, options) => request("GET", path, { params, ...options }),
  /** A list plus its paging state — `{ data, continuation, total, charge }`. */
  getPage: (path, params, options) => request("GET", path, { params, ...options, meta: true }),
  post: (path, body, options) => request("POST", path, { body, ...options }),
  patch: (path, body, options) => request("PATCH", path, { body, ...options }),
  put: (path, body, options) => request("PUT", path, { body, ...options }),
  delete: (path, options) => request("DELETE", path, options),
};
