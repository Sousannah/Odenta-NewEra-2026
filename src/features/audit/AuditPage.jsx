import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAsync } from "@/hooks";
import { clinicService } from "@/services";
import { formatDate } from "@/lib/format";
import { ROLE_META } from "@/auth/roles";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/Misc";
import { InfoBanner } from "@/components/ui/Misc";
import { PageHeader, Toolbar } from "@/components/shared";

/**
 * Audit trail.
 *
 * Access to a patient record is itself an event worth recording. This screen
 * is the read side of that log; the write side belongs to the server, which
 * is the only place that can be trusted to record who did what.
 */
export default function AuditPage() {
  const [query, setQuery] = useState("");
  const { data: entries = [], loading } = useAsync(
    () => clinicService.getAuditLog({ q: query }),
    [query],
    []
  );

  const columns = [
    {
      key: "at",
      header: "When",
      sortable: true,
      width: 190,
      render: (row) => formatDate(row.at, "d MMM yyyy · HH:mm:ss"),
    },
    {
      key: "actor",
      header: "Actor",
      sortable: true,
      render: (row) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={row.actor} size="xs" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-ink">{row.actor}</span>
            <span className="block truncate text-[11.5px] text-ink-soft">
              {ROLE_META[row.role]?.label ?? row.role}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      render: (row) => <Badge tone="brand">{row.action}</Badge>,
    },
    { key: "entity", header: "Entity", render: (row) => <code className="text-[12px]">{row.entity}</code> },
    { key: "detail", header: "Detail" },
    { key: "ip", header: "Source IP", render: (row) => <code className="text-[12px]">{row.ip}</code> },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Audit log"
        description="Who touched what, and when. Retained for compliance review."
      />

      <InfoBanner tone="neutral" icon={<ShieldCheck className="h-4 w-4" />}>
        Entries are written server-side and are not editable from the client. Patient data access
        is logged alongside changes.
      </InfoBanner>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search actor, action or entity…"
            className="w-[340px]"
          />
        }
      />

      <DataTable columns={columns} rows={entries} loading={loading} emptyTitle="No audit entries" />
    </div>
  );
}
