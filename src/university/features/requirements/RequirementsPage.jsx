import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AlertTriangle, Target, TrendingUp, Users } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { ROLES } from "@/auth/roles";
import { uni } from "@/config/paths";
import { DEPARTMENTS } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { SearchInput } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/EmptyState";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { PageHeader, Toolbar, StatCard, StatGrid } from "@/components/shared";
import { ProgressRing, RequirementBar } from "@/university/components";
import StudentRequirements from "./StudentRequirements";

/**
 * Requirements.
 *
 * The rotation quota, per student, per department. A supervisor or admin sees
 * the cohort grid and can spot the department where the whole group is short.
 *
 * A student is asking a different question — "what have I still got to do, in
 * which rotation, and how long have I got" — so that role gets its own screen
 * (`StudentRequirements`) rather than a filtered copy of the cohort view.
 */
export default function RequirementsPage() {
  const { role } = useOutletContext() ?? {};

  /* Split before any hook runs so neither branch carries the other's state. */
  if (role === ROLES.UNI_STUDENT) return <StudentRequirements />;
  return <CohortRequirements />;
}

/* -------------------------------------------------------- the cohort grid */

function CohortRequirements() {
  const { user, role, campus } = useOutletContext() ?? {};
  const navigate = useNavigate();

  const isSupervisor = role === ROLES.UNI_SUPERVISOR;

  const scope = useMemo(
    () => (isSupervisor ? { supervisorId: user?.staffId ?? "all" } : {}),
    [isSupervisor, user?.staffId]
  );

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");

  const { data: rows = [], loading } = useAsync(
    () => universityService.getRequirements(scope),
    [scope],
    []
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle && !`${row.studentName} ${row.group}`.toLowerCase().includes(needle)) return false;
      if (department !== "all" && !row.requirements.some((entry) => entry.department === department)) {
        return false;
      }
      return true;
    });
  }, [rows, query, department]);

  /** Cohort-wide totals, so a department that is short shows up immediately. */
  const cohortByDepartment = useMemo(() => {
    const totals = new Map();
    rows.forEach((row) => {
      row.requirements.forEach((entry) => {
        const current = totals.get(entry.department) ?? { required: 0, completed: 0 };
        totals.set(entry.department, {
          required: current.required + entry.required,
          completed: current.completed + entry.completed,
        });
      });
    });
    return DEPARTMENTS.filter((entry) => totals.has(entry.key)).map((entry) => ({
      department: entry.key,
      ...totals.get(entry.key),
    }));
  }, [rows]);

  const averageProgress = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length)
    : 0;

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Requirements"
        description={`Quota completion across the cohort${campus?.term ? ` · ${campus.term}` : ""}.`}
      />

      <StatGrid cols={4}>
        <StatCard
          label="Students" value={rows.length}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Average progress" value={`${averageProgress}%`} tone="success"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Quota cleared" value={rows.filter((row) => row.progress >= 100).length}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="Below 40%" value={rows.filter((row) => row.progress < 40).length} tone="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </StatGrid>

      <Card>
        <CardHeader title="Cohort quota by rotation" subtitle="Where the whole group is short" />
        <CardBody className="pt-3">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {cohortByDepartment.map((entry) => (
              <RequirementBar key={entry.department} {...entry} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Student or group…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <MiniSelect value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="all">All rotations</option>
            {DEPARTMENTS.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.label}
              </option>
            ))}
          </MiniSelect>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No requirement sheets"
          description="Nothing matches those filters."
          className="od-card py-16"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((row) => (
            <Card key={row.studentId}>
              <CardHeader
                title={row.studentName}
                subtitle={`${row.group} · average score ${row.averageScore ?? "—"}`}
                action={
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate(uni.student(row.studentId))}
                  >
                    Open record
                  </Button>
                }
              />
              <CardBody className="flex items-center gap-6 pt-2">
                <ProgressRing
                  value={row.progress}
                  size={100}
                  sublabel="of quota"
                  tone={row.progress >= 60 ? "success" : row.progress >= 30 ? "brand" : "danger"}
                />
                <div className="min-w-0 flex-1 space-y-3.5">
                  {row.requirements
                    .filter((entry) => department === "all" || entry.department === department)
                    .map((entry) => (
                      <RequirementBar key={entry.department} {...entry} />
                    ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
