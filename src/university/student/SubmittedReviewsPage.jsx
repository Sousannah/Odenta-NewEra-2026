import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, ClipboardList, Hourglass } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { REVIEW_STATUS } from "@/config/academic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PageHeader, Toolbar } from "@/components/shared";
import { DepartmentChip, ReviewStatusBadge } from "@/university/components";
import { ReviewDrawer } from "@/university/components/ReviewDrawer";
import { stepTally } from "@/university/features/reviews/MyReviewsPage";

/**
 * Every review submitted against this patient.
 *
 * The same rows as My Reviews, narrowed to one chair. Worth its own tab
 * because a case is discussed patient-first — "where did we get to with
 * Mr Barakat" is the question, not "where did that endodontic step go".
 */

const PROCEDURE_TYPES = [
  "All",
  "Operative",
  "Fixed Prosthodontics",
  "Removable Prosthodontics",
  "Endodontics",
  "Periodontics",
  "Oral Surgery",
];

const isDone = (status) =>
  [REVIEW_STATUS.ACCEPTED, REVIEW_STATUS.RETURNED, REVIEW_STATUS.REJECTED].includes(status);

export default function SubmittedReviewsPage() {
  const { record } = useOutletContext();

  const { data: rows = [], loading } = useAsync(
    () => universityService.getReviews({ caseId: record.id }),
    [record.id],
    []
  );

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [selected, setSelected] = useState(null);

  const pendingCount = rows.filter((item) => item.status === REVIEW_STATUS.PENDING).length;
  const doneCount = rows.filter((item) => isDone(item.status)).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((item) => {
      if (tab === "pending" && item.status !== REVIEW_STATUS.PENDING) return false;
      if (tab === "done" && !isDone(item.status)) return false;
      if (type !== "All" && !String(item.procedureType).startsWith(type)) return false;
      if (!needle) return true;
      return [item.procedureType, item.supervisorName, item.tooth]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [rows, tab, type, query]);

  const columns = [
    {
      key: "procedureType",
      header: "Procedure",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-ink">{row.procedureType}</span>
          <span className="block truncate text-[12px] text-ink-soft">
            Tooth {row.tooth} · step {row.stepIndex} of {row.stepTotal}
          </span>
        </span>
      ),
    },
    {
      key: "department",
      header: "Rotation",
      render: (row) => <DepartmentChip department={row.department} short />,
    },
    { key: "supervisorName", header: "Supervisor" },
    {
      key: "status",
      header: "Status",
      render: (row) => <ReviewStatusBadge status={row.status} />,
    },
    {
      key: "stepFeedback",
      header: "Step feedback",
      render: (row) => {
        const tally = stepTally(row);
        if (!tally.total) return <span className="text-[12px] text-ink-faint">No steps</span>;
        if (tally.accepted === tally.total) {
          return (
            <Badge tone="success">
              <CheckCircle2 className="h-3 w-3" />
              All accepted
            </Badge>
          );
        }
        if (!tally.accepted && !tally.declined) {
          return (
            <Badge tone="neutral">
              <Hourglass className="h-3 w-3" />
              Awaiting review
            </Badge>
          );
        }
        return (
          <Badge tone={tally.declined ? "warning" : "success"}>
            {tally.accepted}/{tally.total} accepted
          </Badge>
        );
      },
    },
    {
      key: "submittedAt",
      header: "Submitted",
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] text-ink-muted">
          {formatDate(row.submittedAt, "d MMM yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <Button variant="link" size="sm" onClick={() => setSelected(row)}>
          View
        </Button>
      ),
    },
  ];

  const table = (
    <DataTable
      columns={columns}
      rows={visible}
      loading={loading}
      onRowClick={setSelected}
      emptyTitle="No reviews found"
      emptyDescription="Steps submitted for this patient appear here."
    />
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Submitted reviews"
        description={`Everything sent for sign-off on ${record.patientName}.`}
        actions={
          <Badge tone="neutral">
            <ClipboardList className="h-3 w-3" />
            {rows.length} total
          </Badge>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all" badge={rows.length}>
            All
          </TabsTrigger>
          <TabsTrigger value="pending" badge={pendingCount}>
            Pending
          </TabsTrigger>
          <TabsTrigger value="done" badge={doneCount}>
            Done
          </TabsTrigger>
        </TabsList>

        <div className="pt-4">
          <Toolbar
            className="mb-4"
            left={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search by procedure or staff member…"
                className="w-full sm:w-[340px]"
              />
            }
            right={
              <MiniSelect value={type} onChange={(event) => setType(event.target.value)}>
                {PROCEDURE_TYPES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </MiniSelect>
            }
          />

          <TabsContent value="all">{table}</TabsContent>
          <TabsContent value="pending">{table}</TabsContent>
          <TabsContent value="done">{table}</TabsContent>
        </div>
      </Tabs>

      <ReviewDrawer review={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
