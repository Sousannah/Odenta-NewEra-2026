import { useNavigate, useOutletContext } from "react-router-dom";
import { ClipboardList, FlaskConical, Play, Stethoscope, UserCheck } from "lucide-react";
import { useAsync } from "@/hooks";
import { clinicalService } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { LAB_CASE_STAGES } from "@/config/dentalStandards";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardShell, AppointmentList, toneFor } from "@/components/shared";
import { GroupedBarChart, HorizontalBars } from "@/components/charts";
import { formatTeeth } from "@/components/dental";
import { app } from "@/config/paths";

/**
 * Dentist.
 *
 * The chair-side view: who is next, what is planned for them, what still needs
 * consent, which lab work is due, and what the chair produced this week.
 *
 * ## One request, not three
 *
 * This screen used to make three calls and do the arithmetic in the browser: a
 * dashboard payload, the day's appointments, and *every lab case in the
 * practice* — filtered client-side to this dentist's open ones. The third grew
 * with the practice and was downloaded in full to render a count.
 *
 * It is now one call to `/dentist/board`. The server reads one visit lane, one
 * lab lane and one indexed plan query, folds them, and returns the tiles and
 * the lists together. Nothing on this screen is derived from a list the client
 * had to download first, which is why it costs the same in year five as in
 * month one.
 *
 * The tile numbers come from the server too, rather than from `.filter().length`
 * over the lists below them. That is not only cheaper — it is what stops the
 * tile and the list disagreeing when one of them is paged or truncated.
 */
export default function DentistDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();

  const { data: board, loading, error } = useAsync(() => clinicalService.getDentistBoard(), []);

  if (loading) return <OdentaLoaderPanel />;

  /**
   * A board that failed to load says so.
   *
   * The version this replaced rendered `<OdentaLoaderPanel />` forever on an
   * error, because it only ever checked `loading || !data` — so a 403 from a
   * login with no clinical identity looked identical to a slow network.
   */
  if (error || !board) {
    return (
      <div className="p-6">
        <EmptyState
          title="Could not load your board"
          description={error?.message ?? "Try again in a moment."}
          className="py-16"
        />
      </div>
    );
  }

  const { kpis, appointments = [], labCases = [], nextPatient, productionSeries, caseMix } = board;

  return (
    <DashboardShell
      user={user}
      role={ROLES.DENTIST}
      subtitle={user?.title ?? "Clinical"}
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<ClipboardList className="h-4 w-4" />}
            onClick={() => navigate(app.treatmentPlans)}
          >
            Treatment plans
          </Button>
          <Button leftIcon={<Stethoscope className="h-4 w-4" />} onClick={() => navigate(app.schedule)}>
            My chair
          </Button>
        </>
      }
      kpis={[
        {
          label: "Patients today",
          value: formatNumber(kpis.todayPatients.total),
          icon: <UserCheck className="h-5 w-5" />,
        },
        { label: "Completed", value: formatNumber(kpis.completed.total), tone: "success" },
        {
          label: "Awaiting consent",
          value: formatNumber(kpis.plansAwaitingConsent.total),
          tone: "warning",
          icon: <ClipboardList className="h-5 w-5" />,
        },
        {
          label: "Lab cases due",
          value: formatNumber(kpis.labCasesDue.total),
          tone: "danger",
          icon: <FlaskConical className="h-5 w-5" />,
        },
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
            onClick={() => navigate(app.patient(nextPatient.patientId))}
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
              <Button variant="link" size="sm" onClick={() => navigate(app.schedule)}>
                Full schedule
              </Button>
            }
          />
          <CardBody className="pt-1">
            <AppointmentList
              appointments={appointments}
              onSelect={(item) => navigate(app.patient(item.patientId))}
              renderAction={(item) => (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => navigate(app.patient(item.patientId))}
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
                { key: "production", label: "Production", color: "#4B66E9", format: "money" },
                { key: "target", label: "Target", color: "#CBD5E1", format: "money" },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Case mix" subtitle="Procedures this month" />
          <CardBody className="pt-4">
            {caseMix?.length ? (
              <HorizontalBars data={caseMix} />
            ) : (
              <EmptyState
                title="Nothing delivered yet this month"
                description="The mix builds as treatment is completed."
                className="py-8"
              />
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Lab cases"
            subtitle={`${labCases.length} case(s) in flight`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(app.labCases)}>
                All cases
              </Button>
            }
          />
          <CardBody className="pt-2">
            {labCases.length === 0 ? (
              <EmptyState
                title="No open lab work"
                description="Every case has been fitted."
                className="py-10"
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {labCases.map((item) => {
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
                          {item.teeth?.length ? `Teeth ${formatTeeth(item.teeth)} · ` : ""}
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
