import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { AvatarCard } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/Badge";
import { CLINIC_SESSIONS, departmentMeta } from "@/config/academic";
import { labelFor, toneFor } from "@/components/shared";
import {
  SLOT_HEIGHT,
  heightFor,
  hourRange,
  labelForHour,
  nowOffset,
  offsetFor,
  toClockLabel,
  toDecimalHours,
} from "@/lib/time";
import { appointmentAppearance } from "@/features/schedule/appointmentStyles";

/**
 * The student's board.
 *
 * The clinic's reservation board (`features/schedule/CalendarBoard`) draws a
 * column per dentist; a student sits at one unit, so the same geometry is used
 * with a column per *day* instead — one for the day view, seven for the week.
 * That is the only difference between the two views, which is why they are one
 * component: a week is a day board with more columns, and duplicating the
 * gutter, the session bands and the now-ticker to say so would guarantee the
 * two drift apart.
 *
 * The teaching clinic's two sessions are painted as bands behind the grid —
 * the hours outside them are not bookable, and a blank afternoon should read
 * as "clinic closed" rather than "nothing booked".
 */

/**
 * The clock gutter and the minimum column width, in two sizes.
 *
 * A day board built for a desktop is 80px of clock plus a 420px column, which
 * is 500px on a 375px phone — so the one thing the screen exists to show
 * arrives already scrolled off the side. On a phone the clock narrows and a
 * single day gives up its minimum, which fits a whole day on screen without
 * touching the geometry the appointment blocks are positioned against.
 */
const GUTTER_WIDTH = 80;
const GUTTER_WIDTH_SM = 52;
const HEADER_HEIGHT = 84;
const DAY_MIN_WIDTH = 420;
const WEEK_COLUMN_MIN_WIDTH = 132;

/** A visit is a one-hour slot: the fixtures carry `time`, never an end. */
const SLOT_MINUTES = 60;

const endOf = (time) => {
  const [hour, minute] = String(time).split(":").map(Number);
  const total = hour * 60 + (minute || 0) + SLOT_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * Side-by-side placement for visits that share an hour.
 *
 * The clinic board never needs this — it has a column per dentist, so two
 * overlapping visits are already in different columns. A student has one
 * column, so two visits booked into the same slot would sit exactly on top of
 * each other. Blocks are swept in time order into the first free lane, and a
 * cluster's lane count is what divides the column's width.
 */
const withLanes = (visits) => {
  const sorted = visits
    .slice()
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));

  const placed = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  const closeCluster = () => {
    const lanes = cluster.reduce((max, item) => Math.max(max, item.lane + 1), 0);
    cluster.forEach((item) => placed.push({ ...item, lanes }));
    cluster = [];
    clusterEnd = -Infinity;
  };

  sorted.forEach((visit) => {
    const start = toDecimalHours(visit.time);
    const end = toDecimalHours(endOf(visit.time));

    /* a gap means the previous overlap group is finished */
    if (start >= clusterEnd) closeCluster();

    const taken = new Set(
      cluster.filter((item) => item.end > start).map((item) => item.lane)
    );
    let lane = 0;
    while (taken.has(lane)) lane += 1;

    cluster.push({ visit, lane, end });
    clusterEnd = Math.max(clusterEnd, end);
  });

  closeCluster();
  return placed;
};

/* ------------------------------------------------------------ event card */

function VisitBlock({ visit, lane = 0, lanes = 1, onOpen, dense = false }) {
  const look = appointmentAppearance(visit);
  const Icon = look.icon;
  const end = endOf(visit.time);
  const height = heightFor(visit.time, end);
  /* Every teaching visit is exactly one hour, which lands at 90px — just under
     the clinic board's threshold. Compact is reserved for narrow lanes, and a
     week column is narrow by definition. */
  const compact = dense || height < 88 || lanes > 2;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(visit)}
      style={{
        top: offsetFor(visit.time) + 3,
        height,
        left: `calc(${(lane / lanes) * 100}% + ${dense ? 4 : 8}px)`,
        width: `calc(${100 / lanes}% - ${dense ? 8 : 16}px)`,
      }}
      /* Above the hour lanes. Both are positioned and the lanes carry `z-1`,
         so without this a block paints under the "book this hour" button it
         sits on and every click on a visit books a new one instead. */
      className={cn(
        "absolute z-[2] flex flex-col gap-1.5 overflow-hidden rounded-xl text-left transition hover:shadow-card",
        dense ? "px-2 py-2" : "px-3 py-2.5",
        look.card
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
              look.badge
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={2.6} />
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate font-bold text-ink",
                dense ? "text-[12px]" : "text-[13.5px]"
              )}
            >
              {visit.patientName}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate font-medium text-ink-muted",
                dense ? "text-[11px]" : "text-[12px]"
              )}
            >
              {dense ? (
                visit.time
              ) : (
                <>
                  {toClockLabel(visit.time)} <span className="px-0.5">&gt;</span>{" "}
                  {toClockLabel(end)}
                </>
              )}
            </span>
          </span>
        </span>
        {!compact ? (
          <StatusPill tone={toneFor(visit.status)} className="shrink-0">
            {labelFor(visit.status)}
          </StatusPill>
        ) : null}
      </span>

      {!compact ? (
        <span
          className={cn(
            "mt-auto w-fit rounded-full border px-2.5 py-1 text-[12px] font-semibold text-ink",
            look.pill
          )}
        >
          {visit.chiefComplaint || departmentMeta(visit.department).label}
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------ time gutter */

function TimeGutter({ timezone, width = GUTTER_WIDTH }) {
  return (
    <div className="sticky left-0 z-20 shrink-0 bg-white" style={{ width }}>
      <div
        className="sticky top-0 z-30 flex items-center justify-center border-b border-r border-slate-200 bg-white px-1 text-center text-[10px] font-bold leading-tight text-ink-soft sm:text-[11px]"
        style={{ height: HEADER_HEIGHT }}
      >
        {timezone}
      </div>
      <div className="relative border-r border-slate-200 bg-white">
        {hourRange().map((hour) => (
          <div
            key={hour}
            className="relative border-b border-slate-100 text-center"
            style={{ height: SLOT_HEIGHT }}
          >
            <span className="absolute -top-2 left-0 right-0 text-[11px] font-semibold text-ink-soft sm:text-[12px]">
              {labelForHour(hour)}
            </span>
          </div>
        ))}

        {/* which session each shaded band is */}
        {CLINIC_SESSIONS.map((session) => (
          <span
            key={session.value}
            className="absolute left-0 right-0 text-center text-[9.5px] font-extrabold uppercase tracking-wide text-brand-600"
            style={{ top: offsetFor(session.start) + 14 }}
          >
            {session.label.replace(" session", "")}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- the session bands */

/**
 * Shades the two teaching sessions so closed hours read as closed.
 *
 * Unlabelled: a block spans the column's full width, so anything written into
 * the band would sit under the first appointment of the session. The names go
 * in the gutter instead, where nothing is drawn over them.
 */
function SessionBands() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0">
      {CLINIC_SESSIONS.map((session) => (
        <div
          key={session.value}
          className="absolute inset-x-0 border-y border-brand-100 bg-brand-50/40"
          style={{
            top: offsetFor(session.start),
            height: offsetFor(session.end) - offsetFor(session.start),
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- one column */

function BoardColumn({ column, dense, minWidth, onOpenVisit, onCreate }) {
  return (
    <div
      className="min-w-0 flex-1 border-r border-slate-200 last:border-r-0"
      style={{ minWidth }}
    >
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white",
          dense ? "px-2.5" : "px-4",
          column.highlight && "bg-brand-50/70"
        )}
        style={{ height: HEADER_HEIGHT }}
      >
        {column.avatar ? (
          <AvatarCard name={column.title} label={column.subtitle} size="md" />
        ) : (
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate text-[13px] font-extrabold",
                column.highlight ? "text-brand-700" : "text-ink"
              )}
            >
              {column.title}
            </span>
            <span className="mt-0.5 block truncate text-[11.5px] font-semibold text-ink-soft">
              {column.subtitle}
            </span>
          </span>
        )}
        {column.badge ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-ink-muted">
            {column.badge}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <SessionBands />

        {hourRange().map((hour) => (
          <button
            key={hour}
            type="button"
            disabled={!onCreate}
            onClick={() => onCreate?.(hour, column.date)}
            className="group relative z-[1] block w-full border-b border-slate-100 transition enabled:hover:bg-brand-100/40"
            style={{ height: SLOT_HEIGHT }}
          >
            {onCreate && !dense ? (
              <span className="pointer-events-none absolute inset-0 hidden items-center justify-center group-hover:flex">
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-brand-600 shadow-card">
                  <Plus className="h-3.5 w-3.5" /> Book this hour
                </span>
              </span>
            ) : null}
          </button>
        ))}

        {withLanes(column.visits ?? []).map((item) => (
          <VisitBlock
            key={item.visit.id}
            visit={item.visit}
            lane={item.lane}
            lanes={item.lanes}
            dense={dense}
            onOpen={onOpenVisit}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ board */

/**
 * `columns` is the general form — one entry per day column. `student` and
 * `visits` are the day view's shorthand for "one column, mine", kept so the
 * common case does not have to build a one-element array.
 */
export function StudentCalendarBoard({
  student,
  visits = [],
  columns,
  timezone = "GMT +02:00",
  onOpenVisit,
  onCreate,
}) {
  const scrollRef = useRef(null);
  const [ticker, setTicker] = useState(() => nowOffset());

  useEffect(() => {
    const id = setInterval(() => setTicker(nowOffset()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    /* land the viewport on the morning session rather than at 8am */
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(offsetFor(CLINIC_SESSIONS[0].start) - 40, 0);
    }
  }, []);

  /**
   * The phone breakpoint, read once rather than expressed as a class: the
   * gutter width and the column minimum are inline styles the appointment
   * blocks are positioned against, so a Tailwind variant cannot reach them.
   */
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia("(max-width: 639px)");
    const sync = (event) => setCompact(event.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const resolved = useMemo(
    () =>
      columns ?? [
        {
          key: "mine",
          title: student?.name ?? "My chair",
          subtitle: `${visits.length} patient(s) booked`,
          badge: student?.group,
          avatar: true,
          visits,
        },
      ],
    [columns, student, visits]
  );

  const dense = resolved.length > 1;
  const gutter = compact ? GUTTER_WIDTH_SM : GUTTER_WIDTH;
  /* A week is seven columns whatever the screen, so it keeps a minimum and
     scrolls sideways. A single day gives its minimum up and fits. */
  const columnMin = dense ? WEEK_COLUMN_MIN_WIDTH : compact ? 0 : DAY_MIN_WIDTH;

  return (
    <div ref={scrollRef} className="od-card relative min-h-0 flex-1 overflow-auto p-0">
      <div className={cn("relative flex", dense || !compact ? "min-w-max" : "w-full")}>
        <TimeGutter timezone={timezone} width={gutter} />

        <div
          className="relative flex min-w-0 flex-1"
          style={{ minWidth: dense ? WEEK_COLUMN_MIN_WIDTH * resolved.length : columnMin }}
        >
          {resolved.map((column) => (
            <BoardColumn
              key={column.key}
              column={column}
              dense={dense}
              minWidth={columnMin}
              onOpenVisit={onOpenVisit}
              onCreate={onCreate}
            />
          ))}

          {ticker != null ? (
            <div
              className="pointer-events-none absolute left-0 right-0 z-[5]"
              style={{ top: HEADER_HEIGHT + ticker }}
            >
              <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-danger" />
              <span className="block h-px w-full bg-danger/70" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
