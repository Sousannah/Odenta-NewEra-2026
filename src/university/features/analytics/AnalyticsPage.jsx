import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { BadgeCheck, Clock3, Percent, RotateCcw, Star, UserSquare2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatNumber } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { REVIEW_STATUS, departmentMeta } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import { DonutChart, GroupedBarChart, HorizontalBars } from "@/components/charts";
import { Avatar } from "@/components/ui/Avatar";
import { RequirementBar } from "@/university/components";

/**
 * Analytics.
 *
 * One screen whose content follows the reader's role: a student sees their own
 * throughput, a supervisor sees their cohort's, an admin sees the clinic's.
 * The permission already limits what the service returns — this only chooses
 * which panels are worth showing.
 */
export default function AnalyticsPage() {
  const { user, role } = useOutletContext() ?? {};
  const { can } = useAuth();

  /* Which extra panels are worth drawing follows the permission, not the
     role: an admin holds REVIEW_VIEW_ALL and wants the same cohort read a
     supervisor does, and both want it computed the same way. */
  const seesCohort = can(UP.REVIEW_VIEW_ALL);
  const seesDesk = can(UP.UNI_APPOINTMENT_VIEW);

  const { data: dashboard, loading } = useAsync(
    () => universityService.getDashboard(role),
    [role]
  );

  const scope = useMemo(() => {
    if (role === ROLES.UNI_STUDENT) return { studentId: user?.staffId ?? "all" };
    if (role === ROLES.UNI_SUPERVISOR) return { supervisorId: user?.staffId ?? "all" };
    return {};
  }, [role, user?.staffId]);

  /**
   * The Dean reads the whole campus, and that changes what this screen may ask
   * for.
   *
   * A student's caseload is a few dozen rows, so fetching it and folding it in
   * the browser is honest and cheap. A supervisor's is a few hundred. The
   * Dean's is *every case and every review the campus has ever recorded* — the
   * one shape where "fetch the list and count it" stops being a convenience and
   * becomes the largest read in the product, re-issued on every page open.
   *
   * So for the Dean those two fetches do not happen at all. Everything the
   * board already folds server-side is read from `dashboard`, and the panels
   * that genuinely need individual rows — who the patients are, which
   * conditions recur, which procedures were signed off — are not drawn here.
   * Those are the rotation report's job, and it is folded server-side too.
   */
  const campusWide = role === ROLES.UNI_ADMIN;

  const { data: reviews = [] } = useAsync(
    () => (campusWide ? Promise.resolve([]) : universityService.getReviews(scope)),
    [scope, campusWide],
    []
  );
  const { data: cases = [] } = useAsync(
    () => (campusWide ? Promise.resolve([]) : universityService.getCases(scope)),
    [scope, campusWide],
    []
  );
  const { data: requirements = [] } = useAsync(
    () => universityService.getRequirements(scope),
    [scope],
    []
  );

  const accepted = reviews.filter((item) => item.status === REVIEW_STATUS.ACCEPTED);
  const returned = reviews.filter((item) => item.status === REVIEW_STATUS.RETURNED);
  const pending = reviews.filter((item) => item.status === REVIEW_STATUS.PENDING);

  const acceptanceRate = reviews.length
    ? Math.round((accepted.length / reviews.filter((item) => item.decidedAt).length || 0) * 100)
    : 0;

  const scored = accepted.filter((item) => item.score != null);
  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length)
    : null;

  /** Where a student loses marks — the rotations with the most returns. */
  const returnsByDepartment = useMemo(() => {
    const counts = returned.reduce((acc, item) => {
      acc[item.department] = (acc[item.department] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([key, value]) => ({ name: departmentMeta(key).short, value }))
      .sort((a, b) => b.value - a.value);
  }, [returned]);

  const caseMix = useMemo(() => {
    const counts = cases.reduce((acc, item) => {
      acc[item.department] = (acc[item.department] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([key, value]) => ({
      name: departmentMeta(key).short,
      value,
    }));
  }, [cases]);

  /**
   * Who the caseload actually is.
   *
   * A student's cohort of patients is small enough that its shape matters: a
   * term spent entirely on healthy 20-year-olds is a different education from
   * one spent on medically complex retirees, and the rotation report asks.
   */
  const ageBands = useMemo(() => {
    const bands = [
      { name: "0–17", test: (age) => age < 18 },
      { name: "18–29", test: (age) => age < 30 },
      { name: "30–44", test: (age) => age < 45 },
      { name: "45–59", test: (age) => age < 60 },
      { name: "60+", test: () => true },
    ];
    return bands
      .map((band, index) => ({
        name: band.name,
        value: cases.filter(
          (item) => band.test(item.age) && !bands.slice(0, index).some((prior) => prior.test(item.age))
        ).length,
      }))
      .filter((entry) => entry.value > 0);
  }, [cases]);

  const genderMix = useMemo(() => {
    const counts = cases.reduce((acc, item) => {
      const key = item.gender ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([key, value]) => ({
      name: key.replace(/^./, (char) => char.toUpperCase()),
      value,
    }));
  }, [cases]);

  /** The top five conditions a student has had to plan around this term. */
  const chronicDiseases = useMemo(() => {
    const counts = cases.reduce((acc, item) => {
      (item.medicalInfo?.chronicDiseases ?? []).forEach((disease) => {
        acc[disease] = (acc[disease] ?? 0) + 1;
      });
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [cases]);

  /** Submissions grouped by the procedure they were signed off against. */
  const procedureMix = useMemo(() => {
    const counts = reviews.reduce((acc, item) => {
      const key = String(item.procedureType ?? "Unknown").split(" — ")[0];
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [reviews]);

  /* -------------------------------------------------- the faculty read */

  /** Outcome split. Pending is a third slice, not a missing one — a queue that
      is not moving is exactly what this chart should make obvious. */
  const outcomeMix = useMemo(
    () =>
      [
        { name: "Accepted", value: accepted.length },
        { name: "Returned", value: returned.length },
        {
          name: "Rejected",
          value: reviews.filter((item) => item.status === REVIEW_STATUS.REJECTED).length,
        },
        { name: "Pending", value: pending.length },
      ].filter((entry) => entry.value > 0),
    [accepted.length, returned.length, pending.length, reviews]
  );

  /** Procedure quality out of five, as faculty record it on a decision. */
  const rated = useMemo(
    () => reviews.filter((item) => item.procedureQuality != null),
    [reviews]
  );
  const averageQuality = rated.length
    ? Math.round((rated.reduce((sum, item) => sum + item.procedureQuality, 0) / rated.length) * 10) / 10
    : null;

  /** Who is producing accepted work, ranked. Volume alone rewards a student who
      submits constantly and is signed off rarely, so it ranks on acceptances. */
  const topStudents = useMemo(() => {
    const byStudent = reviews.reduce((acc, item) => {
      if (!item.studentId) return acc;
      const entry = (acc[item.studentId] = acc[item.studentId] ?? {
        id: item.studentId,
        name: item.studentName,
        submitted: 0,
        accepted: 0,
        quality: [],
      });
      entry.submitted += 1;
      if (item.status === REVIEW_STATUS.ACCEPTED) entry.accepted += 1;
      if (item.procedureQuality != null) entry.quality.push(item.procedureQuality);
      return acc;
    }, {});
    return Object.values(byStudent)
      .map((entry) => ({
        ...entry,
        averageQuality: entry.quality.length
          ? entry.quality.reduce((sum, value) => sum + value, 0) / entry.quality.length
          : null,
      }))
      .sort((a, b) => b.accepted - a.accepted || b.submitted - a.submitted)
      .slice(0, 5);
  }, [reviews]);

  /* --------------------------------------------------- the desk's read */

  /* The whole appointment book, for the two desk panels. Skipped for the Dean
     for the same reason as above — the board already carries today's numbers,
     and the book is the other table that grows without bound. */
  const { data: appointments = [] } = useAsync(
    () => (seesDesk && !campusWide ? universityService.getAppointments({}) : Promise.resolve([])),
    [seesDesk, campusWide],
    []
  );

  /** Which weekdays the clinic is actually busy — the number a desk uses when
      it is asked to open another session. */
  const byWeekday = useMemo(() => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    cases.forEach((item) => {
      const at = new Date(item.openedAt);
      if (!Number.isNaN(at.getTime())) counts[at.getDay()] += 1;
    });
    return names
      .map((name, index) => ({ name, value: counts[index] }))
      .filter((entry) => entry.value > 0);
  }, [cases]);

  const allocationMix = useMemo(() => {
    const assigned = cases.filter((item) => item.studentId).length;
    return [
      { name: "Allocated", value: assigned },
      { name: "Waiting for a student", value: cases.length - assigned },
    ].filter((entry) => entry.value > 0);
  }, [cases]);

  /**
   * How complete the registry is.
   *
   * The desk types these in and nobody chases them afterwards, so a phone
   * number missing on a fifth of the file is invisible until somebody needs to
   * ring a patient. Counted per field rather than per record for that reason.
   */
  const completeness = useMemo(() => {
    const fields = [
      { name: "Phone", get: (item) => item.phone },
      { name: "Address", get: (item) => item.address },
      { name: "Occupation", get: (item) => item.occupation },
      { name: "Chief complaint", get: (item) => item.chiefComplaint },
      { name: "Consent", get: (item) => (item.consentSigned ? "yes" : "") },
      { name: "Card issued", get: (item) => item.cardNumber },
    ];
    return fields.map((field) => ({
      name: field.name,
      value: cases.length
        ? Math.round((cases.filter((item) => field.get(item)).length / cases.length) * 100)
        : 0,
    }));
  }, [cases]);

  const appointmentStatusMix = useMemo(() => {
    const counts = appointments.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([key, value]) => ({
      name: key.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()),
      value,
    }));
  }, [appointments]);

  const busiestHours = useMemo(() => {
    const counts = appointments.reduce((acc, item) => {
      if (!item.time) return acc;
      acc[item.time] = (acc[item.time] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  /** Cohort quota totals — meaningless for a single student, so only shown above. */
  const cohortQuota = useMemo(() => {
    const totals = new Map();
    requirements.forEach((row) => {
      row.requirements.forEach((entry) => {
        const current = totals.get(entry.department) ?? { required: 0, completed: 0 };
        totals.set(entry.department, {
          required: current.required + entry.required,
          completed: current.completed + entry.completed,
        });
      });
    });
    return [...totals.entries()].map(([department, value]) => ({ department, ...value }));
  }, [requirements]);

  /* ------------------------------------------------- the campus-wide read */

  /**
   * The Dean's numbers, off the board rather than off a list.
   *
   * Each of these is the same quantity the panels above derive from rows — the
   * difference is only where the folding happened. The server keeps these as
   * counters that the write path moves, so they cost a point read apiece and do
   * not grow with the campus. See `src/domain/deanBoard.js` in the API.
   */
  const board = campusWide ? dashboard?.counts : null;

  const boardSubmitted = board
    ? board.pendingReviews + board.acceptedReviews + board.returnedReviews + board.rejectedReviews
    : null;
  const boardDecided = board
    ? board.acceptedReviews + board.returnedReviews + board.rejectedReviews
    : null;
  const boardAcceptance = boardDecided ? Math.round((board.acceptedReviews / boardDecided) * 100) : 0;

  /** Cases per rotation, already folded by a GROUP BY on the server. */
  const boardCaseMix = (dashboard?.departmentLoad ?? []).filter((row) => row.value > 0);

  const boardOutcomeMix = board
    ? [
        { name: "Accepted", value: board.acceptedReviews },
        { name: "Returned", value: board.returnedReviews },
        { name: "Rejected", value: board.rejectedReviews },
        { name: "Pending", value: board.pendingReviews },
      ].filter((entry) => entry.value > 0)
    : [];

  const boardAllocationMix = board
    ? [
        { name: "Allocated", value: board.cases - board.unassigned },
        { name: "Waiting for a student", value: board.unassigned },
      ].filter((entry) => entry.value > 0)
    : [];

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  const isStudent = role === ROLES.UNI_STUDENT;

  /**
   * Panels that need the rows themselves.
   *
   * Shown for a reader whose scope is small enough to fetch — a student's own
   * caseload, a supervisor's supervisees — and not for the Dean, where drawing
   * them would mean reading the whole campus. They are not simply hidden: the
   * card at the end of the grid says where the campus-wide equivalent lives.
   */
  const rowLevel = !campusWide;

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Analytics"
        description={
          isStudent
            ? "Your throughput this term: what you submitted, what was accepted, and where marks are being lost."
            : "Throughput across the teaching clinic."
        }
      />

      <StatGrid cols={4}>
        <StatCard
          label="Steps submitted"
          value={formatNumber(campusWide ? boardSubmitted : reviews.length)}
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Acceptance rate" value={`${campusWide ? boardAcceptance : Number.isFinite(acceptanceRate) ? acceptanceRate : 0}%`} tone="success"
          icon={<Percent className="h-5 w-5" />}
        />
        <StatCard
          label="Awaiting sign-off"
          value={formatNumber(campusWide ? board.pendingReviews : pending.length)}
          tone="warning"
          icon={<Clock3 className="h-5 w-5" />}
        />
        {/**
         * The Dean's fourth tile is turnaround, not score.
         *
         * A mean score across a whole faculty is a number nobody can act on —
         * it moves by a point a term and says nothing about what to do on
         * Monday. How long a student waits for a decision is the number a
         * rotation lead is actually held to, and it is the one a Dean can
         * change by moving people.
         */}
        {campusWide ? (
          <StatCard
            label="Time to a decision"
            value={
              board.averageTurnaroundHours == null ? "—" : `${board.averageTurnaroundHours}h`
            }
            icon={<Clock3 className="h-5 w-5" />}
          />
        ) : (
          <StatCard
            label="Average score"
            value={averageScore == null ? "—" : `${averageScore}/100`}
            icon={<UserSquare2 className="h-5 w-5" />}
          />
        )}
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        {dashboard?.submissionSeries ? (
          <Card className="col-span-12 xl:col-span-7">
            <CardHeader
              title="Submissions this week"
              subtitle="Submitted, accepted and returned per clinic day"
            />
            <CardBody className="pt-3">
              <GroupedBarChart
                data={dashboard.submissionSeries}
                xKey="day"
                height={250}
                series={[
                  { key: "submitted", label: "Submitted", color: "#0077B6" },
                  { key: "accepted", label: "Accepted", color: "#20B2AA" },
                  { key: "returned", label: "Returned", color: "#F5A623" },
                ]}
              />
            </CardBody>
          </Card>
        ) : null}

        {dashboard?.throughputSeries ? (
          <Card className="col-span-12 xl:col-span-7">
            <CardHeader title="Case throughput" subtitle="Opened against completed by month" />
            <CardBody className="pt-3">
              <GroupedBarChart
                data={dashboard.throughputSeries}
                xKey="month"
                height={250}
                series={[
                  { key: "cases", label: "Opened", color: "#0077B6" },
                  { key: "completed", label: "Completed", color: "#20B2AA" },
                ]}
              />
            </CardBody>
          </Card>
        ) : null}

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Caseload by rotation" subtitle="Where the chair time goes" />
          <CardBody className="pt-3">
            {(campusWide ? boardCaseMix : caseMix).length ? (
              <DonutChart
                data={campusWide ? boardCaseMix : caseMix}
                total={campusWide ? board.cases : cases.length}
                label="Cases"
                valueFormatter={formatNumber}
              />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">No cases yet.</p>
            )}
          </CardBody>
        </Card>

        {/**
         * Everything from here to the faculty read needs the rows themselves.
         *
         * Drawn for a reader whose scope is small enough to fetch. For the Dean
         * it would mean reading every case and every review in the campus to
         * render five charts, so those are replaced by one card at the end
         * pointing at the rotation report — which answers the same questions
         * and is folded server-side.
         */}
        {rowLevel ? (
          <>
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Returns by rotation"
            subtitle="Where work is being sent back"
            action={
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-warning-ink">
                <RotateCcw className="h-3.5 w-3.5" />
                {returned.length} total
              </span>
            }
          />
          <CardBody className="pt-4">
            {returnsByDepartment.length ? (
              <HorizontalBars data={returnsByDepartment} color="#F5A623" />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">
                Nothing has been returned for correction.
              </p>
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------ who the caseload is */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Patient age distribution"
            subtitle={`${cases.length} patient(s) in scope`}
          />
          <CardBody className="pt-4">
            {ageBands.length ? (
              <HorizontalBars data={ageBands} />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">No patients yet.</p>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Patient gender" subtitle="Across the caseload" />
          <CardBody className="pt-3">
            {genderMix.length ? (
              <DonutChart
                data={genderMix}
                total={cases.length}
                label="Patients"
                valueFormatter={formatNumber}
              />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">No patients yet.</p>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Chronic disease prevalence"
            subtitle="The conditions you have had to plan around"
          />
          <CardBody className="pt-4">
            {chronicDiseases.length ? (
              <HorizontalBars data={chronicDiseases} color="#E4576B" />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">
                No chronic conditions recorded on this caseload.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Submissions by procedure"
            subtitle="What you have actually been signed off on"
          />
          <CardBody className="pt-4">
            {procedureMix.length ? (
              <HorizontalBars data={procedureMix} color="#20B2AA" />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">
                Nothing submitted for review yet.
              </p>
            )}
          </CardBody>
        </Card>
          </>
        ) : null}

        {/* ------------------------------------------------ the faculty read */}
        {seesCohort ? (
          <>
            <Card className="col-span-12 xl:col-span-5">
              <CardHeader
                title="Review outcomes"
                subtitle="Every submission in scope, by what happened to it"
              />
              <CardBody className="pt-3">
                {(campusWide ? boardOutcomeMix : outcomeMix).length ? (
                  <DonutChart
                    data={campusWide ? boardOutcomeMix : outcomeMix}
                    total={campusWide ? boardSubmitted : reviews.length}
                    label="Submissions"
                    valueFormatter={formatNumber}
                  />
                ) : (
                  <p className="py-10 text-center text-[13px] text-ink-soft">
                    Nothing submitted yet.
                  </p>
                )}
              </CardBody>
            </Card>

            {/* Ranked from the submission rows, so it needs them. The Dean's
                campus-wide equivalent is the cohort scoreboard, which is scored
                server-side — see Students, and the rotation report. */}
            {rowLevel ? (
            <Card className="col-span-12 xl:col-span-7">
              <CardHeader
                title="Top performing students"
                subtitle="Ranked on accepted work, not on volume submitted"
                action={
                  averageQuality != null ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-warning-ink">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {averageQuality} average quality
                    </span>
                  ) : null
                }
              />
              <CardBody className="pt-2">
                {topStudents.length === 0 ? (
                  <p className="py-10 text-center text-[13px] text-ink-soft">
                    No student submissions in scope.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {topStudents.map((student, index) => (
                      <li
                        key={student.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12px] font-extrabold text-brand-700">
                          {index + 1}
                        </span>
                        <Avatar name={student.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-ink">
                            {student.name}
                          </span>
                          <span className="block text-[11.5px] text-ink-soft">
                            {student.accepted} accepted of {student.submitted} submitted
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  student.averageQuality != null &&
                                    star <= Math.round(student.averageQuality)
                                    ? "fill-warning text-warning"
                                    : "text-slate-300"
                                )}
                              />
                            ))}
                          </span>
                          <span className="text-[12px] font-bold text-ink">
                            {student.averageQuality == null
                              ? "—"
                              : student.averageQuality.toFixed(1)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
            ) : null}
          </>
        ) : null}

        {/* --------------------------------------------------- the desk's read */}
        {seesDesk ? (
          <>
            <Card className="col-span-12 xl:col-span-5">
              <CardHeader
                title="Allocation status"
                subtitle="Registered against actually being treated"
              />
              <CardBody className="pt-3">
                {(campusWide ? boardAllocationMix : allocationMix).length ? (
                  <DonutChart
                    data={campusWide ? boardAllocationMix : allocationMix}
                    total={campusWide ? board.cases : cases.length}
                    label="Patients"
                    valueFormatter={formatNumber}
                  />
                ) : (
                  <p className="py-10 text-center text-[13px] text-ink-soft">No patients yet.</p>
                )}
              </CardBody>
            </Card>

            {/* The four below are folds over the registry and the appointment
                book — the two other tables that grow with the clinic. Drawn for
                the desk, whose scope is a day or a week; not for the Dean, for
                whom they would mean reading both tables whole. */}
            {rowLevel ? (
              <>
            <Card className="col-span-12 xl:col-span-7">
              <CardHeader
                title="Registrations by weekday"
                subtitle="Which days the screening clinic is busiest"
              />
              <CardBody className="pt-4">
                {byWeekday.length ? (
                  <HorizontalBars data={byWeekday} />
                ) : (
                  <p className="py-10 text-center text-[13px] text-ink-soft">
                    No registrations recorded.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card className="col-span-12 xl:col-span-7">
              <CardHeader
                title="Record completeness"
                subtitle="Share of the registry with each field filled in"
              />
              <CardBody className="pt-4">
                <HorizontalBars
                  data={completeness}
                  color="#20B2AA"
                  valueFormatter={(value) => `${value}%`}
                />
              </CardBody>
            </Card>

            <Card className="col-span-12 xl:col-span-5">
              <CardHeader title="Appointments by status" subtitle="Across the whole book" />
              <CardBody className="pt-3">
                {appointmentStatusMix.length ? (
                  <DonutChart
                    data={appointmentStatusMix}
                    total={appointments.length}
                    label="Visits"
                    valueFormatter={formatNumber}
                  />
                ) : (
                  <p className="py-10 text-center text-[13px] text-ink-soft">Nothing booked.</p>
                )}
              </CardBody>
            </Card>

            <Card className="col-span-12">
              <CardHeader
                title="Busiest hours"
                subtitle="Appointments by start time — where another chair would help"
              />
              <CardBody className="pt-3">
                {busiestHours.length ? (
                  <GroupedBarChart
                    data={busiestHours}
                    xKey="name"
                    height={220}
                    series={[{ key: "value", label: "Appointments", color: "#0077B6" }]}
                  />
                ) : (
                  <p className="py-10 text-center text-[13px] text-ink-soft">Nothing booked.</p>
                )}
              </CardBody>
            </Card>
              </>
            ) : null}
          </>
        ) : null}

        {dashboard?.turnaroundSeries ? (
          <Card className="col-span-12 xl:col-span-7">
            <CardHeader
              title="Review turnaround"
              subtitle="Hours between a submission and a decision"
            />
            <CardBody className="pt-3">
              {/**
               * A bar per day, not an area.
               *
               * `LineAreaChart` is the finance screens' chart — its tooltip
               * formats the point as money, which rendered "$NaN" over a
               * turnaround figure. A day with no decisions also reports `null`
               * here on purpose, and a gap in bars reads as "nobody was in
               * clinic" where a line would join straight through it.
               */}
              <GroupedBarChart
                data={dashboard.turnaroundSeries}
                xKey="day"
                height={220}
                series={[{ key: "hours", label: "Hours", color: "#7C3AED" }]}
              />
            </CardBody>
          </Card>
        ) : null}

        {campusWide ? (
          <Card className="col-span-12">
            <CardHeader
              title="Reading the campus in detail"
              subtitle="Where the per-record analysis lives"
            />
            <CardBody className="pt-2">
              <p className="max-w-3xl text-[13px] leading-relaxed text-ink-muted">
                The charts above are folded server-side, so this screen costs the
                same whether the faculty has fifty patients or fifty thousand.
                The per-record reads — who the patients are, which conditions
                recur, which procedures are being signed off, and how each
                student is scored — are not drawn here, because answering them
                across a whole campus means reading every record to render a
                chart. They live on{" "}
                <span className="font-semibold text-ink">Reports</span>, which is
                folded the same way, and on a student&rsquo;s own scorecard under{" "}
                <span className="font-semibold text-ink">Students</span>.
              </p>
            </CardBody>
          </Card>
        ) : null}

        {!isStudent && cohortQuota.length ? (
          <Card className="col-span-12">
            <CardHeader
              title="Cohort quota"
              subtitle="Completed against required, across every student in scope"
            />
            <CardBody className="pt-3">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {cohortQuota.map((entry) => (
                  <RequirementBar key={entry.department} {...entry} />
                ))}
              </div>
            </CardBody>
          </Card>
        ) : null}

        {dashboard?.tips?.length ? (
          <Card className="col-span-12">
            <CardHeader title="Worth knowing" subtitle="Rules that trip students up" />
            <CardBody className="pt-2">
              <ul className="flex flex-col gap-2.5">
                {dashboard.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 text-[13px] text-ink-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
