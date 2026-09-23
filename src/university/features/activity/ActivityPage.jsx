import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity as ActivityIcon, Eye, PenLine, Users } from "lucide-react";
import { universityService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OdentaSpinner } from "@/components/ui/OdentaLoader";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { PageHeader, Toolbar, StatCard, StatGrid, labelFor } from "@/components/shared";
import { GroupedBarChart } from "@/components/charts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * The activity trail.
 *
 * Every state change in the portal writes a row, and so do the reads that
 * matter: opening a patient record in a teaching clinic is itself an auditable
 * event, which is why `dossier.opened` sits beside the edits. Nothing here can
 * be amended or deleted — the rows are append-only by contract.
 *
 * ## Why the numbers come from the server
 *
 * This screen used to count its own tiles from the rows it had been handed, so
 * "412 events" quietly meant "the 412 we sent you", and the by-day chart lost
 * its oldest bar the moment a page filled. Both are the same mistake: a summary
 * of a page presented as a summary of a window.
 *
 * `getActivityBoard` asks the server to fold the tiles and the chart over the
 * *whole filter the user chose*, and returns one page of rows alongside them.
 * So the tiles describe the window, the table shows a page of it, and "load
 * more" extends the table without the tiles moving — which is what a reader
 * already assumes is happening.
 *
 * ## Why the search box is not a server filter
 *
 * It is — but only over the page. There is deliberately no prefix index on an
 * activity row: this is the hottest write path in the API, every state change
 * in the product writes one, and maintaining a search index on all of them to
 * save a millisecond of filtering would be the most expensive optimisation in
 * the codebase. The filters that *are* indexed — record kind, person, time —
 * are the ones that narrow the read before it is billed.
 */

/** The record kinds the audit rows actually carry. An indexed filter. */
const ENTITIES = [
  { value: "review", label: "Reviews" },
  { value: "case", label: "Cases" },
  { value: "appointment", label: "Appointments" },
  { value: "chart", label: "Charting" },
  { value: "sheet", label: "Treatment sheets" },
  { value: "consent", label: "Consent" },
  { value: "labRequest", label: "Lab requests" },
  { value: "procedureRequest", label: "Procedure requests" },
  { value: "person", label: "People" },
  { value: "account", label: "Accounts" },
  { value: "news", label: "Announcements" },
];

/**
 * Tone by family, not by verb.
 *
 * A family gains verbs over time — `review.accepted` joined `review.submitted`
 * later — and a map keyed on the full action falls back to grey for every new
 * one. Keying on the family means a new verb is coloured the day it ships.
 */
const FAMILY_TONE = {
  review: "success",
  case: "brand",
  appointment: "info",
  chart: "brand",
  sheet: "brand",
  consent: "success",
  labRequest: "warning",
  procedureRequest: "warning",
  dossier: "info",
  person: "neutral",
  news: "info",
  account: "neutral",
  auth: "neutral",
};

const familyOf = (action) => String(action ?? "").split(".")[0];

const PAGE_SIZE = 100;
const DAY = 86400000;

/** An ISO instant, so "last 24 hours" is 24 hours and not two calendar days. */
const hoursAgo = (days) => new Date(Date.now() - days * DAY).toISOString();

export default function ActivityPage() {
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("all");
  const [range, setRange] = useState("7");

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);
  const [continuation, setContinuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const since = range === "all" ? undefined : hoursAgo(Number(range));

  const filters = useMemo(
    () => ({ since, entity: entity === "all" ? undefined : entity, q: query.trim() || undefined }),
    [since, entity, query]
  );

  /**
   * One page, from the start or from where the last one stopped.
   *
   * The continuation token is passed back verbatim — it is Cosmos's own, opaque
   * and carrying no authority, since the campus still comes from the session on
   * every page. Only the first call asks for the folded stats: they describe the
   * window, not the page, so extending the table must not move them.
   */
  const load = useCallback(
    async (from) => {
      const setBusy = from ? setLoadingMore : setLoading;
      setBusy(true);
      setError(null);
      try {
        const board = await universityService.getActivityBoard({
          ...filters,
          limit: PAGE_SIZE,
          continuation: from ?? undefined,
        });

        setRows((current) => (from ? [...current, ...(board?.items ?? [])] : board?.items ?? []));
        setContinuation(board?.continuation ?? null);

        /**
         * The tiles and the chart are kept from the first page only.
         *
         * They describe the window the filter opened; extending the table below
         * them must not make them jump. The one envelope is used for both calls
         * because it carries its continuation in the body rather than in a
         * response header, which is one fewer thing for a proxy or a CORS
         * policy to strip between the API and this screen.
         */
        if (!from) {
          setStats(board?.stats ?? null);
          setSeries(board?.series ?? []);
        }
      } catch (cause) {
        setError(cause);
      } finally {
        setBusy(false);
      }
    },
    [filters]
  );

  /* A filter change is a new window, not more of the old one. */
  useEffect(() => {
    load(null);
  }, [load]);

  const chart = useMemo(
    () => series.map((entry) => ({ ...entry, day: formatDate(entry.day, "d MMM") })),
    [series]
  );

  const columns = [
    {
      key: "at",
      header: "When",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block text-[13px] font-semibold text-ink">{fromNow(item.at)}</span>
          <span className="block text-[11.5px] text-ink-soft">
            {formatDate(item.at, "d MMM yyyy, HH:mm")}
          </span>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Who",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-ink">{item.actor}</span>
          <span className="block truncate text-[11.5px] text-ink-soft">
            {item.actorId}
            {item.role ? ` · ${labelFor(item.role)}` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      render: (item) => (
        <Badge tone={FAMILY_TONE[familyOf(item.action)] ?? "neutral"}>
          {labelFor(String(item.action ?? "").replace(".", " "))}
        </Badge>
      ),
    },
    {
      key: "detail",
      header: "Detail",
      render: (item) => (
        <span className="line-clamp-2 max-w-[340px] text-[13px] text-ink-muted">{item.detail}</span>
      ),
    },
    {
      key: "entityId",
      header: "Record",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <span className="block text-[12px] font-semibold text-ink-muted">
            {item.entity ? labelFor(item.entity) : "—"}
          </span>
          <span className="block truncate font-mono text-[11.5px] text-ink-soft">
            {item.entityId ?? ""}
          </span>
        </div>
      ),
    },
    {
      key: "ip",
      header: "Source",
      render: (item) => (
        <span className="font-mono text-[12px] text-ink-faint">{item.ip ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Activity trail"
        description="Who did what, when, across the whole faculty. Reads are recorded as well as changes, and nothing here can be edited or deleted."
      />

      {/**
       * These describe the chosen window, not the rows on screen — the server
       * counts them over the whole filter. "Load more" extends the table below
       * without moving them, which is what a reader already assumes.
       */}
      <StatGrid cols={4}>
        <StatCard
          label="Events"
          value={stats?.events ?? 0}
          icon={<ActivityIcon className="h-5 w-5" />}
        />
        <StatCard
          label="People active" value={stats?.people ?? 0} tone="success"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Changes" value={stats?.writes ?? 0}
          icon={<PenLine className="h-5 w-5" />}
        />
        <StatCard
          label="Record reads" value={stats?.reads ?? 0} tone="warning"
          icon={<Eye className="h-5 w-5" />}
        />
      </StatGrid>

      <Card>
        <CardHeader
          title="Activity by day"
          subtitle="Changes against record reads and sign-ins"
          action={
            stats?.topActions?.length ? (
              <span className="text-[12px] font-semibold text-ink-soft">
                Busiest: {labelFor(String(stats.topActions[0].action).replace(".", " "))}
              </span>
            ) : null
          }
        />
        <CardBody className="pt-3">
          <GroupedBarChart
            data={chart}
            xKey="day"
            height={220}
            series={[
              { key: "edits", label: "Changes", color: "#0077B6" },
              { key: "reads", label: "Reads", color: "#20B2AA" },
            ]}
          />
        </CardBody>
      </Card>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Person, record or detail…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect value={entity} onChange={(event) => setEntity(event.target.value)}>
              <option value="all">Every record</option>
              {ENTITIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="all">As far back as it goes</option>
            </MiniSelect>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        dense
        emptyTitle={error ? "The trail could not be loaded" : "No activity in this window"}
        emptyDescription={error ? error.message : "Widen the time range or clear the filter."}
      />

      {continuation ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => load(continuation)}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <OdentaSpinner size={16} tone="current" className="mr-2" /> Loading…
              </>
            ) : (
              "Load older activity"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
