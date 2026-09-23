import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Ban,
  KeyRound,
  Link2,
  Lock,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react";
import { useAsync, useDebounced } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { ROLE_META, ROLES } from "@/auth/roles";
import { uni } from "@/config/paths";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar, StatCard, StatGrid } from "@/components/shared";
import CreateAccountModal from "./CreateAccountModal";
import CredentialModal from "./CredentialModal";

/**
 * Accounts.
 *
 * Credentials, not people — `PeoplePage` is the directory. Nothing here ever
 * displays a stored password, because none is stored: what the server holds is
 * an Argon2id hash, and the only moment a credential exists in readable form is
 * the dialog that issues one.
 *
 * ## Two things this screen deliberately does not do
 *
 * **It does not count its own tiles.** The strip above the table is a separate
 * one-request read of counters the server maintains. The previous version
 * filtered the fetched rows, which meant "3 locked" silently described the page
 * rather than the campus — and with paging that would have been actively wrong.
 *
 * **It does not download the campus to search it.** The filters and the search
 * box go to the server, which answers them from an index. Typing is debounced
 * so a four-letter surname is one request rather than four.
 *
 * The role filter is deep-linkable, so the dashboard's "6 invitations not
 * redeemed" banner can land here already filtered.
 */
export default function AccountsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);

  const role = searchParams.get("role") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const flag = searchParams.get("flag") ?? "all";

  const setFilter = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  /* --------------------------------------------------------------- reads */

  /**
   * The tile strip. One counter read, and it describes the whole campus.
   *
   * Refetched after every mutation rather than adjusted locally: an optimistic
   * decrement that disagrees with the server is worse than a tile that takes
   * 200ms to move, because the administrator cannot tell which one is lying.
   */
  const { data: summary, refetch: refetchSummary } = useAsync(
    () => universityService.getAccountSummary(),
    []
  );

  const { data: page, loading, refetch: refetchPage } = useAsync(
    () =>
      universityService.getAccountsPage({
        q: debouncedQuery || undefined,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
        ...FLAGS[flag]?.params,
      }),
    [debouncedQuery, role, status, flag]
  );

  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  /* The first page replaces; "load more" appends. */
  useEffect(() => {
    setRows(page?.data ?? []);
    setCursor(page?.continuation ?? null);
  }, [page]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await universityService.getAccountsPage({
        q: debouncedQuery || undefined,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
        ...FLAGS[flag]?.params,
        continuation: cursor,
      });
      setRows((current) => [...current, ...(next.data ?? [])]);
      setCursor(next.continuation ?? null);
    } catch (cause) {
      toast.error("Could not load more accounts", cause?.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const reload = () => {
    refetchPage();
    refetchSummary();
  };

  /* -------------------------------------------------------------- writes */

  const [creating, setCreating] = useState(false);
  const [credential, setCredential] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const act = async (label, work, row) => {
    try {
      await work();
      toast.success(label, row?.email);
      reload();
    } catch (cause) {
      /* The server's own wording: it explains *why* a role change or a
         self-administration attempt was refused, and paraphrasing it here
         would lose the reason. */
      toast.error("That could not be done", cause?.message);
    }
  };

  const id = (row) => row.userId ?? row.id;

  const setStatusFor = (row, next) =>
    act(
      next === "locked" ? "Account locked" : "Account unlocked",
      () => universityService.updateAccount(id(row), { status: next }),
      row
    );

  const issueCredential = async (row, mode) => {
    try {
      const result = await universityService.resetAccountCredential(id(row), mode);
      setCredential({ account: result.account ?? row, credential: result.credential });
      reload();
    } catch (cause) {
      toast.error("Could not issue a credential", cause?.message);
    }
  };

  const setMfaRequired = (row, required) =>
    act(
      required ? "MFA is now required" : "MFA is no longer required",
      () => universityService.updateAccount(id(row), { mfaRequired: required }),
      row
    );

  const disable = (row) =>
    act("Account disabled", () => universityService.disableAccount(id(row)), row);

  /**
   * The row menu, and what each entry does.
   *
   * `Dropdown` takes `[{ value, label, icon, tone }]` and reports the chosen
   * `value`, so the actions are looked up rather than carried as closures on
   * the items. Everything consequential goes through a confirmation that says
   * what will happen in plain words — in particular that issuing a credential
   * ends every session the account holds, which is the part people do not
   * expect and the part that matters most.
   */
  const menuFor = (row) => [
    { value: "invite", label: "Send an invitation link", icon: <Link2 className="h-4 w-4" /> },
    { value: "temporary", label: "Issue a temporary password", icon: <KeyRound className="h-4 w-4" /> },
    row.mfaRequired
      ? { value: "mfa-off", label: "Stop requiring MFA", icon: <ShieldCheck className="h-4 w-4" /> }
      : { value: "mfa-on", label: "Require MFA", icon: <ShieldAlert className="h-4 w-4" /> },
    { value: "disable", label: "Disable the account", icon: <Ban className="h-4 w-4" />, tone: "danger" },
  ];

  const runMenuAction = (value, row) => {
    if (value === "mfa-off") return setMfaRequired(row, false);

    if (value === "mfa-on") {
      return setConfirm({
        title: "Require MFA for this account?",
        description:
          "There is no self-service enrolment yet, so this account will be refused at sign-in until an administrator clears the requirement or enrols it. Use it for staff you will enrol yourself.",
        confirmLabel: "Require MFA",
        tone: "brand",
        onConfirm: () => setMfaRequired(row, true),
      });
    }

    if (value === "invite") {
      return setConfirm({
        title: "Issue a new invitation?",
        description: `${row.name} will set a new password through a single-use link. Their current password stops working now, and every session they have open will end.`,
        confirmLabel: "Issue the invitation",
        tone: "brand",
        onConfirm: () => issueCredential(row, "invite"),
      });
    }

    if (value === "temporary") {
      return setConfirm({
        title: "Issue a temporary password?",
        description: `You will be shown a password once, to hand to ${row.name} in person. Their current password stops working now, and every session they have open will end.`,
        confirmLabel: "Issue the password",
        tone: "brand",
        onConfirm: () => issueCredential(row, "temporary"),
      });
    }

    return setConfirm({
      title: "Disable this account?",
      /* The retention rule, stated where the decision is actually made. */
      description: `${row.name} will be signed out everywhere and will not be able to sign in again. Their submitted work is kept and stays attributed to them — accounts are archived, never deleted — and their reference stays reserved so nobody is issued it again.`,
      confirmLabel: "Disable the account",
      tone: "danger",
      onConfirm: () => disable(row),
    });
  };

  /* -------------------------------------------------------------- columns */

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
      key: "reference",
      header: "Reference",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12.5px] text-ink-muted">{row.reference ?? "—"}</span>
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
          <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
            {STATUS_LABEL[row.status] ?? row.status}
          </Badge>
          <div className="flex flex-wrap gap-1.5">
            {row.mfa ? <Badge tone="brand">MFA</Badge> : null}
            {row.mfaRequired && !row.mfa ? (
              <Badge tone="danger">
                <ShieldAlert className="h-3 w-3" />
                MFA not enrolled
              </Badge>
            ) : null}
            {row.mustResetPassword ? <Badge tone="warning">Temp password</Badge> : null}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "locked" || row.status === "disabled" ? (
            <Button
              size="xs"
              leftIcon={<Unlock className="h-3.5 w-3.5" />}
              onClick={() => setStatusFor(row, "active")}
            >
              {row.status === "disabled" ? "Re-enable" : "Unlock"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<Lock className="h-3.5 w-3.5" />}
              onClick={() => setStatusFor(row, "locked")}
            >
              Lock
            </Button>
          )}

          {/**
           * A span, not a `Button`.
           *
           * `Dropdown` renders whatever it is given *inside* its own `<button>`,
           * so passing a `Button` nests one button in another — invalid HTML,
           * and in practice a control whose clicks land unpredictably because
           * the browser has to pick which of the two was pressed.
           */}
          <Dropdown
            align="right"
            className="shrink-0"
            trigger={
              <span
                role="img"
                aria-label={`More actions for ${row.name}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            }
            items={menuFor(row)}
            onSelect={(value) => runMenuAction(value, row)}
          />
        </div>
      ),
    },
  ];

  /* ---------------------------------------------------------------- view */

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="All accounts"
        description="Every login on this campus. Passwords are never shown here — issuing a credential ends every session the account holds and shows the new one exactly once."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Users className="h-4 w-4" />}
              onClick={() => navigate(uni.bulkCreate)}
            >
              Import a cohort
            </Button>
            <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Create an account
            </Button>
          </>
        }
      />

      {/**
       * Counted on the server, over the whole campus.
       *
       * Clickable, so a tile is also the filter it describes — which is what an
       * administrator reaches for immediately after reading one.
       */}
      <StatGrid cols={4}>
        <StatCard
          label="Accounts" value={formatNumber(summary?.total ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <FilterTile
          active={status === "locked"}
          onClick={() => setFilter("status", status === "locked" ? "all" : "locked")}
        >
          <StatCard
            label="Locked"
            value={formatNumber(summary?.locked ?? 0)}
            tone="danger"
            icon={<Lock className="h-5 w-5" />}
          />
        </FilterTile>
        <FilterTile
          active={flag === "temp"}
          onClick={() => setFilter("flag", flag === "temp" ? "all" : "temp")}
        >
          <StatCard
            label="Temporary password"
            value={formatNumber(summary?.mustReset ?? 0)}
            tone="warning"
            icon={<KeyRound className="h-5 w-5" />}
          />
        </FilterTile>
        <FilterTile
          active={flag === "no-mfa"}
          onClick={() => setFilter("flag", flag === "no-mfa" ? "all" : "no-mfa")}
        >
          <StatCard
            label="MFA enabled"
            value={formatNumber(summary?.mfa ?? 0)}
            tone="success"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </FilterTile>
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
            <MiniSelect value={role} onChange={(event) => setFilter("role", event.target.value)}>
              <option value="all">Every role</option>
              {ASSIGNABLE_ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_META[value].label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect
              value={status}
              onChange={(event) => setFilter("status", event.target.value)}
            >
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="invited">Invitation pending</option>
              <option value="locked">Locked</option>
              <option value="disabled">Disabled</option>
            </MiniSelect>
            <MiniSelect value={flag} onChange={(event) => setFilter("flag", event.target.value)}>
              {Object.entries(FLAGS).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </MiniSelect>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.userId ?? row.id}
        loading={loading}
        dense
        emptyTitle="No accounts match"
        emptyDescription="Try clearing the search or the filters."
      />

      {/**
       * A cursor, not a page number.
       *
       * The server pages by continuation token because a database bills for
       * every row an offset skips — so page 40 of an offset-paged list costs
       * forty pages. A cursor can only go forward, which is why this is a
       * "load more" rather than a pager: offering page numbers would be
       * offering something the cheap read cannot do.
       */}
      {cursor ? (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
            Load more accounts
          </Button>
        </div>
      ) : rows.length ? (
        <p className="text-center text-[12px] text-ink-faint">
          {formatNumber(rows.length)} of {formatNumber(summary?.total ?? rows.length)} account
          {rows.length === 1 ? "" : "s"} shown
        </p>
      ) : null}

      <CreateAccountModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(result) => {
          setCreating(false);
          /* The credential dialog outlives the form, because the value it
             carries cannot be shown again. */
          setCredential(result);
          reload();
        }}
      />

      <CredentialModal
        open={Boolean(credential)}
        account={credential?.account}
        credential={credential?.credential}
        onClose={() => setCredential(null)}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        tone={confirm?.tone ?? "danger"}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}

/**
 * A tile that is also the filter it describes.
 *
 * Reading "3 locked" and then hunting for the dropdown that shows them is the
 * friction this removes. Wrapped rather than done by giving `StatCard` an
 * `onClick`, because `StatCard` is shared with every other dashboard in the
 * product and a clickable variant is not something they all want.
 */
function FilterTile({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`od-focus rounded-2xl text-left transition ${
        active ? "ring-2 ring-brand-500/60" : "hover:opacity-90"
      }`}
    >
      {children}
    </button>
  );
}

/** The roles a campus IT administrator may assign — mirrors the server. */
const ASSIGNABLE_ROLES = [
  ROLES.UNI_STUDENT,
  ROLES.UNI_SUPERVISOR,
  ROLES.UNI_ASSISTANT,
  ROLES.UNI_ADMIN,
  ROLES.UNI_IT,
];

const STATUS_LABEL = {
  active: "Active",
  invited: "Invitation pending",
  locked: "Locked",
  disabled: "Disabled",
};

const STATUS_TONE = {
  active: "success",
  invited: "info",
  locked: "danger",
  disabled: "neutral",
};

/**
 * The flag filters, and the query each one sends.
 *
 * Separate from `status` because they are orthogonal: an account can be active
 * *and* still holding a temporary password, and collapsing the two into one
 * dropdown would make that combination unreachable.
 */
const FLAGS = {
  all: { label: "Any credential", params: {} },
  temp: { label: "Temporary password", params: { mustReset: "true" } },
  "no-mfa": { label: "Without MFA", params: { mfa: "false" } },
  "never-signed-in": { label: "Never signed in", params: { neverSignedIn: "true" } },
};
