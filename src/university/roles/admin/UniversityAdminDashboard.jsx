import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  Megaphone,
  ShieldAlert,
  Timer,
  UserSquare2,
  Users,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { academicYearLabel } from "@/config/academic";
import { uni } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardShell } from "@/components/shared";
import { DonutChart, GroupedBarChart, HorizontalBars } from "@/components/charts";
import { ProgressRing } from "@/university/components";

/**
 * The Dean.
 *
 * Runs the school rather than the clinic: is the teaching clinic moving, is the
 * review loop clearing, is anybody stuck, and will the cohort clear its quota
 * before the term ends. The desk books the chairs and the staff member signs
 * the work off; this screen is the one place where the shape of the whole
 * faculty is visible at once.
 *
 * ## One request
 *
 * This screen used to issue seven — every case in the campus, every student,
 * every review, today's appointments, the activity trail, the announcements and
 * a dashboard aggregate — and then count the answers in the browser. Three of
 * those are tables that grow with the clinic, fetched in full so that a tile
 * could show their length, which is the most expensive thing a well-written
 * portal does: the cost grows with the campus while the number on screen stays
 * four characters wide.
 *
 * `getDeanBoard()` is the whole screen. The server keeps the tallies as
 * counters and folds the time series at write time, so the board is a handful
 * of point reads however large the campus gets — and the fold lives in one
 * place, which is what stops this screen and the analytics screen quietly
 * disagreeing about how many steps are pending.
 *
 * The rule that keeps it that way: **nothing on this page is derived from a
 * list.** Every number comes off `board.counts`. If a new tile needs a number
 * that is not there, it is added to the server's fold — not fetched as a list
 * and measured here.
 */
export default function UniversityAdminDashboard() {
  const { user, campus } = useOutletContext() ?? {};
  const navigate = useNavigate();

  const { data: board, loading, error } = useAsync(() => universityService.getDeanBoard(), []);

  if (loading || (!board && !error)) {
    return <OdentaLoaderPanel />;
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="The board could not be loaded"
          description={error.message}
        />
      </div>
    );
  }

  const counts = board.counts;
  const termDaysLeft = board.term?.daysLeft;

  /**
   * What is waiting on somebody, as one list.
   *
   * Each row is a count and a destination rather than the records themselves.
   * A Dean does not allocate the case — they notice that eleven are waiting and
   * go and ask why — so shipping eleven patient records to render the word
   * "eleven" is the trade this screen exists to stop making.
   */
  const blocked = [
    {
      label: "Cases with no student",
      value: counts.unassigned,
      tone: "danger",
      to: uni.registry,
      hint: "Screened and waiting for allocation",
    },
    {
      label: "Consent outstanding",
      value: counts.consentOutstanding,
      tone: "warning",
      to: uni.cases,
      hint: "Allocated, but nothing can be submitted until it is signed",
    },
    {
      label: "Steps awaiting a decision",
      value: counts.pendingReviews,
      tone: "warning",
      to: uni.reviewQueue,
      hint: "Sitting in the review queue",
    },
    {
      label: "Procedure requests pending",
      value: counts.procedurePending,
      tone: "info",
      to: uni.procedureRequests,
      hint: "Waiting on faculty approval",
    },
    {
      label: "Lab work pending",
      value: counts.labPending,
      tone: "info",
      to: uni.labRequests,
      hint: "Raised and not yet approved",
    },
  ].filter((row) => row.value > 0);

  const turnaround = counts.averageTurnaroundHours;

  return (
    <DashboardShell
      user={user}
      role={ROLES.UNI_ADMIN}
      subtitle={
        termDaysLeft != null
          ? `${termDaysLeft} days left in ${campus?.term ?? "the term"}`
          : campus?.term
      }
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<Megaphone className="h-4 w-4" />}
            onClick={() => navigate(`${uni.news}?new=1`)}
          >
            Post announcement
          </Button>
          <Button leftIcon={<Users className="h-4 w-4" />} onClick={() => navigate(uni.people)}>
            People
          </Button>
        </>
      }
      kpis={[
        {
          label: "Patients on file",
          value: formatNumber(counts.cases),
          icon: <UserSquare2 className="h-5 w-5" />,
        },
        {
          label: "Booked today",
          value: formatNumber(counts.booked),
          tone: "success",
          icon: <CalendarDays className="h-5 w-5" />,
        },
        {
          label: "Steps awaiting review",
          value: formatNumber(counts.pendingReviews),
          tone: "warning",
          icon: <ClipboardCheck className="h-5 w-5" />,
        },
        {
          label: "Students at risk",
          value: formatNumber(counts.studentsAtRisk),
          tone: "danger",
          icon: <ShieldAlert className="h-5 w-5" />,
        },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        {/* ---------------------------------------------------- cohort */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader
            title="Cohort readiness"
            subtitle={`${counts.students} students · ${campus?.academicYear ?? ""}`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.requirements)}>
                Requirements
              </Button>
            }
          />
          <CardBody className="flex flex-col items-center gap-5 pt-2">
            <ProgressRing
              value={counts.cohortProgress}
              size={128}
              stroke={11}
              sublabel="quota cleared"
              tone={
                counts.cohortProgress >= 60
                  ? "success"
                  : counts.cohortProgress >= 35
                    ? "brand"
                    : "warning"
              }
            />
            {/**
             * Per teaching year rather than a tri-split of the whole cohort.
             *
             * "How is year four doing" is the question a Dean actually asks —
             * a third year six weeks in and a fifth year in their final term
             * are not behind in the same way, and averaging them into one bar
             * hides both.
             */}
            <div className="grid w-full grid-cols-2 gap-3 text-center sm:grid-cols-4 xl:grid-cols-2">
              {board.cohort.byYear.map((row) => (
                <div key={row.academicYear} className="rounded-xl border border-slate-200 py-3">
                  <div className="text-[20px] font-extrabold text-ink">{row.progress}%</div>
                  <div className="od-label mt-0.5">{academicYearLabel(row.academicYear)}</div>
                  <div className="mt-0.5 text-[11px] text-ink-faint">{row.students} students</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* --------------------------------------------------- throughput */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Review throughput"
            subtitle="Steps submitted against steps signed off, by month"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.analytics)}>
                Analytics
              </Button>
            }
          />
          <CardBody className="pt-3">
            <GroupedBarChart
              data={board.throughputSeries}
              xKey="month"
              height={250}
              series={[
                { key: "cases", label: "Submitted", color: "#0077B6" },
                { key: "completed", label: "Accepted", color: "#20B2AA" },
              ]}
            />
          </CardBody>
        </Card>

        {/* ------------------------------------------------ what is blocked */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Waiting on somebody"
            subtitle="Everything that is stopped, and who it is stopped on"
          />
          <CardBody className="pt-2">
            {blocked.length === 0 ? (
              <EmptyState
                title="Nothing is blocked"
                description="No unallocated cases, no unsigned consent, no pending queues."
                className="py-10"
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {blocked.map((row) => (
                  <li key={row.label}>
                    <button
                      type="button"
                      onClick={() => navigate(row.to)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink">
                          {row.label}
                        </span>
                        <span className="block truncate text-[12px] text-ink-soft">{row.hint}</span>
                      </span>
                      <Badge tone={row.tone}>{formatNumber(row.value)}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------- the review week */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="The review loop this week"
            subtitle={
              turnaround == null
                ? "Submitted, accepted and sent back, per teaching day"
                : `Averaging ${turnaround} hours to a decision`
            }
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.reviewQueue)}>
                Review queue
              </Button>
            }
          />
          <CardBody className="pt-3">
            <GroupedBarChart
              data={board.submissionSeries}
              xKey="day"
              height={220}
              series={[
                { key: "submitted", label: "Submitted", color: "#0077B6" },
                { key: "accepted", label: "Accepted", color: "#20B2AA" },
                { key: "returned", label: "Sent back", color: "#F59E0B" },
              ]}
            />
          </CardBody>
        </Card>

        {/* --------------------------------------------------- rotation load */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Caseload by rotation"
            subtitle="Where the chairs are going"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.cases)}>
                Case list
              </Button>
            }
          />
          <CardBody className="pt-3">
            <DonutChart
              data={board.departmentLoad}
              total={counts.cases}
              label="Cases"
              valueFormatter={formatNumber}
            />
          </CardBody>
        </Card>

        {/* ------------------------------------------------------ turnaround */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Time to a decision"
            subtitle="Mean hours between a student submitting and a supervisor ruling"
          />
          <CardBody className="pt-3">
            {/**
             * A day with no decisions is a gap, not a zero. The server sends
             * `null` for those days precisely so the chart does not draw a bar
             * implying instant turnaround on a day nobody was in clinic.
             */}
            <GroupedBarChart
              data={board.turnaroundSeries}
              xKey="day"
              height={200}
              series={[{ key: "hours", label: "Hours", color: "#7C3AED" }]}
            />
          </CardBody>
        </Card>

        {/* ------------------------------------------------------- at risk */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Students at risk"
            subtitle="Furthest behind quota, or on probation"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.students)}>
                <GraduationCap className="mr-1.5 h-4 w-4" /> All students
              </Button>
            }
          />
          <CardBody className="pt-2">
            {board.cohort.atRisk.length === 0 ? (
              <EmptyState
                title="Nobody is behind"
                description="Every student is clearing their quota."
                className="py-8"
              />
            ) : (
              <HorizontalBars
                data={board.cohort.atRisk
                  .slice(0, 8)
                  .map((row) => ({ name: row.name, value: row.progress }))}
                valueFormatter={(value) => `${value}%`}
              />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------ activity */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Latest activity"
            subtitle="Who did what, across the whole faculty"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.activity)}>
                Full trail
              </Button>
            }
          />
          <CardBody className="pt-2">
            {!board.activity?.length ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No activity recorded"
                className="py-8"
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {board.activity.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {item.actor}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {item.detail ?? item.action}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-ink-faint">
                      {fromNow(item.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------- announcements */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Announcements"
            subtitle="Most recently published"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.news)}>
                Manage
              </Button>
            }
          />
          <CardBody className="pt-2">
            {!board.announcements?.length ? (
              <EmptyState
                icon={<Megaphone className="h-6 w-6" />}
                title="Nothing published"
                description="The noticeboard is empty."
                className="py-8"
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {board.announcements.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {item.title}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {item.publishedAt
                          ? formatDate(item.publishedAt, "d MMM yyyy")
                          : "Not published"}
                      </span>
                    </span>
                    {item.pinned ? <Badge tone="brand">Pinned</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------- the day, plainly */}
        <Card className="col-span-12">
          <CardHeader title="Today" subtitle="The clinic as it stands right now" />
          <CardBody className="pt-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "Booked", value: counts.booked, icon: CalendarDays },
                { label: "Waiting", value: counts.waiting, icon: Users },
                { label: "In the chair", value: counts.inChair, icon: Activity },
                { label: "Finished", value: counts.finished, icon: ClipboardCheck },
                { label: "Submitted today", value: counts.submittedToday, icon: ClipboardCheck },
                { label: "Decided today", value: counts.decidedToday, icon: Timer },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border border-slate-200 px-3.5 py-3 text-center"
                >
                  <tile.icon className="mx-auto h-4 w-4 text-ink-faint" />
                  <div className="mt-1.5 text-[20px] font-extrabold text-ink">
                    {formatNumber(tile.value)}
                  </div>
                  <div className="od-label mt-0.5">{tile.label}</div>
                </div>
              ))}
            </div>
            {counts.labPending > 0 ? (
              <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-soft">
                <FlaskConical className="h-3.5 w-3.5" />
                {formatNumber(counts.labPending)} lab request
                {counts.labPending === 1 ? "" : "s"} still waiting on a decision.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
