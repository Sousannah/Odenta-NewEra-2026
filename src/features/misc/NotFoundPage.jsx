import { useLocation, useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { roleHome } from "@/auth/roles";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { auth } from "@/config/paths";

/**
 * Genuine 404 — no route matched the URL.
 *
 * "Back to dashboard" resolves to the signed-in role's own home, because there
 * is no single /dashboard route: each role owns a different one.
 */
export default function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const home = isAuthenticated ? roleHome(role) : auth.signIn;

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="Page not found"
        description={`Nothing is routed at ${pathname}. It may have been renamed or moved.`}
        action={
          <Button onClick={() => navigate(home, { replace: true })}>
            {isAuthenticated ? "Back to my dashboard" : "Go to sign in"}
          </Button>
        }
      />
    </div>
  );
}
