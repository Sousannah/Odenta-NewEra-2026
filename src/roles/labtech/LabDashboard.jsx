import { useNavigate, useOutletContext } from "react-router-dom";
import { AlertOctagon, Clock, FlaskConical, PackageCheck, Timer } from "lucide-react";
import { cn } from "@/lib/cn";
import { differenceInCalendarDays } from "date-fns";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { analyticsService, labService } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { LAB_CASE_STAGES } from "@/config/dentalStandards";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardShell } from "@/components/shared";
import { HorizontalBars } from "@/components/charts";
import { formatTeeth } from "@/components/dental";

const nextStage = (stage) => {
  const order = ["impression", "sent", "in_production", "try_in", "returned", "fitted"];
  const index = order.indexOf(stage);
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
};

/**
 * Lab technician.
 *
 * A queue view: what is on the bench, what is overdue, what needs remaking,
 * and how long cases are taking end to end.
 */
export default function LabDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading } = useAsync(() => analyticsService.getDashboard(ROLES.LAB_TECH), []);
  const { data: cases = [], refetch } = useAsync(() => labService.getLabCases(), [], []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-12 gap-5 p-6">
        <CardSkeleton className="col-span-12 xl:col-span-7" />
        <CardSkeleton className="col-span-12 xl:col-span-5" />
      </div>
    );
  }

  const { kpis, byType } = data;
  const open = cases.filter((item) => !["fitted"].includes(item.stage));
  const overdue = open.filter((item) => differenceInCalendarDays(new Date(item.dueAt), new Date()) < 0);
  const remakes = cases.filter((item) => item.stage === "remake");

  const advance = async (item) => {
    const target = nextStage(item.stage);
    if (!target) return;
    await labService.advanceLabCase(item.id, target);
    const label = LAB_CASE_STAGES.find((entry) => entry.value === target)?.label ?? target;
    toast.success(`${item.id} moved to ${label}`);
    refetch();
  };

  return (
    <DashboardShell
      user={user}
      role={ROLES.LAB_TECH}
      subtitle="Prosthetic work orders"
      actions={
        <Button leftIcon={<FlaskConical className="h-4 w-4" />} onClick={() => navigate("/lab-cases")}>
          Case queue
        </Button>
      }
      kpis={[
        { label: "Open cases", value: formatNumber(open.length), icon: <FlaskConical className="h-5 w-5" /> },
        { label: "Overdue", value: formatNumber(overdue.length), tone: "danger", icon: <Clock className="h-5 w-5" /> },
        { label: "Remakes", value: formatNumber(remakes.length), tone: "warning", icon: <AlertOctagon className="h-5 w-5" /> },
        { label: "Avg turnaround", value: `${kpis.turnaroundDays.total} days`, change: kpis.turnaroundDays.change, icon: <Timer className="h-5 w-5" /> },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="On the bench"
            subtitle={`${open.length} case(s) in progress`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/lab-cases")}>
                Full queue
              </Button>
            }
          />
          <CardBody className="pt-2">
            {open.length === 0 ? (
              <EmptyState title="Bench is clear" description="Every case has been fitted." className="py-12" />
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((item) => {
                  const stage = LAB_CASE_STAGES.find((entry) => entry.value === item.stage);
                  const days = differenceInCalendarDays(new Date(item.dueAt), new Date());
                  const late = days < 0;
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5",
                        late ? "border-danger/30 bg-danger-soft" : "border-slate-200"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-bold text-ink">{item.type}</span>
                          <Badge tone={stage?.tone ?? "neutral"}>{stage?.label ?? item.stage}</Badge>
                          {item.priority === "urgent" ? <Badge tone="danger">Urgent</Badge> : null}
                        </div>
                        <p className="mt-1 truncate text-[12px] text-ink-soft">
                          {item.id} · {item.patientName}
                          {item.teeth.length ? ` · teeth ${formatTeeth(item.teeth)}` : ""}
                          {item.shade ? ` · shade ${item.shade}` : ""}
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-soft">
                          {item.material} ·{" "}
                          <span className={cn("font-bold", late ? "text-danger" : "text-ink")}>
                            {late ? `${Math.abs(days)} day(s) overdue` : `due in ${days} day(s)`}
                          </span>{" "}
                          ({formatDate(item.dueAt, "d MMM")})
                        </p>
                      </div>

                      {nextStage(item.stage) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<PackageCheck className="h-3.5 w-3.5" />}
                          onClick={() => advance(item)}
                        >
                          Advance
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title="Case mix" subtitle="Volume by appliance type" />
          <CardBody className="pt-4">
            <HorizontalBars data={byType} color="#E45689" />
          </CardBody>
        </Card>

        {remakes.length ? (
          <Card className="col-span-12">
            <CardHeader
              title="Remakes"
              subtitle="Root cause matters — record why before starting again"
            />
            <CardBody className="grid gap-3 pt-3 sm:grid-cols-2">
              {remakes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-ink">
                      {item.type} · {item.patientName}
                    </span>
                    <Badge tone="danger">Remake</Badge>
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-[#8C1D3F]">{item.notes}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}
      </div>
    </DashboardShell>
  );
}
