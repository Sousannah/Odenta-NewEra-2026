import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Inbox,
  Info,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid, Toolbar } from "@/components/shared";
import { HorizontalBars } from "@/components/charts";
import {
  POSTURE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  recentMonths,
  thisMonth,
} from "./platformFormat";

/**
 * The security centre.
 *
 * ## Why the feed is short
 *
 * Nothing routine reaches it. A failed sign-in is not an event; five failed
 * sign-ins against one account in fifteen minutes is. A 403 is not an event;
 * twelve from one session is. The thresholds live on the server next to a note
 * explaining each one, because they are part of the security model rather than
 * tuning knobs — and because a feed that fills with noise is a feed that stops
 * being read, which is strictly worse than not having one.
 *
 * ## Alerts and events are different things
 *
 * An event is an immutable record of something that happened. An alert is a
 * pointer to one that a person still has to look at, kept in its own small
 * partition so the badge in the top bar is a cheap read rather than a count
 * over two years of history. Dismissing an alert removes the pointer; the event
 * it points at is never touched, which is what makes dismissing safe.
 */
export default function SecurityCenterPage() {
  const toast = useToast();
  const months = recentMonths(12);

  const [month, setMonth] = useState(thisMonth());
  const [minSeverity, setMinSeverity] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: summary, refetch: refetchSummary } = useAsync(
    () => platformService.getSecuritySummary(),
    []
  );

  const { data: events = [], loading, refetch } = useAsync(
    () => platformService.getSecurityEvents({ month, minSeverity, status, limit: 100 }),
    [month, minSeverity, status],
    []
  );

  const after = () => {
    refetch();
    refetchSummary();
  };

  const decide = async (event, nextStatus) => {
    try {
      await platformService.setSecurityEventStatus(event.eventId, { status: nextStatus, month });
      toast.success(`Marked ${nextStatus}`, event.label);
      after();
    } catch (error) {
      toast.error("Could not update that event", error.message);
    }
  };

  const acknowledgeAlert = async (alert, resolve) => {
    try {
      await platformService.acknowledgeAlert(alert.id, { resolve });
      toast.success(resolve ? "Alert resolved" : "Alert acknowledged", alert.title);
      after();
    } catch (error) {
      toast.error("Could not update that alert", error.message);
    }
  };

  const posture = POSTURE[summary?.level] ?? POSTURE.clear;
  const bySeverity = summary?.bySeverity ?? {};

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Security"
        description="Only events a person would act on. Routine failures are counted, not recorded — a feed that fills with noise is a feed nobody reads."
      />

      {/* ------------------------------------------------------- the headline */}
      <InfoBanner
        tone={posture.tone === "success" ? "success" : posture.tone === "danger" ? "danger" : "warning"}
        icon={posture.tone === "success" ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
      >
        <span className="font-bold">{posture.label}</span> — {posture.hint}. {summary?.recent ?? 0}{" "}
        events in the last {summary?.windowHours ?? 24} hours, {summary?.open ?? 0} still unreviewed.
      </InfoBanner>

      <StatGrid cols={5}>
        <StatCard
          label="Unreviewed" value={formatNumber(summary?.open ?? 0)} tone={summary?.open ? "warning" : "brand"}
          icon={<Inbox className="h-5 w-5" />}
        />
        <StatCard
          label="Critical" value={formatNumber(bySeverity.critical ?? 0)} tone="danger"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <StatCard
          label="High" value={formatNumber(bySeverity.high ?? 0)} tone="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Medium" value={formatNumber(bySeverity.medium ?? 0)} tone="warning"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Low & info" value={formatNumber((bySeverity.low ?? 0) + (bySeverity.info ?? 0))}
          icon={<Info className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        {/* --------------------------------------------------------- alerts */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Open incidents"
            subtitle="Raised automatically for anything high or above"
          />
          <CardBody className="pt-2">
            {summary?.alerts?.length ? (
              <ul className="flex flex-col gap-2.5">
                {summary.alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge tone={SEVERITY_TONE[alert.severity]}>
                          {SEVERITY_LABEL[alert.severity]}
                        </Badge>
                        <span className="truncate text-[13px] font-bold text-ink">{alert.title}</span>
                        {alert.tenantId ? <Badge tone="outline">{alert.tenantId}</Badge> : null}
                      </span>
                      <span className="mt-1 block text-[12px] text-ink-soft">{alert.detail}</span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-faint">
                        {fromNow(alert.at)} · {formatDate(alert.at, "d MMM yyyy, HH:mm")}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <Button
                        variant="secondary"
                        size="xs"
                        leftIcon={<Check className="h-3.5 w-3.5" />}
                        onClick={() => acknowledgeAlert(alert, false)}
                      >
                        Seen
                      </Button>
                      <Button variant="success" size="xs" onClick={() => acknowledgeAlert(alert, true)}>
                        Resolve
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="Nothing open"
                description="Every incident raised has been acknowledged or resolved."
                className="py-10"
              />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------ what kind */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="What has been happening" subtitle="Last 24 hours, by kind" />
          <CardBody className="pt-4">
            {summary?.topThreats?.length ? (
              <HorizontalBars
                data={summary.topThreats.map((entry) => ({ name: entry.label, value: entry.count }))}
                valueFormatter={formatNumber}
              />
            ) : (
              <EmptyState title="Quiet" description="No events in the last day." className="py-10" />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ---------------------------------------------------------- the feed */}
      <Toolbar
        left={
          <MiniSelect value={month} onChange={(event) => setMonth(event.target.value)}>
            {months.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </MiniSelect>
        }
        right={
          <>
            <MiniSelect value={minSeverity} onChange={(event) => setMinSeverity(event.target.value)}>
              <option value="all">Any severity</option>
              {["critical", "high", "medium", "low", "info"].map((value) => (
                <option key={value} value={value}>
                  {SEVERITY_LABEL[value]} and above
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Any state</option>
              <option value="open">Unreviewed</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </MiniSelect>
          </>
        }
      />

      <DataTable
        loading={loading}
        rows={events}
        dense
        rowKey={(row) => row.eventId}
        emptyTitle="No events in this month"
        emptyDescription="Try a different month, or widen the severity filter."
        columns={[
          {
            key: "at",
            header: "When",
            sortable: true,
            render: (row) => (
              <span className="text-[13px] text-ink-muted" title={formatDate(row.at, "d MMM yyyy, HH:mm:ss")}>
                {fromNow(row.at)}
              </span>
            ),
          },
          {
            key: "severity",
            header: "Severity",
            sortable: true,
            render: (row) => (
              <Badge tone={SEVERITY_TONE[row.severity]}>{SEVERITY_LABEL[row.severity]}</Badge>
            ),
          },
          {
            key: "label",
            header: "Event",
            render: (row) => (
              <div className="min-w-0">
                <span className="block truncate text-[13px] font-bold text-ink">{row.label}</span>
                <span className="block truncate text-[12px] text-ink-soft">{row.summary}</span>
              </div>
            ),
          },
          {
            key: "tenantId",
            header: "Tenant",
            render: (row) => (
              <span className="font-mono text-[12.5px] text-ink-muted">{row.tenantId ?? "—"}</span>
            ),
          },
          {
            key: "status",
            header: "State",
            sortable: true,
            render: (row) => (
              <div className="flex flex-col items-start gap-1">
                <Badge tone={row.status === "open" ? "warning" : "neutral"}>{row.status}</Badge>
                {row.acknowledgedAt ? (
                  <span className="text-[11px] text-ink-faint">{fromNow(row.acknowledgedAt)}</span>
                ) : null}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (row) =>
              row.status === "open" ? (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                    onClick={() => decide(row, "acknowledged")}
                  >
                    Seen
                  </Button>
                  <Button variant="success" size="xs" onClick={() => decide(row, "resolved")}>
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    leftIcon={<X className="h-3.5 w-3.5" />}
                    onClick={() => decide(row, "dismissed")}
                    aria-label="Dismiss"
                  />
                </div>
              ) : null,
          },
        ]}
      />

      {/* ------------------------------------------------------- the rules */}
      {/**
       * The catalogue is shown rather than hidden, because "why did this not
       * alert me" is the question a security screen gets asked most, and the
       * honest answer is a thresholds table.
       */}
      {summary?.catalogue?.length ? (
        <Card>
          <CardHeader
            title="What gets recorded"
            subtitle="The rules behind the feed — an event is only raised when the threshold is crossed"
          />
          <CardBody className="pt-2">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {summary.catalogue.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                >
                  <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink">
                    {entry.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {entry.alerts ? <Badge tone="outline">alerts</Badge> : null}
                    <Badge tone={SEVERITY_TONE[entry.severity]}>{SEVERITY_LABEL[entry.severity]}</Badge>
                  </span>
                </div>
              ))}
            </div>
            {summary.thresholds ? (
              <p className="mt-4 text-[12px] text-ink-soft">
                Thresholds: {summary.thresholds.failuresPerAccount} failed sign-ins against one
                account, {summary.thresholds.accountsPerSource} accounts probed from one source,{" "}
                {summary.thresholds.denialsPerSession} permission denials from one session — all
                within {summary.thresholds.windowMinutes} minutes.
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
