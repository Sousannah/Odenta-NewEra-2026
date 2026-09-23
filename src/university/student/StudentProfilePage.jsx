import { useOutletContext } from "react-router-dom";
import {
  BadgeCheck,
  CalendarRange,
  GraduationCap,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { academicYearLabel } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import { DetailGrid, ProgressRing, RequirementBar } from "@/university/components";

/**
 * My profile.
 *
 * The student's own record as the faculty holds it — the numbers that go on a
 * transcript. It is read-only on purpose: a student may correct a patient's
 * phone number, never their own GPA or quota, so this screen shows what the
 * registry has and says who to ask if it is wrong.
 */
export default function StudentProfilePage() {
  const { user, campus } = useOutletContext() ?? {};
  const studentId = user?.staffId;

  const { data: student, loading, error } = useAsync(
    () => (studentId ? universityService.getStudent(studentId) : null),
    [studentId]
  );

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  /**
   * No student record behind the session.
   *
   * The platform super admin holds every university permission, so they can
   * reach this route — but they have no rotation and no quota. Say so rather
   * than spinning on a fetch that will never resolve.
   */
  if (error || !student) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <PageHeader title="My profile" description="Your record as the faculty registry holds it." />
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="No student record on this account"
          description={`${user?.name ?? "This account"} is signed in as ${
            user?.roleLabel ?? "a member of staff"
          }, which has no rotation or requirement quota. This screen is a student's own record.`}
          className="od-card py-16"
        />
      </div>
    );
  }

  const onProbation = student.status === "probation";

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="My profile"
        description="Your record as the faculty registry holds it."
        actions={
          <Badge tone={onProbation ? "danger" : "success"}>
            <ShieldCheck className="h-3 w-3" />
            {onProbation ? "On probation" : "Active"}
          </Badge>
        }
      />

      {onProbation ? (
        <InfoBanner tone="warning">
          You are flagged as on probation for this term. Speak to {student.supervisorName ?? "your supervisor"} about
          the requirements you need to clear.
        </InfoBanner>
      ) : null}

      <StatGrid cols={4}>
        <StatCard
          label="Accepted steps"
          value={formatNumber(student.acceptedSteps)}
          tone="success"
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Returned steps"
          value={formatNumber(student.returnedSteps)}
          tone="warning"
          icon={<RotateCcw className="h-5 w-5" />}
        />
        <StatCard
          label="Average score"
          value={`${student.averageScore}/100`}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="GPA"
          value={student.gpa}
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        {/* ------------------------------------------------------ identity */}
        <Card className="col-span-12 xl:col-span-5">
          <CardBody className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar name={student.name} size="xl" />
              <div className="min-w-0">
                <h3 className="truncate text-[18px] font-extrabold text-ink">{student.name}</h3>
                <p className="truncate text-[12.5px] text-ink-soft">
                  {academicYearLabel(student.academicYear)} · {student.group}
                </p>
                <p className="mt-1 truncate text-[12px] font-semibold text-ink-faint">
                  {campus?.name ?? "Campus"} · {campus?.faculty ?? "Faculty of Dentistry"}
                </p>
              </div>
            </div>

            <DetailGrid
              columns={2}
              items={[
                { label: "Student ID", value: student.id },
                { label: "Student number", value: student.studentNumber },
                {
                  label: "Email",
                  /* A university address is long enough to collide with the
                     next column, so the icon row wraps rather than overflowing. */
                  value: (
                    <span className="flex min-w-0 items-start gap-1.5">
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      <span className="min-w-0 break-all">{student.email}</span>
                    </span>
                  ),
                },
                {
                  label: "Phone",
                  value: (
                    <span className="flex min-w-0 items-start gap-1.5">
                      <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      <span className="min-w-0 break-words">{student.phone}</span>
                    </span>
                  ),
                },
                { label: "Supervisor", value: student.supervisorName ?? "—" },
                {
                  label: "Joined",
                  value: formatDate(student.joinedAt, "d MMM yyyy"),
                },
                {
                  label: "Term",
                  value: (
                    <span className="flex min-w-0 items-start gap-1.5">
                      <CalendarRange className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      <span className="min-w-0 break-words">
                        {campus?.term ?? "—"} {campus?.academicYear ?? ""}
                      </span>
                    </span>
                  ),
                },
                { label: "Last active", value: fromNow(student.lastActiveAt) },
              ]}
            />

            <InfoBanner tone="neutral">
              These details come from the faculty registry. If something is wrong, the university
              admin office can correct it — students cannot edit their own record.
            </InfoBanner>
          </CardBody>
        </Card>

        {/* -------------------------------------------------- the quota */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Rotation requirements"
            subtitle={`${student.requirements.length} rotation(s) this term`}
          />
          <CardBody className="pt-2">
            <div className="mb-6 flex items-center gap-6">
              <ProgressRing
                value={student.progress}
                size={112}
                sublabel="overall"
                tone={student.progress >= 70 ? "success" : student.progress >= 40 ? "brand" : "warning"}
              />
              <div className="min-w-0">
                <span className="od-label">Cases completed against quota</span>
                <p className="mt-1 text-[24px] font-extrabold leading-none text-ink">
                  {formatNumber(
                    student.requirements.reduce((sum, entry) => sum + entry.completed, 0)
                  )}
                  <span className="text-ink-faint">
                    {" / "}
                    {formatNumber(
                      student.requirements.reduce((sum, entry) => sum + entry.required, 0)
                    )}
                  </span>
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink-muted">
                  Only accepted steps count — a returned step moves nothing.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {student.requirements.map((entry) => (
                <RequirementBar key={entry.department} {...entry} />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
