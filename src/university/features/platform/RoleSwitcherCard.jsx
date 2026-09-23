import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FlaskConical, LogIn, ShieldAlert } from "lucide-react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_META } from "@/auth/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";

/**
 * One button per role, for testing.
 *
 * ## Two doors, and they are not the same door
 *
 * **Preview** opens a tenant's portal read-only, in a new tab, on a session
 * that expires in thirty minutes and that the *server* refuses every mutating
 * verb on. It writes a security event naming the operator. It works everywhere,
 * including production, because it is safe everywhere.
 *
 * **Sign in** mints a real read-write session as a seeded test account — no
 * password, no second factor. That is a backdoor, and the server only offers it
 * when `NODE_ENV` is not `production`: `routes/platform/devSignIn.js` is not
 * mounted in a deployed build at all, so `/targets` 404s and the buttons below
 * simply do not render. There is nothing here that a production build could be
 * talked into exposing, because the capability is absent rather than hidden.
 *
 * ## Why both, rather than only the safe one
 *
 * Read-only is the right default and the wrong tool for the question "does the
 * receptionist's board actually save". Testing a role means exercising what the
 * role can *do*. Offering only preview would mean developers went back to the
 * thing this replaces — a known password seeded onto real accounts, or one
 * passed around in a document — which is worse in every environment including
 * this one.
 *
 * ## Why signing in replaces this session rather than opening a tab
 *
 * A read-write session as somebody else is not something to have open beside
 * your own console in another tab, where the next click is a coin flip over
 * which identity it lands on. Preview opens a tab precisely because it cannot
 * write; this one takes over, and getting back is a normal sign-out.
 */
export default function RoleSwitcherCard({ tenants = [] }) {
  const { adoptSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  /**
   * A 404 here is the expected production answer, not an error worth showing.
   * The card falls back to preview-only rather than rendering a failure.
   */
  const { data } = useAsync(
    () => platformService.getDevSignInTargets().catch(() => null),
    []
  );

  const devTargets = data?.targets?.filter((target) => target.available) ?? [];
  const devEnabled = Boolean(data?.enabled) && devTargets.length > 0;

  const signInAs = async (target) => {
    setBusy(target.role);
    try {
      const session = await platformService.devSignInAs(target.role);
      adoptSession(session);
      navigate(session.user?.home ?? ROLE_META[target.role]?.home ?? "/", { replace: true });
    } catch (cause) {
      toast.error("Could not sign in as that role", cause?.message ?? "Try again");
    } finally {
      setBusy(null);
    }
  };

  /* Preview needs a tenant, because a preview session *is* a tenant's session.
     The first tenant of the matching kind is the sensible default for a
     one-click affordance; the Tenants screen is where a specific one is picked. */
  const previewTenantFor = (role) => {
    const wantsCampus = String(ROLE_META[role]?.portal ?? "").includes("university") || role.startsWith("uni_");
    return tenants.find((tenant) => (wantsCampus ? tenant.kind === "campus" : tenant.kind !== "campus")) ?? null;
  };

  const preview = async (role) => {
    const tenant = previewTenantFor(role);
    if (!tenant) {
      toast.error("No tenant to preview", "Create a campus or a clinic first.");
      return;
    }

    setBusy(`preview:${role}`);
    try {
      const session = await platformService.openPreviewSession({
        tenantId: tenant.tenantId,
        role,
        reason: "Role check from the platform dashboard",
      });

      /* Same handover the Tenants screen uses: through `sessionStorage`, never
         a query string, because a token in a URL is a token in history, in a
         referrer header and in every access log on the way. */
      window.sessionStorage.setItem(
        "odenta.preview.session",
        JSON.stringify({
          token: session.token,
          banner: session.banner,
          expiresInSeconds: session.expiresInSeconds,
          user: session.user,
          tenant: session.tenant,
        })
      );
      window.open(session.user?.home ?? "/", "_blank", "noopener");
    } catch (cause) {
      toast.error("Could not open a preview", cause?.message ?? "Try again");
    } finally {
      setBusy(null);
    }
  };

  const roles = devEnabled
    ? devTargets
    : Object.keys(ROLE_META)
        .filter((role) => role !== "superadmin")
        .map((role) => ({ role, label: ROLE_META[role]?.label ?? role, available: false }));

  return (
    <Card>
      <CardHeader
        title="Open a role"
        description={
          devEnabled
            ? "Preview is read-only and audited. Sign in takes over this session."
            : "Read-only, audited, and it expires in thirty minutes."
        }
        icon={<FlaskConical className="h-4 w-4" />}
        actions={
          devEnabled ? (
            <Badge tone="warning">{data.environment}</Badge>
          ) : (
            <Badge tone="neutral">Preview only</Badge>
          )
        }
      />
      <CardBody>
        {devEnabled ? (
          <InfoBanner tone="warning" icon={<ShieldAlert className="h-4 w-4" />}>
            Signing in as a role is a development-only door: it mints a real,
            writable session with no password. The server does not offer it when
            NODE_ENV is production, and every use writes a critical security
            event naming you.
          </InfoBanner>
        ) : null}

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {roles.map((target) => (
            <div
              key={target.role}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-ink">{target.label}</p>
                {target.email ? (
                  <p className="truncate text-[12px] text-ink-soft">{target.email}</p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                  loading={busy === `preview:${target.role}`}
                  onClick={() => preview(target.role)}
                >
                  Preview
                </Button>

                {devEnabled ? (
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<LogIn className="h-3.5 w-3.5" />}
                    loading={busy === target.role}
                    onClick={() => signInAs(target)}
                  >
                    Sign in
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
