import { ClipboardList } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { RequestStatusBadge } from "@/university/components";

/** What the student has asked the clinic desk for, and what came back. */
export function ProcedureRequestsWidget({ requests, onRaise, className }) {
  const columns = [
    {
      key: "requestedAt",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] font-semibold text-ink">
          {formatDate(row.requestedAt, "d MMM")}
        </span>
      ),
    },
    {
      key: "kind",
      header: "Procedure",
      render: (row) => (
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-ink">{row.kind}</span>
          {row.patientName ? (
            <span className="block truncate text-[12px] text-ink-soft">{row.patientName}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <RequestStatusBadge status={row.status} />,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader
        title="Procedure requests"
        subtitle={`${requests.filter((item) => item.status === "pending").length} awaiting a decision`}
        action={
          onRaise ? (
            <Button variant="link" size="sm" onClick={onRaise}>
              New request
            </Button>
          ) : null
        }
      />
      <CardBody className="pt-2">
        {requests.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="No procedure requests"
            description="Ask the clinic desk for a radiograph, extra chair time or a staff call."
            className="py-10"
            action={
              onRaise ? (
                <Button size="sm" onClick={onRaise}>
                  Raise a request
                </Button>
              ) : null
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={requests}
            dense
            className="border-0 shadow-none"
          />
        )}
      </CardBody>
    </Card>
  );
}
