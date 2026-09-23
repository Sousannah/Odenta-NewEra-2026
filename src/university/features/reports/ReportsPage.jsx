import { useNavigate, useOutletContext } from "react-router-dom";
import { Award, Download, Printer, ShieldAlert, Target, Users } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { ROLES } from "@/auth/roles";
import { uni } from "@/config/paths";
import { departmentMeta } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { ProgressBar } from "@/components/ui/Stepper";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import { HorizontalBars } from "@/components/charts";
import { AcademicYearChip, RequirementBar } from "@/university/components";
import { ReportBuilder } from "./ReportBuilder";

/**
 * End-of-rotation report.
 *
 * This is the document a supervisor takes into a progress board: cohort
 * completion, the students who will not clear their quota, and the rotations
 * where the whole group is short.
 */
export default function ReportsPage() {
  const { user, role, campus } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();

  const supervisorId = role === ROLES.UNI_SUPERVISOR ? user?.staffId : undefined;

  const { data: report, loading } = useAsync(
    () => universityService.getReport(supervisorId ? { supervisorId } : {}),
    [supervisorId]
  );

  const exportCsv = () => {
    if (!report) return;
    const header = [
      "Student ID",
      "Name",
      "Group",
      "Year",
      "Progress %",
      "Average score",
      "Accepted",
      "Returned",
      "Rejected",
      "Status",
    ];
    const lines = report.students.map((row) =>
      [
        row.id,
        row.name,
        row.group,
        row.academicYear,
        row.progress,
        row.averageScore,
        row.acceptedSteps,
        row.returnedSteps,
        row.rejectedSteps,
        row.status,
      ].join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `odenta-rotation-report-${toDateKey()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", `${report.students.length} student rows`);
  };

  if (loading || !report) {
    return <OdentaLoaderPanel />;
  }

  const columns = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(uni.student(row.id))}
            className="od-focus block truncate rounded text-[13.5px] font-bold text-ink hover:text-brand-700"
          >
            {row.name}
          </button>
          <span className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
            {row.group}
            <AcademicYearChip year={row.academicYear} />
          </span>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Quota",
      sortable: true,
      width: "200px",
      render: (row) => (
        <div className="min-w-0">
          <span className="text-[13px] font-bold text-ink">{row.progress}%</span>
          <ProgressBar
            value={row.progress}
            tone={row.progress >= 60 ? "success" : row.progress >= 30 ? "brand" : "danger"}
            className="mt-1.5"
          />
        </div>
      ),
    },
    {
      key: "averageScore",
      header: "Avg. score",
      sortable: true,
      align: "center",
      render: (row) => (
        <span
          className={
            row.averageScore >= 75
              ? "text-[14px] font-extrabold text-success-strong"
              : row.averageScore >= 60
                ? "text-[14px] font-extrabold text-ink"
                : "text-[14px] font-extrabold text-danger"
          }
        >
          {row.averageScore}
        </span>
      ),
    },
    {
      key: "acceptedSteps",
      header: "Accepted",
      sortable: true,
      align: "center",
      render: (row) => <span className="text-[13px] font-bold text-ink">{row.acceptedSteps}</span>,
    },
    {
      key: "returnedSteps",
      header: "Returned",
      sortable: true,
      align: "center",
      render: (row) => (
        <span className="text-[13px] font-semibold text-warning-ink">{row.returnedSteps}</span>
      ),
    },
    {
      key: "rejectedSteps",
      header: "Rejected",
      sortable: true,
      align: "center",
      render: (row) => <span className="text-[13px] font-semibold text-danger">{row.rejectedSteps}</span>,
    },
    {
      key: "status",
      header: "Standing",
      sortable: true,
      render: (row) => (
        <Badge
          tone={row.status === "probation" ? "danger" : row.progress < 40 ? "warning" : "success"}
        >
          {row.status === "probation" ? "Probation" : row.progress < 40 ? "At risk" : "On track"}
        </Badge>
      ),
    },
  ];

  const atRisk = report.students.filter(
    (row) => row.progress < 40 || row.status === "probation"
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Rotation report"
        description={`${campus?.term ?? "Current term"} · generated ${formatDate(
          report.generatedAt,
          "d MMMM yyyy, HH:mm"
        )}`}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* A snapshot with a date on it, kept so the numbers can be quoted after
          the underlying rows have moved. The live read follows below. */}
      <ReportBuilder scope={supervisorId ? { supervisorId } : {}} />

      <StatGrid cols={4}>
        <StatCard
          label="Students in scope" value={report.cohort}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Average quota cleared" value={`${report.averageProgress}%`} tone="success"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="Average score" value={`${report.averageScore}/100`}
          icon={<Award className="h-5 w-5" />}
        />
        <StatCard
          label="At risk"
          value={report.atRisk}
          tone="danger"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-6">
          <CardHeader
            title="Quota by rotation"
            subtitle="Completed against required, across the whole cohort"
          />
          <CardBody className="pt-3">
            <div className="grid gap-5 sm:grid-cols-2">
              {report.byDepartment.map((entry) => (
                <RequirementBar key={entry.department} {...entry} />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-6">
          <CardHeader title="Completion rate" subtitle="Percent of quota cleared per rotation" />
          <CardBody className="pt-4">
            <HorizontalBars
              data={report.byDepartment.map((entry) => ({
                name: departmentMeta(entry.department).short,
                value: entry.percent,
              }))}
              valueFormatter={(value) => `${value}%`}
            />
          </CardBody>
        </Card>
      </div>

      {atRisk.length ? (
        <Card className="border-danger/25">
          <CardHeader
            title="Students who will not clear their quota"
            subtitle="Below 40% of requirement, or already on probation"
          />
          <CardBody className="pt-2">
            <ul className="grid gap-2.5 md:grid-cols-2">
              {atRisk.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft/40 px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(uni.student(row.id))}
                      className="od-focus block truncate rounded text-[13px] font-bold text-ink hover:text-brand-700"
                    >
                      {row.name}
                    </button>
                    <span className="block truncate text-[12px] text-ink-soft">
                      {row.group} · {row.acceptedSteps} accepted · {row.returnedSteps} returned
                    </span>
                  </span>
                  <span className="shrink-0 text-[16px] font-extrabold text-danger">
                    {row.progress}%
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        rows={report.students}
        dense
        emptyTitle="No students in scope"
      />
    </div>
  );
}
