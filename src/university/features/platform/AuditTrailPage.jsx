import { useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { platformService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, MiniSelect, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { InfoBanner, SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar } from "@/components/shared";
import { recentMonths, thisMonth } from "./platformFormat";

/**
 * Everything Odenta has done, to whom, and when.
 *
 * ## Two trails, deliberately separate
 *
 * A campus's own activity — which student submitted which step — lives in the
 * university portal's activity screen and is partitioned by campus. This one
 * answers a different question: what did *the platform operator* do. Keeping
 * them apart is not tidiness. A university asking for a complete account of
 * Odenta's access to their tenant cannot be answered from a trail scattered
 * across the tenants it acted on, and they should not have to trust their own
 * tenant's data to produce it.
 *
 * Kept for two years rather than the six months a campus trail keeps, because
 * six months is shorter than the gap between an incident and its investigation.
 *
 * ## The export is itself audited
 *
 * Bulk-reading personal data is the shape of an exfiltration whoever is doing
 * it, so an export writes a security event naming the range, the tenant and the
 * operator *before* it returns a byte. That is the ordering that matters when
 * the question is later asked about somebody who did not want to be noticed.
 */

/** The action families, so a filter is a click rather than a remembered prefix. */
const ACTION_GROUPS = [
  { value: "all", label: "Everything" },
  { value: "tenant.", label: "Tenants" },
  { value: "account.", label: "Accounts" },
  { value: "billing.", label: "Billing" },
  { value: "security.", label: "Security" },
  { value: "settings.", label: "Settings" },
  { value: "role.", label: "Roles" },
  { value: "node.", label: "Infrastructure" },
  { value: "preview.", label: "Tenant previews" },
  { value: "audit.", label: "Exports" },
];

export default function AuditTrailPage() {
  const toast = useToast();
  const exportModal = useDisclosure();
  const months = recentMonths(24);

  const [month, setMonth] = useState(thisMonth());
  const [action, setAction] = useState("all");
  const [tenantId, setTenantId] = useState("all");
  const [query, setQuery] = useState("");

  const { data: tenants = [] } = useAsync(() => platformService.getTenants(), [], []);
  const { data: rows = [], loading } = useAsync(
    () =>
      platformService.getActivity({
        month,
        action: action === "all" ? undefined : action,
        tenantId,
        limit: 200,
      }),
    [month, action, tenantId],
    []
  );

  /**
   * Free-text filtering happens here, not on the server.
   *
   * The structured filters — month, action family, tenant — all reach an index.
   * A substring search over the detail text could not: it is free text nobody
   * indexed, so pushing it to the server would turn a seek into a scan of the
   * month. Filtering the page that is already loaded costs nothing and is
   * honest about its scope: it narrows what is on screen.
   */
  const search = query.trim().toLowerCase();
  const visible = search
    ? rows.filter((row) =>
        `${row.detail ?? ""} ${row.actor ?? ""} ${row.action} ${row.entityId ?? ""}`
          .toLowerCase()
          .includes(search)
      )
    : rows;

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Audit trail"
        description="Every action an operator has taken against a tenant. Kept for two years — longer than a campus's own trail, because an incident is investigated long after it happens."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportModal.open}
          >
            Export
          </Button>
        }
      />

      <Toolbar
        left={
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter what is on screen…"
              className="w-full sm:w-[280px]"
            />
            <MiniSelect value={month} onChange={(event) => setMonth(event.target.value)}>
              {months.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
          </>
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
            <MiniSelect value={action} onChange={(event) => setAction(event.target.value)}>
              {ACTION_GROUPS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
          </>
        }
      />

      {search && visible.length !== rows.length ? (
        <p className="text-[12px] text-ink-soft">
          Showing {formatNumber(visible.length)} of {formatNumber(rows.length)} rows loaded for this
          month. The search narrows what is on screen — change the month or the filters to look
          wider.
        </p>
      ) : null}

      <DataTable
        loading={loading}
        rows={visible}
        rowKey={(row) => row.eventId}
        dense
        emptyTitle="Nothing in this month"
        emptyDescription="Odenta has taken no recorded action against a tenant in this period."
        columns={[
          {
            key: "at",
            header: "When",
            sortable: true,
            render: (row) => (
              <span
                className="text-[13px] text-ink-muted"
                title={formatDate(row.at, "d MMM yyyy, HH:mm:ss")}
              >
                {fromNow(row.at)}
              </span>
            ),
          },
          {
            key: "actor",
            header: "Who",
            sortable: true,
            render: (row) => (
              <div className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-ink">
                  {row.actor ?? "System"}
                </span>
                <span className="block truncate text-[11.5px] text-ink-faint">{row.actorRole}</span>
              </div>
            ),
          },
          {
            key: "action",
            header: "Action",
            sortable: true,
            render: (row) => (
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11.5px] text-ink-muted">
                {row.action}
              </span>
            ),
          },
          {
            key: "detail",
            header: "What",
            render: (row) => (
              <span className="block max-w-[420px] truncate text-[13px] text-ink">
                {row.detail ?? "—"}
              </span>
            ),
          },
          {
            key: "tenantId",
            header: "Tenant",
            sortable: true,
            render: (row) =>
              row.tenantId ? (
                <Badge tone="outline">{row.tenantId}</Badge>
              ) : (
                <span className="text-[12px] italic text-ink-faint">Platform</span>
              ),
          },
          {
            key: "status",
            header: "",
            render: (row) =>
              row.status === "ok" ? null : <Badge tone="danger">{row.status}</Badge>,
          },
        ]}
      />

      <ExportModal
        open={exportModal.isOpen}
        onClose={exportModal.close}
        tenants={tenants}
        onExported={(result) => {
          toast.success(
            `Exported ${formatNumber(result.count)} rows`,
            result.truncated ? "Capped — narrow the range to get the rest" : "Recorded in the trail"
          );
          exportModal.close();
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- export */

function ExportModal({ open, onClose, tenants, onExported }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(
    () => new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(today);
  const [tenantId, setTenantId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await platformService.exportActivity({
        from,
        to,
        tenantId: tenantId || undefined,
        reason: reason.trim(),
      });

      /**
       * Downloaded from a blob the browser builds, never from a link the server
       * signs. There is nothing to leak in a URL and nothing to expire.
       */
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `odenta-audit-${from}-to-${to}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      onExported?.(result);
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export the audit trail"
      description="At most a quarter at a time."
      size="md"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <InfoBanner tone="warning" icon={<ScrollText className="h-4 w-4" />}>
          This export is itself recorded — as an audit row and as a security event naming the range,
          the tenant and you. Bulk-reading personal data looks the same whoever is doing it, so it is
          always logged.
        </InfoBanner>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" required>
            <Input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To" required error={error?.details?.to}>
            <Input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} />
          </Field>
        </div>

        <Field label="Tenant" hint="Leave blank for every tenant.">
          <select
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="od-input"
          >
            <option value="">Every tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenantId} value={tenant.tenantId}>
                {tenant.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Why" required hint="Recorded verbatim against the export.">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Accreditation review for Alamein International University, requested 14 September."
          />
        </Field>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={reason.trim().length < 3}>
            Export
          </Button>
        </div>
      </form>
    </Modal>
  );
}
