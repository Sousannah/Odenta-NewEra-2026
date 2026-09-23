import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  KeyRound,
  Link2,
  Lock,
  MailWarning,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatNumber, fromNow } from "@/lib/format";
import { ROLES, ROLE_META } from "@/auth/roles";
import { uni } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { DashboardShell, labelFor } from "@/components/shared";
import { DonutChart, GroupedBarChart } from "@/components/charts";

/**
 * IT administrator.
 *
 * Accounts and access, nothing clinical. The board answers four questions in
 * one read: how many logins exist, how many are locked out of clinic, how many
 * still carry a credential somebody handed over, and whether anything is
 * hammering the sign-in endpoint.
 *
 * ## What changed here, and why it matters more than it looks
 *
 * The previous version of this screen fetched *every account on the campus* and
 * computed its four tiles in the browser with `.filter().length`. On a
 * five-thousand-student campus that is about three megabytes of JSON and 500
 * request units, per dashboard open, to render four numbers that are four
 * characters wide — and it grew with every intake, forever.
 *
 * Now one endpoint returns the tallies (a counter document the server maintains
 * as accounts change), the role mix, the sign-in series and a ranked shortlist
 * of accounts needing an action. It is roughly 8 RU, it is flat as the campus
 * grows, and the numbers describe the whole campus rather than whatever subset
 * happened to be downloaded.
 */
export default function ITDashboard() {
  const { user, campus } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();

  const { data: board, loading, refetch } = useAsync(
    () => universityService.getDashboard(ROLES.UNI_IT),
    []
  );

  const accounts = board?.accounts ?? {};

  /**
   * The failures on the sign-in chart, totalled.
   *
   * Worth a banner rather than only a bar: a run of failed sign-ins against a
   * campus is what credential stuffing looks like from the inside, and it is
   * the one thing on this screen somebody should act on the same morning.
   */
  const failures = useMemo(
    () => (board?.signInSeries ?? []).reduce((sum, point) => sum + (point.failures ?? 0), 0),
    [board]
  );

  const unlock = async (row) => {
    try {
      await universityService.updateAccount(row.userId ?? row.id, { status: "active" });
      toast.success("Account unlocked", row.email);
      refetch();
    } catch (cause) {
      toast.error("Could not unlock the account", cause?.message);
    }
  };

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  return (
    <DashboardShell
      user={user}
      role={ROLES.UNI_IT}
      subtitle={campus?.name}
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<Users className="h-4 w-4" />}
            onClick={() => navigate(uni.accounts)}
          >
            All accounts
          </Button>
          <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => navigate(uni.bulkCreate)}>
            Import a cohort
          </Button>
        </>
      }
      kpis={[
        {
          label: "Accounts",
          value: formatNumber(accounts.total ?? 0),
          icon: <Users className="h-5 w-5" />,
        },
        {
          label: "Locked out",
          value: formatNumber(accounts.locked ?? 0),
          tone: accounts.locked ? "danger" : "neutral",
          icon: <Lock className="h-5 w-5" />,
        },
        {
          label: "Temporary password",
          value: formatNumber(accounts.mustReset ?? 0),
          tone: accounts.mustReset ? "warning" : "neutral",
          icon: <KeyRound className="h-5 w-5" />,
        },
        {
          /**
           * The count, not the gap.
           *
           * "8 with MFA" is a number that goes up when things improve, which is
           * the direction a tile should move. The previous version showed
           * "without MFA" with a green tone, which read as good news for the
           * worse outcome.
           */
          label: "MFA enabled",
          value: formatNumber(accounts.mfa ?? 0),
          tone: "success",
          icon: <ShieldCheck className="h-5 w-5" />,
        },
      ]}
    >
      {failures > 20 ? (
        <InfoBanner
          tone="warning"
          icon={<ShieldAlert className="h-4 w-4" />}
          action={
            <Button size="xs" variant="secondary" onClick={() => navigate(uni.activity)}>
              Open the trail
            </Button>
          }
        >
          {formatNumber(failures)} failed sign-ins on this campus in the last week. A run of
          these against real addresses is what credential stuffing looks like — the activity
          trail shows where they came from.
        </InfoBanner>
      ) : null}

      {accounts.invited ? (
        <InfoBanner
          tone="info"
          icon={<MailWarning className="h-4 w-4" />}
          action={
            <Button
              size="xs"
              variant="secondary"
              onClick={() => navigate(`${uni.accounts}?status=invited`)}
            >
              Review
            </Button>
          }
        >
          {accounts.invited} invitation{accounts.invited === 1 ? "" : "s"} have not been
          redeemed. Those accounts exist but cannot be signed into until the person opens
          their link.
        </InfoBanner>
      ) : null}

      <div className="grid grid-cols-12 gap-5">
        {/* -------------------------------------------------- needs an action */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Needs an action"
            subtitle="Worst first — somebody who cannot work outranks somebody who is untidy"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.accounts)}>
                All accounts
              </Button>
            }
          />
          <CardBody className="pt-2">
            {(board?.hygiene ?? []).length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="Nothing needs attention"
                description="No lockouts, no unredeemed invitations, no outstanding temporary passwords."
                className="py-10"
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {board.hygiene.map((row) => (
                  <li
                    key={row.userId ?? row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {row.name}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {row.email} · {ROLE_META[row.role]?.short ?? row.role}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={REASON[row.reason]?.tone ?? "neutral"}>
                        {REASON[row.reason]?.label ?? labelFor(row.reason)}
                      </Badge>
                      {row.status === "locked" ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          leftIcon={<Unlock className="h-3.5 w-3.5" />}
                          onClick={() => unlock(row)}
                        >
                          Unlock
                        </Button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------------- role mix */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Accounts by role" subtitle="Who holds a login" />
          <CardBody className="pt-3">
            {board?.roleMix?.length ? (
              <DonutChart
                data={board.roleMix.map((item) => ({
                  name: ROLE_META[item.label]?.short ?? item.label,
                  value: item.value,
                }))}
                total={accounts.total ?? 0}
                label="Accounts"
                valueFormatter={formatNumber}
              />
            ) : (
              <EmptyState title="No accounts yet" className="py-10" />
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------------- sign-ins */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Sign-ins this week"
            subtitle="Successful against failed, per teaching day"
          />
          <CardBody className="pt-3">
            {board?.signInSeries?.length ? (
              <GroupedBarChart
                data={board.signInSeries}
                xKey="day"
                height={240}
                series={[
                  { key: "signIns", label: "Sign-ins", color: "#0077B6" },
                  { key: "failures", label: "Failures", color: "#E4576B" },
                ]}
              />
            ) : (
              <EmptyState title="No sign-ins recorded yet" className="py-10" />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------ credential health */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Credential health"
            subtitle="Counted across the campus, not across this page"
          />
          <CardBody className="pt-2">
            <ul className="flex flex-col gap-1">
              <Line
                label="Active"
                value={accounts.active}
                tone="success"
                hint="Signed in and able to work"
              />
              <Line
                label="Invitation not redeemed"
                value={accounts.invited}
                tone="info"
                icon={<Link2 className="h-3.5 w-3.5" />}
                hint="Cannot sign in until they open the link"
              />
              <Line
                label="Locked"
                value={accounts.locked}
                tone="danger"
                icon={<Lock className="h-3.5 w-3.5" />}
                hint="Blocked from clinic"
              />
              <Line
                label="Temporary password outstanding"
                value={accounts.mustReset}
                tone="warning"
                icon={<KeyRound className="h-3.5 w-3.5" />}
                hint="Must be changed at next sign-in"
              />
              <Line
                label="Never signed in"
                value={accounts.neverSignedIn}
                tone="neutral"
                hint="Created but not yet used"
              />
              <Line
                label="MFA required but not enrolled"
                value={Math.max(0, (accounts.mfaRequired ?? 0) - (accounts.mfa ?? 0))}
                tone="danger"
                icon={<ShieldAlert className="h-3.5 w-3.5" />}
                hint="These accounts are refused at sign-in"
              />
              <Line
                label="Disabled"
                value={accounts.disabled}
                tone="neutral"
                hint="Archived — the teaching record is retained"
              />
            </ul>
          </CardBody>
        </Card>

        {/* --------------------------------------------------------- activity */}
        <Card className="col-span-12">
          <CardHeader
            title="Recent portal activity"
            subtitle="Reads as well as writes — opening a record is auditable"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.activity)}>
                Full trail
              </Button>
            }
          />
          <CardBody className="pt-2">
            {(board?.activity ?? []).length === 0 ? (
              <EmptyState title="Nothing recorded yet today" className="py-8" />
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {board.activity.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {item.actor}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {item.detail ?? labelFor(item.action)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[11px] font-semibold text-ink-faint">
                        {fromNow(item.at)}
                      </span>
                      <span className="block text-[10.5px] text-ink-faint">{item.ip ?? "—"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}

/**
 * How the shortlist's reason is worded.
 *
 * The server ranks; this only names. Kept as a map rather than passed through
 * `labelFor` because "mfa_required" has to read as "MFA not enrolled" — the
 * reason is about the *gap*, not about the setting.
 */
const REASON = {
  locked: { label: "Locked out", tone: "danger" },
  mfa_required: { label: "MFA not enrolled", tone: "danger" },
  invite_stale: { label: "Invitation not redeemed", tone: "info" },
  never_signed_in: { label: "Never signed in", tone: "neutral" },
  temporary_password: { label: "Temporary password", tone: "warning" },
};

const TONE_TEXT = {
  success: "text-success-ink",
  danger: "text-danger-ink",
  warning: "text-warning-ink",
  info: "text-brand-700",
  neutral: "text-ink-muted",
};

/** One line of the credential-health list. Zero is shown, not hidden. */
function Line({ label, value, tone = "neutral", icon, hint }) {
  const count = Number(value ?? 0);
  return (
    <li
      className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 hover:bg-slate-50"
      title={hint}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon ? <span className={TONE_TEXT[tone]}>{icon}</span> : null}
        <span className="truncate text-[12.5px] text-ink-muted">{label}</span>
      </span>
      <span
        className={`shrink-0 text-[13.5px] font-bold tabular-nums ${
          count ? TONE_TEXT[tone] : "text-ink-faint"
        }`}
      >
        {formatNumber(count)}
      </span>
    </li>
  );
}
