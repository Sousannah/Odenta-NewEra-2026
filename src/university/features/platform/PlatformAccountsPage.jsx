import { useState } from "react";
import {
  KeyRound,
  Send,
  Lock,
  LogOut,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useAsync, useDebounced, useDisclosure } from "@/hooks";
import { platformService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { ROLE_META, ROLE_ORDER } from "@/auth/roles";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid, Toolbar } from "@/components/shared";
import AccountFormModal from "./AccountFormModal";
import CredentialModal from "../accounts/CredentialModal";
import DeleteAccountModal from "./DeleteAccountModal";
import { ACCOUNT_LABEL, ACCOUNT_TONE } from "./platformFormat";

/**
 * Every login on the platform, across every tenant.
 *
 * ## Why this list can exist at all
 *
 * `identity` on the server is partitioned by the email address someone types,
 * which makes sign-in a 1 RU point read — the most important cost decision in
 * the API. The price is that it cannot be listed: "every locked account on the
 * platform" against that partitioning is a fan-out over every account that has
 * ever existed. So the server keeps a compact projection in one partition and
 * this screen reads that. It carries no credential, and it is paged by
 * continuation token rather than by page number, so page forty costs what page
 * one costs.
 *
 * ## What this screen will not do
 *
 * It never shows, sets or returns a password. Creating an account creates it
 * unusable and flagged for reset; the credential is issued out of band. An
 * endpoint that could set somebody else's password is an endpoint that can
 * become them, and no amount of audit logging makes that reasonable for a
 * platform operator to hold.
 *
 * Deactivation is offered first and deletion is the exception, because
 * deactivating is reversible and keeps the teaching record intact. Deleting
 * removes the *login*; everything the person did survives it, which is the only
 * version of "delete" a clinical record system can honestly offer.
 */
export default function PlatformAccountsPage() {
  const toast = useToast();
  const createModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [tenantId, setTenantId] = useState("all");
  /* The one credential a create or a re-issue produced, held here rather than
     inside the form modal because it has to outlive that modal closing. */
  const [issued, setIssued] = useState(null);
  const search = useDebounced(query, 250);

  const { data: tenants = [] } = useAsync(() => platformService.getTenants(), [], []);
  const { data: summary, refetch: refetchSummary } = useAsync(
    () => platformService.getAccountsSummary(),
    []
  );

  const { data: rows = [], loading, refetch } = useAsync(
    () => platformService.getAccounts({ q: search, role, status, tenantId, limit: 50 }),
    [search, role, status, tenantId],
    []
  );

  const after = () => {
    refetch();
    refetchSummary();
  };

  /**
   * Every action here funnels through one handler.
   *
   * Not for brevity — for consistency of failure. Each of these can be refused
   * by the server for a reason the operator needs to read verbatim ("you cannot
   * deactivate the account you are signed in with"), and a per-button try/catch
   * is how one of them ends up swallowing that message into a generic toast.
   */
  const run = async (label, action, detail) => {
    try {
      await action();
      toast.success(label, detail);
      after();
    } catch (error) {
      toast.error(label, error.message);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Account",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold text-ink">{row.name}</span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">{row.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => (
        <Badge tone={ROLE_META[row.role]?.tone ?? "neutral"}>
          {ROLE_META[row.role]?.label ?? row.role}
        </Badge>
      ),
    },
    {
      key: "tenantId",
      header: "Tenant",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12.5px] text-ink-muted">
          {row.tenantId ?? <span className="font-sans italic text-ink-faint">Platform</span>}
        </span>
      ),
    },
    {
      key: "lastSignInAt",
      header: "Last sign-in",
      sortable: true,
      render: (row) =>
        row.lastSignInAt ? (
          <span
            className="text-[13px] text-ink-muted"
            title={formatDate(row.lastSignInAt, "d MMM yyyy, HH:mm")}
          >
            {fromNow(row.lastSignInAt)}
          </span>
        ) : (
          <span className="text-[12.5px] font-semibold text-warning-ink">Never</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col items-start gap-1.5">
          {/* A lockout is derived from `lockedUntil` at read time rather than
              stored as a status, so it stops showing the moment it expires. */}
          <Badge tone={row.locked ? "warning" : ACCOUNT_TONE[row.status]}>
            {row.locked ? "Locked" : ACCOUNT_LABEL[row.status] ?? row.status}
          </Badge>
          <div className="flex flex-wrap gap-1.5">
            {row.mfa ? <Badge tone="brand">MFA</Badge> : null}
            {row.mustResetPassword ? <Badge tone="outline">Must reset</Badge> : null}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.locked ? (
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<Unlock className="h-3.5 w-3.5" />}
              onClick={() =>
                run("Lockout cleared", () => platformService.unlockAccount(row.userId), row.email)
              }
            >
              Unlock
            </Button>
          ) : null}

          {/**
           * Two buttons, because they answer two different questions.
           *
           * "Issue" is for *this person cannot get in* — their invitation
           * expired, or the temporary password was lost. It mints a new
           * credential and shows it once.
           *
           * "Reset" is for *this credential may be compromised*. It flags the
           * account and revokes every session without minting anything, so it
           * is the safe thing to press in a hurry and the wrong thing to press
           * when somebody is waiting on the phone to be let in.
           */}
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            onClick={async () => {
              try {
                const result = await platformService.issueCredential(row.userId, "invite");
                setIssued({ account: result.account, credential: result.credential });
              } catch (cause) {
                toast.error("Could not issue a credential", cause?.message ?? "Try again");
              }
            }}
          >
            Issue
          </Button>

          <Button
            variant="secondary"
            size="xs"
            leftIcon={<KeyRound className="h-3.5 w-3.5" />}
            onClick={() =>
              run(
                "Reset required at next sign-in",
                () => platformService.forcePasswordReset(row.userId),
                `${row.email} · every session revoked`
              )
            }
          >
            Reset
          </Button>

          <Button
            variant="ghost"
            size="xs"
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
            onClick={() =>
              run("Sessions revoked", () => platformService.revokeSessions(row.userId), row.email)
            }
          >
            Sign out
          </Button>

          {row.status === "disabled" ? (
            <Button
              variant="success"
              size="xs"
              onClick={() =>
                run(
                  "Account reactivated",
                  () => platformService.setAccountStatus(row.userId, { status: "active" }),
                  row.email
                )
              }
            >
              Activate
            </Button>
          ) : (
            <Button
              variant="danger-ghost"
              size="xs"
              leftIcon={<Lock className="h-3.5 w-3.5" />}
              onClick={() =>
                run(
                  "Account deactivated",
                  () =>
                    platformService.setAccountStatus(row.userId, {
                      status: "disabled",
                      reason: "Deactivated from the platform console",
                    }),
                  `${row.email} · every session ended`
                )
              }
            >
              Deactivate
            </Button>
          )}

          {/* Icon-only, and last, because deleting a login is the exception
              here — deactivating is what almost everybody actually wants. */}
          <IconButton
            size="xs"
            className="text-danger hover:bg-danger-soft"
            label={`Delete the login for ${row.email}`}
            onClick={() => deleteModal.open(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Accounts"
        description="Every login on the platform. Passwords are never shown or set here — a new account is created unusable and the credential is issued out of band."
        actions={
          <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={createModal.open}>
            Create account
          </Button>
        }
      />

      <StatGrid cols={5}>
        <StatCard
          label="Accounts"
          value={formatNumber(summary?.total ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active" value={formatNumber(summary?.active ?? 0)} tone="success"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Deactivated"
          value={formatNumber(summary?.disabled ?? 0)}
          tone="danger"
          icon={<Lock className="h-5 w-5" />}
        />
        {/**
         * "Never signed in" is a tile rather than a filter buried in a menu,
         * because it is the number that catches a cohort import whose
         * credentials were created and never sent.
         */}
        <StatCard
          label="Never signed in" value={formatNumber(summary?.neverSignedIn ?? 0)} tone="warning"
          icon={<UserX className="h-5 w-5" />}
        />
        <StatCard
          label="MFA enabled"
          value={formatNumber(summary?.mfa ?? 0)}
          tone="success"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Name, email or reference…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
              <option value="all">Every tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.shortName ?? tenant.name}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="all">Every role</option>
              {ROLE_ORDER.map((value) => (
                <option key={value} value={value}>
                  {ROLE_META[value].label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Any status</option>
              {Object.entries(ACCOUNT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </MiniSelect>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        dense
        emptyTitle="No accounts match"
        emptyDescription="Try clearing the search, the tenant or the role filter."
      />

      <AccountFormModal
        open={createModal.isOpen}
        onClose={createModal.close}
        tenants={tenants}
        onCreated={(result) => {
          createModal.close();
          after();
          /**
           * Straight into the credential dialog, with no toast in between.
           *
           * A toast is the wrong shape for this: it disappears on a timer, and
           * what it would be announcing is the only copy of a value the server
           * can never show again. `CredentialModal` refuses to close on an
           * overlay click for the same reason.
           */
          setIssued({ account: result.account, credential: result.credential });
        }}
      />

      <CredentialModal
        open={Boolean(issued)}
        account={issued?.account}
        credential={issued?.credential}
        onClose={() => setIssued(null)}
      />

      <DeleteAccountModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        account={deleteModal.payload}
        onDeleted={(result) => {
          toast.success("Login deleted", `${result.email} — their work is unchanged`);
          deleteModal.close();
          after();
        }}
      />
    </div>
  );
}
