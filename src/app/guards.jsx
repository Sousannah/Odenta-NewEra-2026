import { Navigate, useLocation } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_META, roleHome } from "@/auth/roles";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

function BootScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <div className="w-[320px] space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

/** Blocks anonymous access and remembers where the user was heading. */
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <BootScreen />;
  if (status === "anonymous") {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/**
 * Route-level authorisation. This is a UX guard, not a security boundary —
 * the same permission must be enforced by the API for every request.
 */
export function RequirePermission({ permission, children }) {
  const { can, role } = useAuth();

  if (can(permission)) return children;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={<ShieldOff className="h-6 w-6" />}
        title="You do not have access to this screen"
        description={`The ${ROLE_META[role]?.label ?? "current"} role cannot open this section. Ask an owner or manager if you need it.`}
        action={
          <Button as="a" href={roleHome(role)}>
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
 */
export function RequireRole({ role, children }) {
  const { role: current, status } = useAuth();
  if (status === "loading") return <BootScreen />;
  if (current !== role) return <Navigate to={roleHome(current)} replace />;
  return children;
}

/** Sends "/" to whichever dashboard the signed-in role owns. */
export function RoleHomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={roleHome(role)} replace />;
}
