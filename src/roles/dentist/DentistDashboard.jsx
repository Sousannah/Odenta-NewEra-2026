import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ClipboardList, FlaskConical, Play, Stethoscope, UserCheck } from "lucide-react";
import { useAsync } from "@/hooks";
import { analyticsService, labService, scheduleService } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { LAB_CASE_STAGES } from "@/config/dentalStandards";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardShell, AppointmentList, toneFor } from "@/components/shared";
import { GroupedBarChart, HorizontalBars } from "@/components/charts";
import { formatTeeth } from "@/components/dental";

/**
 * Dentist.
 *
 * The chair-side view: who is next, what is planned for them, what still
 * needs consent, which lab work is due, and what was prescribed.
 */
export default function DentistDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const dentistId = user?.staffId;
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data, loading } = useAsync(() => analyticsService.getDashboard(ROLES.DENTIST), []);
  const { data: appointments = [] } = useAsync(
    () => scheduleService.getAppointments({ date: todayIso, dentistId: dentistId ?? "all" }),
    [dentistId],
    []
  );
  const { data: labCases = [] } = useAsync(
    () => labService.getLabCases({ dentistId: dentistId ?? "all" }),
    [dentistId],
    []
  );

  const nextPatient = useMemo(
    () =>
      appointments
        .filter((item) => ["registered", "arrived", "encounter"].includes(item.status))
        .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null,
    [appointments]
  );

  const dueLabCases = labCases.filter((item) =>
    ["sent", "in_production", "try_in", "remake"].includes(item.stage)
  );

  if (loading || !data) {
    return (
      <div className="grid grid-cols-12 gap-5 p-6">
        <CardSkeleton className="col-span-12 xl:col-span-7" />
        <CardSkeleton className="col-span-12 xl:col-span-5" />
      </div>
    );
  }

  const { kpis, productionSeries, caseMix } = data;

  return (
    <DashboardShell
      user={user}
      role={ROLES.DENTIST}
      subtitle={user?.title ?? "Clinical"}
      actions={
        <>
          <Button variant="secondary" leftIcon={<ClipboardList className="h-4 w-4" />} onClick={() => navigate("/treatment-plans")}>
            Treatment plans
          </Button>
          <Button leftIcon={<Stethoscope className="h-4 w-4" />} onClick={() => navigate("/schedule")}>
            My chair
          </Button>
        </>
      }
      kpis={[
        { label: "Patients today", value: formatNumber(appointments.length), icon: <UserCheck className="h-5 w-5" /> },
        { label: "Completed", value: formatNumber(appointments.filter((a) => ["finished", "waiting"].includes(a.status)).length), tone: "success" },
        { label: "Awaiting consent", value: formatNumber(kpis.plansAwaitingConsent.total), tone: "warning", icon: <ClipboardList className="h-5 w-5" /> },
        { label: "Lab cases due", value: formatNumber(dueLabCases.length), tone: "danger", icon: <FlaskConical className="h-5 w-5" /> },
      ]}
    >
      {nextPatient ? (
        <Card className="flex-row flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50/50 px-6 py-5">
          <div className="min-w-0">
            <span className="od-label">Up next</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="text-[20px] font-extrabold text-ink">{nextPatient.patientName}</span>
              <Badge tone={toneFor(nextPatient.status)}>{nextPatient.treatment}</Badge>
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">
              {nextPatient.start} – {nextPatient.end} · {nextPatient.room}
              {nextPatient.note ? ` · ${nextPatient.note}` : ""}
            </p>
          </div>
          <Button
            size="lg"
            leftIcon={<Play className="h-4 w-4" />}
            onClick={() => navigate(`/patients/${nextPatient.patientId}`)}
          >
            Open chart
          </Button>
        </Card>
      ) : null}

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="My list today"
            subtitle={`${appointments.length} appointment(s)`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>
                Full schedule
              </Button>
            }
          />
          <CardBody className="pt-1">
            <AppointmentList
              appointments={appointments}
              onSelect={(item) => navigate(`/patients/${item.patientId}`)}
              renderAction={(item) => (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => navigate(`/patients/${item.patientId}`)}
                >
                  Chart
                </Button>
              )}
              emptyTitle="No patients booked"
              emptyDescription="Your chair is clear for today."
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Production vs target" subtitle="This working week" />
          <CardBody className="pt-3">
            <GroupedBarChart
              data={productionSeries}
              xKey="day"
              height={230}
              series={[
                { key: "production", label: "Production", color: "#4B66E9" },
                { key: "target", label: "Target", color: "#CBD5E1" },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Case mix" subtitle="Procedures this month" />
          <CardBody className="pt-4">
            <HorizontalBars data={caseMix} />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Lab cases"
            subtitle={`${dueLabCases.length} case(s) in flight`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/lab-cases")}>
                All cases
              </Button>
            }
          />
          <CardBody className="pt-2">
            {dueLabCases.length === 0 ? (
              <EmptyState title="No open lab work" description="Every case has been fitted." className="py-10" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {dueLabCases.map((item) => {
                  const stage = LAB_CASE_STAGES.find((entry) => entry.value === item.stage);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink">
                          {item.type} · {item.patientName}
                        </span>
                        <span className="block truncate text-[12px] text-ink-soft">
                          {item.teeth.length ? `Teeth ${formatTeeth(item.teeth)} · ` : ""}
                          {item.labName} · due {formatDate(item.dueAt, "d MMM")}
                        </span>
                      </span>
                      <Badge tone={stage?.tone ?? "neutral"}>{stage?.label ?? item.stage}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
