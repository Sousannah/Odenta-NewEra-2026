import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services";
import { hasEveryPermission, hasPermission } from "./permissions";

const AuthContext = createContext(null);

const SESSION_KEY = "odenta.session";

/**
 * Session owner for the whole app.
 *
 * Today `authService` resolves against fixtures; when the API lands it will
 * exchange credentials for a token and this provider keeps working unchanged.
 * The token is deliberately held in memory + a storage key that is trivial to
 * swap for an httpOnly cookie flow (see `src/api/client.js`).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const stored = window.localStorage.getItem(SESSION_KEY);
        if (!stored) throw new Error("no session");
        const { userId } = JSON.parse(stored);
        const restored = await authService.restore(userId);
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

  const signIn = useCallback(async (credentials) => {
    const next = await authService.signIn(credentials);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: next.user.id }));
    setSession(next);
    setStatus("authenticated");
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setStatus("anonymous");
  }, []);

  /** Dev affordance: hop between roles without re-authenticating. */
  const switchRole = useCallback(async (role) => {
    const next = await authService.signInAsRole(role);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: next.user.id }));
    setSession(next);
    setStatus("authenticated");
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
      signIn,
      signOut,
      switchRole,
      can: (permission) => hasPermission(user, permission),
      canAll: (permissions) => hasEveryPermission(user, permissions),
    };
  }, [session, status, signIn, signOut, switchRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
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
