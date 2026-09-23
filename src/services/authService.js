import { api, setAccessToken, setSessionRefresher } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { permissionsFor } from "@/auth/permissions";
import { ROLE_META } from "@/auth/roles";

/** Email + password sign-in. */
export async function signIn({ email, password }) {
  const session = await api.post(endpoints.auth.signIn, { email, password });
  setAccessToken(session.token);
  return session;
}

/**
 * Sign in with a Google or Microsoft ID token.
 *
 * The token is an assertion from the provider, not a credential of ours: the
 * server verifies its signature against the provider's published keys and then
 * looks for an account with that verified address. An address nobody has
 * created an account for is refused — federated sign-in authenticates people,
 * it does not admit them.
 *
 * The session that comes back is the same shape a password sign-in returns, so
 * nothing above this line has to know which door was used.
 */
export async function signInWithProvider(provider, idToken) {
  const path = provider === "google" ? endpoints.auth.google : endpoints.auth.microsoft;
  const session = await api.post(path, { token: idToken });
  setAccessToken(session.token);
  return session;
}

/** Which federated buttons this deployment should offer. Never throws. */
export async function listProviders() {
  try {
    const result = await api.get(endpoints.auth.providers);
    return result?.providers ?? [];
  } catch {
    /* The sign-in page must render with a password form whatever this says. */
    return [];
  }
}

/**
 * Re-establish the session on page load.
 *
 * Takes no arguments, and that is the point. It used to pass a `userId` read
 * out of localStorage, which the in-process mock happily trusted — against a
 * real server that would be a complete authentication bypass, since any
 * signed-in user could become any other by editing one storage key. Identity
 * comes from the httpOnly refresh cookie, which no script can read or forge.
 *
 * The access token lives in memory and is therefore gone after a reload; this
 * is what mints a new one.
 */
let inFlightRestore = null;

/**
 * Serialise across **tabs**, not just within one.
 *
 * `inFlightRestore` below is a module variable, and a second tab is a second
 * module instance — so it does nothing about the case that actually bites:
 * two tabs of the same app loading at once. They share one cookie jar, both
 * read the same refresh token, and the second to arrive is a replay.
 *
 * The Web Locks API is exactly this, and it is origin-scoped, so one tab holds
 * `odenta.auth.refresh` while it rotates and the others queue. By the time the
 * next one runs, the cookie is already the rotated value, so it presents a
 * current token and rotates again legitimately. Nothing is weakened: every
 * rotation is still single-use and a genuine replay is still a replay.
 *
 * Falls back to running inline where `navigator.locks` is missing (older
 * Safari, and any non-secure context). That is the behaviour this had before,
 * so the fallback is not a regression — it just does not fix the cross-tab
 * case on those browsers.
 */
function withRotationLock(run) {
  if (typeof navigator !== "undefined" && typeof navigator.locks?.request === "function") {
    return navigator.locks.request("odenta.auth.refresh", run);
  }
  return run();
}

/**
 * Mint a new access token from the refresh cookie.
 *
 * **The only place in the app that calls `/auth/session`.** Everything that
 * needs a token — the boot restore, a 401 retry part-way through a session,
 * the post-password-change re-read — goes through `restore()` and therefore
 * through here, so there is exactly one lock around exactly one credential.
 */
async function rotate() {
  const session = await api.get(endpoints.auth.session);
  setAccessToken(session.token);
  return session;
}

export async function restore() {
  /**
   * One restore at a time, however many callers ask.
   *
   * The refresh token is **single-use**: `/auth/session` rotates it and the
   * server treats a second presentation of the old one as a replay, revokes
   * every session in the family and raises a `token_replay` security alert.
   * That is exactly the right behaviour for a stolen token and exactly the
   * wrong outcome for two concurrent honest calls — the second one signs the
   * person out and files a security incident against them.
   *
   * And there are always two in development: React's `StrictMode` invokes
   * every effect twice, so `AuthProvider`'s restore fired twice on every page
   * load. The first rotated successfully, the second replayed, and the session
   * was revoked before the dashboard finished rendering. It read as "reload
   * signs you out", which looks like a cookie problem and is not one.
   *
   * Sharing the promise makes the second caller await the first's answer
   * instead of spending the credential again. Cleared when it settles, so the
   * next genuine restore is not served a stale session.
   *
   * ## The two holes this used to have
   *
   * **The refresher went around it.** `setSessionRefresher` at the bottom of
   * this file called `api.get(endpoints.auth.session)` directly, so the 401
   * retry path spent the credential without taking this lock. A page that fired
   * several requests before the boot restore had finished produced exactly
   * that race: one restore in flight here, one refresh in flight there, the
   * same single-use cookie presented twice, and the family revoked mid-load.
   * The visible result was a screen whose first few requests succeeded and
   * whose later ones returned nothing — tiles populated, list empty — and a
   * reload fixed it because a reload starts from one call again. There are
   * `token_replay` rows in the security feed from precisely that.
   *
   * **It was per-tab.** See `withRotationLock`.
   */
  if (inFlightRestore) return inFlightRestore;

  inFlightRestore = withRotationLock(async () => {
    try {
      return await rotate();
    } catch {
      setAccessToken(null);
      return null;
    }
  }).finally(() => {
    inFlightRestore = null;
  });

  return inFlightRestore;
}

/**
 * Whose invitation is this?
 *
 * Read before the form renders so the screen can greet the person by name and
 * show the address the account is for. An anonymous "set your password" form is
 * one a cautious person closes, and a careless one fills in for the wrong
 * account.
 */
export const readInvitation = (token) => api.get(endpoints.auth.activate, { token });

/**
 * Redeem an invitation and sign straight in.
 *
 * They have just proved they hold the invitation and chosen a password;
 * bouncing them to a login form to type it again is friction with no security
 * value, and it is exactly where people mistype the thing they set ten seconds
 * ago and conclude the account is broken.
 */
export async function activate({ token, password }) {
  const session = await api.post(endpoints.auth.activate, { token, password });
  setAccessToken(session.token);
  return session;
}

/**
 * Change your own password, and keep working.
 *
 * The server ends every session the account held — including this one, because
 * the refresh family dies with the password it was minted under — and issues a
 * fresh pair in the same response. So the token is swapped here rather than the
 * screen being bounced to sign-in the instant somebody does the responsible
 * thing.
 */
export async function changePassword({ currentPassword, password }) {
  const session = await api.post(endpoints.auth.changePassword, {
    currentPassword,
    password,
  });
  setAccessToken(session.token);
  return session;
}

export async function signOut() {
  try {
    await api.post(endpoints.auth.signOut);
  } finally {
    setAccessToken(null);
  }
}

/* ------------------------------------------------------- tenant preview */

/** Where the platform console leaves a preview token for the tab it opens. */
const PREVIEW_KEY = "odenta.preview.session";

/**
 * The preview token this tab was opened with, taken once at module load.
 *
 * ## Why at module load and not inside the effect that uses it
 *
 * Claiming is read-*and-remove*, and a module body runs exactly once per page
 * load. An effect does not: React's StrictMode deliberately runs effects twice
 * in development, so claiming there means the first pass takes the token and
 * the second finds an empty store, falls through to the ordinary session
 * restore, and lands the tab in the *operator's own* session — which is the
 * one session a preview must never silently become.
 *
 * That is a development-only symptom of a real fragility: the claim is a
 * one-shot side effect and belongs somewhere that runs once by construction
 * rather than somewhere that happens to today.
 *
 * ## Why read-and-remove at all
 *
 * - **Never in the URL.** A token in a query string is a token in browser
 *   history, in a referrer header and in every access log on the way. The
 *   console writes it to storage and opens the tab; this reads it back.
 * - **Removed as it is read**, so it sits in storage for the milliseconds
 *   between the two and no longer.
 * - **`sessionStorage`, not `local`**, so it dies with the tab — like the
 *   session it represents, which has no refresh cookie and cannot be renewed.
 *
 * Reloading a preview tab therefore ends the preview rather than re-entering
 * it. That is correct: the token is short-lived and the server would refuse it
 * soon enough anyway, and a preview that survived reloads would be a preview
 * somebody forgets they are in.
 */
const previewSession = (() => {
  let raw = null;
  try {
    raw = window.sessionStorage.getItem(PREVIEW_KEY);
    if (raw) window.sessionStorage.removeItem(PREVIEW_KEY);
  } catch {
    /* Private mode, or storage disabled. The tab lands signed out, which is the
       safe failure — it must never fall back to the operator's own session,
       because that one can write. */
    return null;
  }

  if (!raw) return null;

  try {
    const { token, banner, user, tenant } = JSON.parse(raw);
    if (!token || !user?.role) return null;

    setAccessToken(token);
    return {
      token,
      user: {
        ...user,
        /**
         * Derived from the role, not taken from the token.
         *
         * Same rule as everywhere else: the client computes permissions to
         * decide what to *render*, and the server recomputes them to decide
         * what to serve. A preview session that rendered a nav the API would
         * refuse is a worse experience than one that renders less.
         */
        permissions: permissionsFor(user.role),
        roleLabel: ROLE_META[user.role]?.label ?? null,
      },
      clinic: null,
      campus: null,
      /** Read by the portal shell to render the persistent read-only banner. */
      preview: { banner, tenant, readOnly: true },
    };
  } catch {
    return null;
  }
})();

/**
 * The preview session for this tab, or null.
 *
 * Idempotent — the token was already claimed above — so the provider may call
 * it as many times as React decides to run its effect.
 */
export const claimPreviewSession = () => previewSession;

/**
 * Renew an expired access token without disturbing the screen.
 *
 * Registered with the API client at module load, so a 401 part-way through a
 * session is retried once against the refresh cookie rather than bouncing a
 * supervisor out of a half-written decision.
 */
/**
 * Routed through `restore()`, not around it.
 *
 * This used to call `/auth/session` directly, which meant the 401 retry path
 * and the boot restore were two different locks around one single-use
 * credential — see the note on `restore()` for what that did. Sharing the lock
 * is the whole fix: a 401 that arrives while the boot restore is still in
 * flight now *awaits* it and gets the same session, instead of spending the
 * cookie a second time and having the server revoke the family for replay.
 *
 * Returns `null` rather than throwing when the session is genuinely over,
 * which is what the client's `if (renewed)` check already expects.
 */
setSessionRefresher(() => restore());
