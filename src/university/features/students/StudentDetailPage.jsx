import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  RotateCcw,
  ShieldAlert,
  Target,
  XCircle,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { universityService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { uni } from "@/config/paths";
import { REVIEW_STATUS, departmentMeta } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { InfoBanner } from "@/components/ui/Misc";
import { StatCard, StatGrid } from "@/components/shared";
import { HorizontalBars } from "@/components/charts";
import {
  AcademicYearChip,
  CaseStatusBadge,
  DepartmentChip,
  ProgressRing,
  RequirementBar,
  ReviewStatusBadge,
} from "@/university/components";
import { ReviewDecisionModal } from "@/university/supervisor/ReviewDecisionModal";

/**
 * One student's record.
 *
 * A supervisor opens this before a difficult conversation, so it leads with
 * the quota gap and the returned work rather than with contact details.
 */
export default function StudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [selected, setSelected] = useState(null);

  const { data: student, loading, refetch } = useAsync(
    () => universityService.getStudent(studentId),
    [studentId]
  );

  /**
   * The same dialog the review queue opens.
   *
   * A submitted step read from a student's record and the same step read from
   * the queue are the same thing, and this screen used to show a thinner
   * version of it — no quick-glance header, no dossier, no per-step verdicts.
   * A staff member opening an old submission before a difficult conversation
   * needs the whole record, not a summary of it.
   */
  const decide = async (payload) => {
    await universityService.decideReview(selected.id, payload);
    toast.success(
      payload.status === REVIEW_STATUS.ACCEPTED ? "Step signed off" : "Sent back to the student",
      `${student?.name} · ${selected.procedureType}`
    );
    refetch();
  };

  const reviews = student?.reviews ?? [];
  const cases = student?.cases ?? [];

  const returned = useMemo(
    () => reviews.filter((item) => item.status === REVIEW_STATUS.RETURNED),
    [reviews]
  );
  const rejected = useMemo(
    () => reviews.filter((item) => item.status === REVIEW_STATUS.REJECTED),
    [reviews]
  );

  if (loading || !student) {
    return <OdentaLoaderPanel />;
  }

  const caseColumns = [
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      render: (item) => (
        <button
          type="button"
          onClick={() => navigate(uni.case(item.id))}
          className="od-focus block truncate rounded text-[13.5px] font-bold text-ink hover:text-brand-700"
        >
          {item.patientName}
        </button>
      ),
    },
    {
      key: "department",
      header: "Rotation",
      sortable: true,
      render: (item) => <DepartmentChip department={item.department} short />,
    },
    { key: "status", header: "Status", sortable: true, render: (item) => <CaseStatusBadge status={item.status} /> },
    {
      key: "stepsAccepted",
      header: "Steps accepted",
      sortable: true,
      align: "center",
      render: (item) => <span className="text-[13px] font-bold text-ink">{item.stepsAccepted}</span>,
    },
    {
      key: "openedAt",
      header: "Opened",
      sortable: true,
      render: (item) => (
        <span className="text-[13px] text-ink-muted">{formatDate(item.openedAt, "d MMM yyyy")}</span>
      ),
    },
  ];

  const reviewColumns = [
    {
      key: "procedureType",
      header: "Step",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold text-ink">{item.procedureType}</span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
            {item.patientName} · tooth {item.tooth}
          </span>
        </div>
      ),
    },
    {
      key: "department",
      header: "Rotation",
      sortable: true,
      render: (item) => <DepartmentChip department={item.department} short />,
    },
    {
      key: "submittedAt",
      header: "Submitted",
      sortable: true,
      render: (item) => <span className="text-[13px] text-ink-muted">{fromNow(item.submittedAt)}</span>,
    },
    {
      key: "status",
      header: "Outcome",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col items-start gap-1">
          <ReviewStatusBadge status={item.status} />
          {item.score != null ? (
            <span className="text-[11.5px] font-bold text-success-strong">{item.score}/100</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <Button variant="secondary" size="xs" onClick={() => setSelected(item)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(uni.students)}
            className="od-focus inline-flex items-center gap-1.5 rounded text-[12.5px] font-bold text-ink-muted transition hover:text-brand-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to students
          </button>

          <div className="mt-3 flex items-center gap-4">
            <Avatar name={student.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-extrabold text-ink">{student.name}</h2>
                <AcademicYearChip year={student.academicYear} />
                <Badge tone={student.status === "probation" ? "danger" : "success"}>
                  {student.status === "probation" ? "Probation" : "Active"}
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                <span>{student.studentNumber}</span>
                <span>{student.group}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {student.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {student.phone}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="od-label">Supervised by</span>
          <p className="mt-1 text-[14px] font-bold text-ink">{student.supervisorName ?? "—"}</p>
          <p className="mt-0.5 text-[12px] text-ink-soft">Last active {fromNow(student.lastActiveAt)}</p>
        </div>
      </div>

      {student.progress < 45 ? (
        <InfoBanner tone="warning" icon={<ShieldAlert className="h-4 w-4" />}>
          This student has cleared {student.progress}% of their rotation quota with{" "}
          {returned.length} returned and {rejected.length} rejected step(s). Worth a conversation
          before the end of term.
        </InfoBanner>
      ) : null}

      <StatGrid cols={4}>
        <StatCard
          label="Requirement progress" value={`${student.progress}%`}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="Steps accepted" value={student.acceptedSteps} tone="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Returned" value={student.returnedSteps} tone="warning"
          icon={<RotateCcw className="h-5 w-5" />}
        />
        <StatCard
          label="Rejected" value={student.rejectedSteps} tone="danger"
          icon={<XCircle className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Requirements" subtitle="Quota per rotation" />
          <CardBody className="flex items-center gap-6 pt-2">
            <ProgressRing
              value={student.progress}
              size={112}
              sublabel="overall"
              tone={student.progress >= 60 ? "success" : student.progress >= 30 ? "brand" : "danger"}
            />
            <div className="min-w-0 flex-1 space-y-4">
              {student.requirements.map((entry) => (
                <RequirementBar key={entry.department} {...entry} />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title="Work by rotation" subtitle="Accepted steps per department" />
          <CardBody className="pt-4">
            <HorizontalBars
              data={student.requirements.map((entry) => ({
                name: departmentMeta(entry.department).short,
                value: entry.completed,
              }))}
            />
          </CardBody>
        </Card>
      </div>

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases" badge={cases.length || undefined}>
            Caseload
          </TabsTrigger>
          <TabsTrigger value="reviews" badge={reviews.length || undefined}>
            Submitted work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="pt-4">
          <DataTable
            columns={caseColumns}
            rows={cases}
            emptyTitle="No cases allocated"
            emptyDescription="This student has no patients this term."
          />
        </TabsContent>

        <TabsContent value="reviews" className="pt-4">
          <DataTable
            columns={reviewColumns}
            rows={reviews}
            onRowClick={setSelected}
            emptyTitle="Nothing submitted"
            emptyDescription="No steps have been sent for review yet."
          />
        </TabsContent>
      </Tabs>

      <ReviewDecisionModal
        review={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onDecide={decide}
      />
    </div>
  );
}
