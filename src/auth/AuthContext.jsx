import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setUnauthorizedHandler } from "@/api/client";
import { authService } from "@/services";
import { hasEveryPermission, hasPermission } from "./permissions";
import { portalFor } from "./roles";

const AuthContext = createContext(null);

/**
 * Session owner for the whole app.
 *
 * Nothing about the session is persisted by this provider, and that is a
 * deliberate change from the version that kept a `userId` in localStorage and
 * handed it to the server on restore. Against fixtures that was harmless;
 * against a real API it was a complete authentication bypass — edit one storage
 * key and become anyone. The session now lives in two places only: an access
 * token in memory, and an httpOnly refresh cookie no script can read.
 *
 * The visible consequence is that a page reload asks the server who this is,
 * which is one request and the only honest answer.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      /**
       * A tenant preview, if this tab was opened as one.
       *
       * The platform console opens a new tab and leaves a short-lived token in
       * `sessionStorage` rather than putting it in the URL — a token in a query
       * string is a token in browser history, in a referrer header and in every
       * access log between here and the server.
       *
       * Claimed and removed in one step, so a reload of the preview tab ends it
       * rather than silently re-entering it, and so the token is never sitting
       * in storage for longer than it takes to read. The preview has no refresh
       * cookie by design, which is what makes "the session cannot outlive the
       * preview" true rather than a promise.
       */
      const preview = authService.claimPreviewSession();
      if (preview) {
        if (cancelled) return;
        setSession(preview);
        setStatus("authenticated");
        return;
      }

      try {
        const restored = await authService.restore();
        if (cancelled) return;
        if (restored) {
          setSession(restored);
          setStatus("authenticated");
        } else {
          setStatus("anonymous");
        }
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * A 401 the client could not renew means the session is over.
   *
   * Wired here rather than in the client so the provider — the only thing that
   * knows what "signed out" means to the UI — owns the reaction.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null);
      setStatus("anonymous");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (credentials) => {
    const next = await authService.signIn(credentials);
    setSession(next);
    setStatus("authenticated");
    return next;
  }, []);

  /**
   * Sign in with Google or Microsoft.
   *
   * The provider's window is opened here and the ID token it returns is posted
   * straight to our API, which does the verifying. The session that comes back
   * is indistinguishable from a password sign-in, which is why this sets the
   * same state rather than having a path of its own.
   */
  const signInWithProvider = useCallback(async (provider) => {
    const { requestGoogleIdToken, requestMicrosoftIdToken } = await import("./providers");
    const idToken = provider === "google" ? await requestGoogleIdToken() : await requestMicrosoftIdToken();
    const next = await authService.signInWithProvider(provider, idToken);
    setSession(next);
    setStatus("authenticated");
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    /**
     * Drop MSAL's cache too, but only if it was ever loaded.
     *
     * Otherwise the next person at a shared clinic workstation presses "Sign in
     * with Microsoft" and is signed straight back in as whoever used it last —
     * the account is still in the tab's cache and MSAL will happily reuse it.
     * Imported lazily so signing out never pulls in a 200 KB library that this
     * session had no use for.
     */
    const providers = await import("./providers").catch(() => null);
    await providers?.clearMicrosoftSession?.();

    setSession(null);
    setStatus("anonymous");
  }, []);

  /**
   * Adopt a session this app was handed by something other than sign-in.
   *
   * There is exactly one of those: redeeming an invitation. The server signs
   * the person straight in — they have just proved they hold the link and
   * chosen a password, so a login form asking for it again is friction with no
   * security value — and hands back the same `{ token, user, campus }` shape.
   * This is how that becomes the app's session.
   */
  const adoptSession = useCallback((next) => {
    setSession(next);
    setStatus(next ? "authenticated" : "anonymous");
    return next;
  }, []);

  /**
   * Re-read the session from the server.
   *
   * Needed wherever an action changes who the signed-in person *is* rather than
   * what they are looking at. Changing your own password is the case: the server
   * revokes every refresh family the account held — including this tab's — and
   * issues a fresh pair, so the copy in this provider is stale in the one field
   * that decides whether the app keeps insisting on a password change.
   */
  const refresh = useCallback(async () => {
    const next = await authService.restore();
    setSession(next);
    setStatus(next ? "authenticated" : "anonymous");
    return next;
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    return {
      status,
      isAuthenticated: status === "authenticated",
      user,
      role: user?.role ?? null,
      permissions: user?.permissions ?? [],
      clinic: session?.clinic ?? null,
      /* A university login carries a campus instead of a clinic. */
      campus: session?.campus ?? null,
      /**
       * Set only in a tab the platform console opened as a tenant preview.
       *
       * Exposed so the portal shell can say so, permanently and unmissably.
       * Every write on this session is refused by the server, so the banner is
       * not the control — it is there because a person who forgets which
       * session they are looking at is the failure mode the whole feature has.
       */
      preview: session?.preview ?? null,
      portal: portalFor(user?.role),
      signIn,
      signInWithProvider,
      signOut,
      adoptSession,
      refresh,
      /**
       * Whether this person is still holding a credential somebody handed them.
       *
       * Read by the route guard, so a temporary password cannot be used to
       * wander the portal — the only thing it opens is the screen that replaces
       * it. Surfaced as a named flag rather than left for each screen to read
       * off `user`, because a check that forty screens could make is a check
       * thirty-nine of them will not.
       */
      mustResetPassword: Boolean(user?.mustResetPassword),
      can: (permission) => hasPermission(user, permission),
      canAll: (permissions) => hasEveryPermission(user, permissions),
    };
  }, [session, status, signIn, signInWithProvider, signOut, adoptSession, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * The session, or nothing, without throwing.
 *
 * For the one caller that must never crash: the route-level error boundary.
 * After the dev server restarts under an open tab, a component can be holding a
 * stale copy of this module while a freshly-loaded `AuthProvider` is the one
 * actually mounted — two module instances, two contexts, and `useContext`
 * returns null. `useAuth` is right to throw there; an *error boundary* that
 * throws turns a recoverable "reload me" screen into a cascade that hides what
 * actually went wrong.
 *
 * Every other caller should keep using `useAuth`, because outside a provider is
 * a bug worth failing loudly on.
 */
export function useAuthOptional() {
  return useContext(AuthContext) ?? { role: null, isAuthenticated: false };
}

/** `const canBill = useCan(P.PAYMENT_TAKE)` */
export function useCan(permission) {
  const { can } = useAuth();
  return can(permission);
}

/**
 * Conditional render helper.
 *   <Can permission={P.STAFF_MANAGE}><Button …/></Can>
 *   <Can permission={[P.A, P.B]} fallback={<Locked/>}>…</Can>
 */
export function Can({ permission, fallback = null, children }) {
  const { can } = useAuth();
  return can(permission) ? children : fallback;
}
