import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { roleHome } from "@/auth/roles";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import NotFoundPage from "./NotFoundPage";

/**
 * Route-level error boundary.
 *
 * A crash inside a screen is not the same thing as a missing page, so this
 * reports what actually happened instead of claiming the route was never built.
 *
 * The common case in development is a failed dynamic import: the dev server
 * restarted, the hashed chunk the tab is holding no longer exists, and the
 * `lazy()` boundary rejects. That is recoverable with a reload, so it gets its
 * own message and a reload button rather than a generic error.
 */
const isChunkLoadFailure = (error) =>
  /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(
    error?.message ?? ""
  );

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();

  // A thrown 404 response is a missing page, not a crash.
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  const stale = isChunkLoadFailure(error);
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : (error?.message ?? "Unknown error");

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
      <EmptyState
        icon={
          stale ? <RefreshCw className="h-6 w-6" /> : <AlertOctagon className="h-6 w-6 text-danger" />
        }
        title={stale ? "This tab is running an old build" : "Something went wrong on this screen"}
        description={
          stale
            ? "The dev server restarted while this tab was open, so part of the app could not load. Reloading picks up the current build."
            : "The page failed while rendering. Reload to try again, or head back to your dashboard."
        }
        action={
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(isAuthenticated ? roleHome(role) : "/sign-in", { replace: true })
                }
              >
                {isAuthenticated ? "Back to my dashboard" : "Go to sign in"}
              </Button>
            </div>

            {import.meta.env.DEV && !stale ? (
              <pre className="max-w-xl overflow-x-auto rounded-xl bg-slate-100 px-4 py-3 text-left text-[12px] text-ink-muted">
                {detail}
              </pre>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
