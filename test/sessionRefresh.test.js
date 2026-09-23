import assert from "node:assert/strict";
import test, { describe } from "node:test";

/**
 * One rotation at a time, because the refresh token is single-use.
 *
 * ## The bug this pins
 *
 * `/auth/session` rotates the refresh cookie, and the server treats a second
 * presentation of an already-spent token as a replay: it revokes every session
 * in the family and files a `token_replay` security event. That is right for a
 * stolen token and catastrophic for two honest concurrent calls.
 *
 * `authService.restore()` guarded against that with a shared in-flight promise.
 * `setSessionRefresher` — the hook the API client calls when a request comes
 * back 401 — did **not**: it called `/auth/session` itself. So a page that
 * fired several requests before the boot restore had finished produced one
 * restore in flight in one place and one refresh in flight in another, both
 * spending the same cookie.
 *
 * The visible symptom was a screen whose first requests succeeded and whose
 * later ones came back with nothing: the summary tiles populated, the list
 * underneath empty. A reload fixed it, because a reload starts from a single
 * call again — and then the next new tab did it over.
 *
 * It was not theoretical. The security feed held four `token_replay` rows for
 * one clinic owner inside three minutes, from a real browser.
 *
 * ## What is asserted
 *
 * That however many callers ask, and by whichever of the two routes, the
 * network is hit **once**. That is the whole property; everything else about
 * the session is the server's business and is tested there.
 */

/* The module under test reaches for `document` and `navigator` at import time
   through the API client, so give it the smallest believable browser. */
globalThis.window = globalThis.window ?? { location: { origin: "http://localhost:5180" } };
globalThis.document = globalThis.document ?? { cookie: "" };

/** Records every lock taken, so the cross-tab guard can be asserted too. */
const locksTaken = [];
let heldLock = Promise.resolve();

/* `navigator` is a getter-only global in Node 22, so it has to be redefined
   rather than assigned. */
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  writable: true,
  value: {
    /**
     * A faithful-enough Web Locks: exclusive by name, and it actually
     * serialises. A stub that merely ran the callback would make the cross-tab
     * assertion below pass while proving nothing.
     */
    locks: {
      request(name, callback) {
        locksTaken.push(name);
        const run = heldLock.then(() => callback());
        heldLock = run.catch(() => {});
        return run;
      },
    },
  },
});

let sessionCalls = 0;
let resolveSession;
/** Makes the next ordinary request come back 401, once. */
let failNextRequestWith401 = false;

globalThis.fetch = async (url) => {
  const path = String(url);

  if (path.includes("/auth/session")) {
    sessionCalls += 1;
    /* Held open so concurrency is real rather than accidental — without this
       the first call would settle before the second was made and the test
       would pass against the broken version too. */
    await new Promise((resolve) => {
      resolveSession = resolve;
    });
    return jsonResponse({ token: `token-${sessionCalls}`, user: { id: "U1" } });
  }

  if (failNextRequestWith401) {
    failNextRequestWith401 = false;
    return jsonResponse({ message: "Session expired", code: "unauthorized" }, 401);
  }

  return jsonResponse({ ok: true });
};

function jsonResponse(body, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => null },
    json: async () => body,
  };
}

/**
 * Imported for their side effects as much as their exports.
 *
 * `authService` calls `setSessionRefresher` at module load, and **nothing here
 * re-registers it**. That matters more than it looks: an earlier draft of this
 * file installed its own refresher that called `restore()`, which meant the
 * test was exercising the fix rather than the app, and it passed against the
 * broken code. The whole point is to drive the refresher the application
 * actually wires up.
 */
const authService = await import("@/services/authService");
const { api } = await import("@/api/client");

describe("rotating the session", () => {
  test("two concurrent callers spend the credential once", async () => {
    sessionCalls = 0;

    const first = authService.restore();
    const second = authService.restore();

    /* Both are now waiting on the same held request. */
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(sessionCalls, 1, "a second concurrent restore must not hit the network");

    resolveSession();
    const [a, b] = await Promise.all([first, second]);

    assert.equal(sessionCalls, 1, "still once after both settled");
    assert.deepEqual(a, b, "both callers get the same session object");
  });

  /**
   * The regression proper, driven through the **real** client.
   *
   * An earlier version of this test called `restore()` twice and passed against
   * the broken code, because calling `restore()` twice was never the bug — the
   * bug was the *other* route to the same credential. So this one makes a real
   * request, lets it come back 401, and lets the API client reach for whatever
   * refresher the app actually installed. That is the path that was spending
   * the cookie a second time.
   */
  test("a 401 during boot does not spend the credential a second time", async () => {
    sessionCalls = 0;
    failNextRequestWith401 = true;

    /* The boot restore, in flight and held open — exactly the window in which
       a page's own first requests fire. */
    const boot = authService.restore();
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(sessionCalls, 1, "precondition: the boot restore is in flight");

    /* A screen's request, arriving in that window and coming back 401. The
       client will now reach for the refresher by itself. */
    const screen = api.get("/patients");
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(
      sessionCalls,
      1,
      "the 401 retry must await the rotation already in flight, not start a second one"
    );

    resolveSession();
    await boot;
    await screen;

    assert.equal(sessionCalls, 1, "and still once after everything settled");
  });

  test("a later rotation is allowed once the first has settled", async () => {
    sessionCalls = 0;

    const first = authService.restore();
    await new Promise((resolve) => setTimeout(resolve, 10));
    resolveSession();
    await first;

    const second = authService.restore();
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(sessionCalls, 2, "the in-flight guard must not become a permanent one");
    resolveSession();
    await second;
  });

  /**
   * Two tabs are two module instances, so the in-flight promise cannot help.
   * The Web Lock is what serialises them, and taking it is the observable part.
   */
  test("rotation is taken under a named cross-tab lock", async () => {
    locksTaken.length = 0;
    sessionCalls = 0;

    const call = authService.restore();
    await new Promise((resolve) => setTimeout(resolve, 10));
    resolveSession();
    await call;

    assert.deepEqual(locksTaken, ["odenta.auth.refresh"], "one named exclusive lock per rotation");
  });

  /**
   * The structural guarantee, and the one that stops this coming back.
   *
   * The bug was a *second* call site for a single-use credential. Counting them
   * is cruder than exercising them and catches the thing the behavioural tests
   * cannot: somebody adding a third route to `/auth/session` next year, which
   * would pass every assertion above and reintroduce the race.
   */
  test("the app has exactly one call site for the rotating endpoint", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/services/authService.js", "utf8");

    const calls = source
      .split("\n")
      .filter((line) => line.includes("api.get(endpoints.auth.session)"))
      /* Prose in a comment explaining the old bug is not a call site. */
      .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line));

    assert.equal(calls.length, 1, `expected one call site, found ${calls.length}:\n${calls.join("\n")}`);
    assert.match(calls[0], /const session = await api\.get/, "and it is the one inside rotate()");

    /* And nothing outside this module may reach it directly. */
    const client = readFileSync("src/api/client.js", "utf8");
    assert.ok(
      !client.includes("auth/session"),
      "the API client must not know the rotation path — it goes through the refresher"
    );
  });
});
