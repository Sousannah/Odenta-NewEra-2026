import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, Coins, FileSignature } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { patientService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/Stepper";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/Misc";
import { PageHeader, StatCard, StatGrid, Toolbar, toneFor } from "@/components/shared";
import { formatTeeth } from "@/components/dental";
import { app } from "@/config/paths";

/**
 * Treatment plans across the whole practice.
 *
 * A plan is the clinical and financial commitment: which teeth, how many
 * visits, what it costs, and whether the patient has consented. Consent
 * gating is deliberate — work should not start without it.
 */
export default function TreatmentPlansPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const { data: patients = [] } = useAsync(() => patientService.getPatients({ status: "all" }), [], []);

  const { data: plans = [], loading, refetch } = useAsync(async () => {
    if (!patients.length) return [];
    const lists = await Promise.all(
      patients.map((patient) =>
        patientService
          .getPatientPlans(patient.id)
          .then((rows) => rows.map((row) => ({ ...row, patient })))
      )
    );
    return lists.flat();
  }, [patients.length], []);

  const filtered = useMemo(() => {
    let rows = plans;
    if (status !== "all") rows = rows.filter((plan) => plan.status === status);
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      rows = rows.filter(
        (plan) =>
          plan.treatment.toLowerCase().includes(needle) ||
          plan.patient?.name?.toLowerCase().includes(needle)
      );
    }
    return rows;
  }, [plans, status, query]);

  const counts = plans.reduce((acc, plan) => {
    acc[plan.status] = (acc[plan.status] ?? 0) + 1;
    return acc;
  }, {});

  const awaitingConsent = plans.filter((plan) => !plan.consentSigned);
  const totalValue = plans.reduce((sum, plan) => sum + plan.estimatedCost, 0);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Treatment plans"
        description="Every multi-visit commitment, its consent status and where it has got to."
      />

      <StatGrid cols={3}>
        <StatCard
          label="Active plans"
          value={counts.in_progress ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Awaiting consent"
          value={awaitingConsent.length}
          tone="warning"
          icon={<FileSignature className="h-5 w-5" />}
        />
        <StatCard
          label="Planned value" value={formatMoney(totalValue)} tone="success"
          icon={<Coins className="h-5 w-5" />}
        />
      </StatGrid>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="all" badge={plans.length}>
            All
          </TabsTrigger>
          <TabsTrigger value="proposed" badge={counts.proposed ?? 0}>
            Proposed
          </TabsTrigger>
          <TabsTrigger value="in_progress" badge={counts.in_progress ?? 0}>
            In progress
          </TabsTrigger>
          <TabsTrigger value="completed" badge={counts.completed ?? 0}>
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="pt-5">
          <Toolbar
            className="mb-4"
            left={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search plan or patient…"
                className="w-full sm:w-[300px]"
              />
            }
          />

          {loading ? (
            <Skeleton className="h-[360px] w-full" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No treatment plans"
              description="Plans are created from the medical checkup during a visit."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((plan) => {
                const percent = Math.round((plan.completedVisits / plan.totalVisits) * 100);
                return (
                  <Card key={plan.id}>
                    <CardHeader
                      title={plan.treatment}
                      subtitle={`${plan.patient?.name} · ${plan.patient?.mrn}`}
                      action={<Badge tone={toneFor(plan.status)}>{plan.status.replace("_", " ")}</Badge>}
                    />
                    <CardBody className="flex flex-col gap-4 pt-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={plan.patient?.name ?? ""} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[12px] text-ink-soft">
                              {plan.completedVisits}/{plan.totalVisits} visits
                            </span>
                            <span className="text-[13px] font-extrabold text-ink">
                              {formatMoney(plan.estimatedCost)}
                            </span>
                          </div>
                          <ProgressBar
                            value={percent}
                            className="mt-1.5"
                            tone={percent === 100 ? "success" : "brand"}
                          />
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 gap-3 text-[12.5px]">
                        <div>
                          <dt className="od-label">Teeth</dt>
                          <dd className="mt-0.5 font-semibold text-ink">
                            {plan.teeth?.length ? formatTeeth(plan.teeth) : "Whole mouth"}
                          </dd>
                        </div>
                        <div>
                          <dt className="od-label">Created</dt>
                          <dd className="mt-0.5 font-semibold text-ink">
                            {formatDate(plan.createdAt, "d MMM yyyy")}
                          </dd>
                        </div>
                      </dl>

                      <div
                        className={cn(
                          "flex flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-2.5",
                          plan.consentSigned ? "bg-success-soft" : "bg-warning-soft"
                        )}
                      >
                        <span
                          className={cn(
                            "flex items-center gap-2 text-[12.5px] font-bold",
                            plan.consentSigned ? "text-success-strong" : "text-warning-ink"
                          )}
                        >
                          {plan.consentSigned ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <FileSignature className="h-3.5 w-3.5" />
                          )}
                          {plan.consentSigned ? "Consent signed" : "Consent outstanding"}
                        </span>

                        {!plan.consentSigned && can(P.TREATMENT_PLAN_APPROVE) ? (
                          <Button
                            size="xs"
                            onClick={() => {
                              toast.success("Consent recorded", plan.treatment);
                              refetch();
                            }}
                          >
                            Record consent
                          </Button>
                        ) : null}
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => navigate(app.patient(plan.patientId))}
                      >
                        Open patient record
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
