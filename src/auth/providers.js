/**
 * Getting an ID token out of Google or Microsoft, in the browser.
 *
 * Both flows end in the same place: a signed OpenID Connect ID token, which
 * `authService` posts to our API. The API verifies the signature against the
 * provider's published keys and matches the verified address to an account that
 * already exists — so nothing here is trusted, and nothing here can create an
 * account. What this file owns is only the part that has to happen in a browser
 * window, because both providers require a popup the user interacts with.
 *
 * ## Why an ID token rather than an access token
 *
 * An access token is a capability against the *provider's* API — it says what
 * the bearer may do at Google, not who they are, and it is not meant to be
 * verified by a third party. An ID token is an assertion of identity, audience-
 * scoped to this application, and is exactly what a relying party is supposed
 * to check. Sending the wrong one is a well-worn way to build a login that
 * accepts tokens minted for somebody else's app.
 *
 * ## Why neither client id is a secret
 *
 * Both are public-client flows. The client id identifies the application and
 * appears in the browser's own network traffic; there is no client secret
 * anywhere in this codebase, on either side. What protects the flow is that the
 * provider will only mint a token for an origin the application registered, and
 * that our API refuses a token whose `aud` is not us.
 */

const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? "";
const MICROSOFT_CLIENT_ID = import.meta.env?.VITE_AZURE_AD_CLIENT_ID ?? "";
const MICROSOFT_TENANT_ID = import.meta.env?.VITE_AZURE_AD_TENANT_ID ?? "common";

export const googleConfigured = Boolean(GOOGLE_CLIENT_ID);
export const microsoftConfigured = Boolean(MICROSOFT_CLIENT_ID);

/** Raised when the person closes the provider's window. Not an error to show. */
export class SignInCancelled extends Error {
  constructor() {
    super("Sign-in cancelled");
    this.name = "SignInCancelled";
    this.cancelled = true;
  }
}

/* ------------------------------------------------------------------ google */

const GSI_SRC = "https://accounts.google.com/gsi/client";
let gsiPromise = null;

/**
 * Load Google Identity Services once.
 *
 * Injected at use time rather than in `index.html` on purpose: the script sets
 * cookies and opens a connection to Google the moment it loads, and a person
 * who never presses the button should not have their visit reported to a third
 * party. So the cost — a script fetch — is paid by the people who chose it.
 */
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    const script = existing ?? Object.assign(document.createElement("script"), {
      src: GSI_SRC,
      async: true,
      defer: true,
    });
    script.addEventListener("load", () => resolve(window.google?.accounts?.id));
    script.addEventListener("error", () => {
      gsiPromise = null;
      reject(new Error("Google sign-in could not be loaded. Check your connection and try again."));
    });
    if (!existing) document.head.appendChild(script);
  });

  return gsiPromise;
}

/**
 * Ask Google for an ID token.
 *
 * Uses the OAuth code-less `id_token` flow through a popup Google owns, so the
 * password is typed into Google's page and never touches this application —
 * which is most of the point of federated sign-in.
 *
 * `ux_mode: "popup"` rather than a redirect because a redirect would lose the
 * `?next=` destination the sign-in page was opened with, and restoring it means
 * parking it in storage across a full navigation for no gain.
 */
export async function requestGoogleIdToken() {
  if (!googleConfigured) throw new Error("Google sign-in is not configured.");
  const gsi = await loadGoogle();
  if (!gsi) throw new Error("Google sign-in could not be loaded.");

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    gsi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) =>
        response?.credential
          ? finish(resolve, response.credential)
          : finish(reject, new SignInCancelled()),
      /* FedCM is Google's replacement for third-party cookies here; without it
         the prompt silently does nothing in browsers that have already blocked
         them, which reads to the user as a dead button. */
      use_fedcm_for_prompt: true,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
    });

    gsi.prompt((notification) => {
      /* `prompt` reports *why* nothing appeared. Without this branch a blocked
         or skipped prompt leaves the promise pending forever and the button
         spinning. */
      const dismissed = notification?.isDismissedMoment?.() && notification.getDismissedReason?.() !== "credential_returned";
      const skipped = notification?.isSkippedMoment?.();
      const notDisplayed = notification?.isNotDisplayed?.();
      if (dismissed || skipped) finish(reject, new SignInCancelled());
      else if (notDisplayed) {
        finish(
          reject,
          new Error(
            "Google could not show its sign-in prompt. This usually means third-party sign-in is blocked in this browser."
          )
        );
      }
    });
  });
}

/* --------------------------------------------------------------- microsoft */

let msalPromise = null;

/**
 * MSAL, imported only when somebody presses the button.
 *
 * `@azure/msal-browser` is around 200 KB. A dynamic import keeps it out of the
 * main bundle, so the ~99% of page loads that are not a Microsoft sign-in never
 * download it.
 */
async function loadMsal() {
  if (msalPromise) return msalPromise;

  msalPromise = (async () => {
    const msal = await import("@azure/msal-browser");
    const instance = new msal.PublicClientApplication({
      auth: {
        clientId: MICROSOFT_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,
        redirectUri: window.location.origin,
      },
      cache: {
        /**
         * Session storage, not local.
         *
         * MSAL's own cache holds tokens for the Microsoft directory. Keeping it
         * in `sessionStorage` means closing the tab ends it, which matches how
         * a clinic workstation is actually used — several people, one machine,
         * over a day. Our own session is a separate thing entirely and lives in
         * an httpOnly cookie the server sets.
         */
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      },
    });
    await instance.initialize();
    return { msal, instance };
  })().catch((error) => {
    msalPromise = null;
    throw error;
  });

  return msalPromise;
}

/**
 * Ask Microsoft for an ID token.
 *
 * `openid profile email` and nothing else. A login does not need Graph, a
 * mailbox or a calendar, and asking for scopes the product will not use is
 * asking an administrator to consent to access nobody can justify.
 *
 * `prompt: "select_account"` because a shared clinic workstation will have
 * somebody else's account cached, and silently signing in as them is the worst
 * possible outcome on a system holding patient records.
 */
export async function requestMicrosoftIdToken() {
  if (!microsoftConfigured) throw new Error("Microsoft sign-in is not configured.");
  const { msal, instance } = await loadMsal();

  try {
    const result = await instance.loginPopup({
      scopes: ["openid", "profile", "email"],
      prompt: "select_account",
    });
    if (!result?.idToken) throw new Error("Microsoft did not return an identity token.");
    return result.idToken;
  } catch (error) {
    if (
      error instanceof msal.BrowserAuthError &&
      ["user_cancelled", "popup_window_error", "empty_window_error"].includes(error.errorCode)
    ) {
      throw new SignInCancelled();
    }
    throw error;
  }
}

/** Forget MSAL's cached account, so the next sign-in starts clean. */
export async function clearMicrosoftSession() {
  if (!msalPromise) return;
  try {
    const { instance } = await msalPromise;
    /* `clearCache`, not `logoutPopup`: signing somebody out of Odenta should not
       sign them out of Microsoft everywhere else on the machine. */
    await instance.clearCache();
  } catch {
    /* A cache that will not clear is not a reason to fail a sign-out. */
  }
}
