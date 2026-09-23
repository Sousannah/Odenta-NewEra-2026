import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { PORTALS, ROLE_META, portalFor, roleHome, roleHomeIn } from "@/auth/roles";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OdentaLoader } from "@/components/ui/OdentaLoader";
import { PLATFORM_BASE, UNI_BASE, auth } from "@/config/paths";

/**
 * Which shell a URL belongs to.
 *
 * `PLATFORM_BASE` is tested first and that order is the whole correctness of
 * this function: the console lives at `/university-portal/platform/*`, so a
 * prefix test that checked `UNI_BASE` first would classify every platform
 * screen as a university one — which is exactly the conflation that let the
 * founders' account be treated as a member of a tenant portal.
 */
const portalOfPath = (pathname) => {
  if (pathname.startsWith(PLATFORM_BASE)) return PORTALS.PLATFORM;
  if (pathname.startsWith(UNI_BASE)) return PORTALS.UNIVERSITY;
  return PORTALS.CLINIC;
};

/**
 * Shown while the provider asks the server who this is.
 *
 * A skeleton would promise a layout that may never arrive — an expired
 * session ends here with a redirect to sign-in instead. The wordmark says
 * "waiting" without claiming anything about what comes next.
 */
function BootScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas px-6">
      <OdentaLoader size="lg" label="Restoring your session" />
    </div>
  );
}

/** Blocks anonymous access and remembers where the user was heading. */
export function RequireAuth({ children }) {
  const { status, mustResetPassword } = useAuth();
  const location = useLocation();

  if (status === "loading") return <BootScreen />;
  if (status === "anonymous") {
    return <Navigate to={auth.signIn} replace state={{ from: location.pathname }} />;
  }

  /**
   * A borrowed credential opens one screen and no others.
   *
   * Somebody signed in with a password an IT administrator issued is holding a
   * secret that another person read aloud and may have written down. Letting
   * them browse the portal on it makes "temporary" a label rather than a fact,
   * so every route inside both shells redirects to the screen that replaces it.
   *
   * This is a UX guard, not the control — the server is what refuses the
   * credential's *reuse*, by ending every session when a new one is issued. What
   * this buys is that the person cannot ignore the prompt and forget, which is
   * what actually happens to a dismissible banner.
   */
  if (mustResetPassword && location.pathname !== auth.changePassword) {
    return <Navigate to={auth.changePassword} replace state={{ from: location.pathname }} />;
  }

  return children;
}

/**
 * Route-level authorisation. This is a UX guard, not a security boundary —
 * the same permission must be enforced by the API for every request.
 */
export function RequirePermission({ permission, children }) {
  const { can, role } = useAuth();
  const navigate = useNavigate();

  if (can(permission)) return children;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={<ShieldOff className="h-6 w-6" />}
        title="You do not have access to this screen"
        description={`The ${ROLE_META[role]?.label ?? "current"} role cannot open this section. Ask the clinic owner if you need it.`}
        action={
          <Button onClick={() => navigate(roleHome(role), { replace: true })}>
            Back to my dashboard
          </Button>
        }
      />
    </div>
  );
}

/**
 * A role dashboard belongs to exactly one role. Anyone else who lands on the
 * URL is sent to their own home rather than shown another role's numbers.
 *
 * `role` still accepts a list, and nothing passes one any more. The owner's
 * board used to be declared as `[OWNER, SUPERADMIN]` — the platform account's
 * way into a practice — and removing that second entry is part of the same fix
 * as the portal guard below. The list form is kept because "two roles legitimately
 * read one board" is a real thing that will happen again; it should just be a
 * decision each time rather than the place a portal boundary quietly leaks.
 */
export function RequireRole({ role, children }) {
  const { role: current, status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <BootScreen />;

  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(current)) {
    return <Navigate to={roleHomeIn(current, portalOfPath(location.pathname))} replace />;
  }
  return children;
}

/**
 * The shell boundary: a role may only render the portal it belongs to.
 *
 * ## What this replaces
 *
 * Nothing. There was no such guard, and its absence is the defect this work was
 * opened for. The shell was picked purely from the URL prefix, and the sidebar
 * inside it was built by filtering a shared registry against the caller's
 * permissions — so any role holding a permission that also appeared in the other
 * portal's registry rendered the other portal's navigation. The platform
 * account, which legitimately reads on both sides, opened `/app` and got the
 * clinic owner's sidebar.
 *
 * With one lookup-by-role sidebar per role (`config/nav`) that symptom is
 * already gone: a role with no clinic sidebar cannot render one. This guard
 * closes the rest of it. The *shell* still keyed off the path — the layout, the
 * tenant card, the top bar, the vocabulary — so a Dentist who typed
 * `/university-portal` got the campus shell with a Campus card and a nearly
 * empty sidebar. That looks like a broken product and reads like a boundary
 * that is not really there.
 *
 * ## This is UX, not security
 *
 * Same standing as every other guard in this file. The control is the API's
 * `requirePortal`, which refuses a cross-portal request before any scope is
 * computed. What this buys is that a person is sent somewhere that works rather
 * than somewhere empty — and that the two layers agree, so a bug in one is
 * visible instead of being masked by the other.
 */
export function RequirePortal({ portal, children }) {
  const { role, status } = useAuth();
  if (status === "loading") return <BootScreen />;
  if (portalFor(role) !== portal) return <Navigate to={roleHome(role)} replace />;
  return children;
}

/**
 * Sends a portal root to whichever dashboard the signed-in role owns *there*.
 *
 * `roleHomeIn` still takes the portal and now returns, for every role, what
 * `roleHome` would: no role has two homes any more, because no role belongs to
 * two portals. Kept rather than simplified away — it is the seam a future
 * genuinely multi-portal role would need, and collapsing it would mean
 * rediscovering the question.
 */
export function RoleHomeRedirect() {
  const { role } = useAuth();
  const location = useLocation();
  return <Navigate to={roleHomeIn(role, portalOfPath(location.pathname))} replace />;
}
