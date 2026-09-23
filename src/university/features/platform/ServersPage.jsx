import { useState } from "react";
import { Activity, CircleSlash, Cpu, Gauge, RefreshCw, Server, Zap } from "lucide-react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid, Toolbar } from "@/components/shared";
import { GroupedBarChart } from "@/components/charts";
import { TrendArea } from "./TrendArea";
import { formatEgpCompact, formatMs, formatStorage, formatUptime } from "./platformFormat";

/**
 * The fleet: what is running, how hard, and what it is costing.
 *
 * ## The numbers here come from the API, not from Azure
 *
 * For CPU and memory Azure Monitor is the better source, and this does not
 * replace it. What Azure cannot see is the shape of the question a founder
 * actually asks — not "what is the CPU" but "is the product slow, for whom, and
 * what is it costing me". Latency per route, error rate, and above all *request
 * units consumed* are known only inside the API process, and the RU number is
 * the one the Cosmos invoice is made of.
 *
 * Each replica counts in memory and flushes one small document every five
 * minutes. That is the whole telemetry pipeline: no agent, no sidecar, no
 * per-metric ingestion charge.
 *
 * ## What "control the servers" honestly means
 *
 * This console does not own the orchestrator and cannot restart a container.
 * What it can do is set an intent the replicas read and act on — a draining node
 * fails its readiness probe, so the balancer stops sending it traffic and the
 * platform replaces it. That is a real capability expressed as data, and the
 * server refuses to drain the last healthy node, because the failure mode it
 * prevents is an operator diagnosing a slow request by draining the fleet one
 * node at a time.
 */
export default function ServersPage() {
  const toast = useToast();
  const [range, setRange] = useState("24h");
  const [nodeId, setNodeId] = useState("all");

  const { data: fleet, loading: fleetLoading, refetch: refetchFleet } = useAsync(
    () => platformService.getServers(),
    []
  );
  const { data: load, loading: loadLoading } = useAsync(
    () => platformService.getServerLoad({ range, nodeId }),
    [range, nodeId]
  );
  const { data: cost } = useAsync(() => platformService.getServerCost({ range: "30d" }), []);

  const setState = async (node, status) => {
    try {
      await platformService.setServerState(node.nodeId, {
        status,
        reason: `Set to ${status} from the platform console`,
      });
      toast.success(`${node.nodeId} is ${status}`, "The replica acts on this at its next probe.");
      refetchFleet();
    } catch (error) {
      toast.error("Could not change that node", error.message);
    }
  };

  const flush = async () => {
    try {
      const result = await platformService.flushCache();
      toast.success(`Cleared ${formatNumber(result.cleared)} cache entries`, result.scope);
    } catch (error) {
      toast.error("Could not flush the cache", error.message);
    }
  };

  const summary = fleet?.summary;
  const totals = load?.totals;

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Infrastructure"
        description="Measured by the API itself, once every five minutes per replica. Request units are the number the Cosmos bill is made of, and nothing outside this process knows them."
        actions={
          <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={flush}>
            Flush cache
          </Button>
        }
      />

      {summary?.stale ? (
        <InfoBanner tone="warning">
          {summary.stale} {summary.stale === 1 ? "replica has" : "replicas have"} not reported in
          three sample intervals. A node that cannot write its heartbeat also cannot write that it is
          unhealthy — so liveness here is derived from silence rather than trusted from a flag.
        </InfoBanner>
      ) : null}

      <StatGrid cols={4}>
        <StatCard
          label="Replicas healthy"
          value={`${summary?.healthy ?? 0} / ${summary?.total ?? 0}`}
          tone={summary?.stale ? "warning" : "success"}
          icon={<Server className="h-5 w-5" />}
        />
        <StatCard
          label="Requests served"
          value={formatNumber(totals?.requests ?? 0)}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Error rate"
          value={`${totals?.errorPct ?? 0}%`}
          tone={(totals?.errorPct ?? 0) > 1 ? "danger" : "success"}
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          label="Request units"
          value={formatNumber(totals?.ru ?? 0)}
          tone="warning"
          icon={<Gauge className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <MiniSelect value={nodeId} onChange={(event) => setNodeId(event.target.value)}>
            <option value="all">Whole fleet</option>
            {(fleet?.nodes ?? []).map((node) => (
              <option key={node.nodeId} value={node.nodeId}>
                {node.nodeId}
              </option>
            ))}
          </MiniSelect>
        }
        right={
          <MiniSelect value={range} onChange={(event) => setRange(event.target.value)}>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </MiniSelect>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        {/* ------------------------------------------------------ throughput */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Load"
            subtitle={
              load?.peak
                ? `Peak ${formatNumber(load.peak.requests)} requests in a five-minute bucket`
                : "Five-minute buckets"
            }
          />
          <CardBody className="pt-3">
            {loadLoading && !load ? (
              <CardSkeleton />
            ) : (
              <GroupedBarChart
                data={(load?.series ?? []).map((entry) => ({
                  ...entry,
                  /* The chart labels the bucket, not the full timestamp — a
                     288-point x-axis of ISO strings is unreadable. */
                  at: formatDate(entry.bucket, range === "24h" ? "HH:mm" : "d MMM"),
                }))}
                xKey="at"
                height={260}
                series={[
                  { key: "requests", label: "Requests", color: "#0077B6" },
                  { key: "errors", label: "Errors", color: "#E76F51" },
                ]}
              />
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------------- latency */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader
            title="Latency"
            subtitle={load?.peak ? `Worst bucket ${formatMs(load.peak.latencyMs)}` : "Mean per bucket"}
          />
          <CardBody className="pt-3">
            {load?.series?.length ? (
              <TrendArea
                data={load.series.map((entry) => ({
                  ...entry,
                  at: formatDate(entry.bucket, range === "24h" ? "HH:mm" : "d MMM"),
                }))}
                xKey="at"
                yKey="avgLatencyMs"
                height={260}
                color="#F4A261"
                valueFormatter={formatMs}
              />
            ) : (
              <CardSkeleton />
            )}
          </CardBody>
        </Card>

        {/* --------------------------------------------------------- nodes */}
        <Card className="col-span-12">
          <CardHeader
            title="Replicas"
            subtitle="Draining a node fails its readiness probe so the balancer stops sending it traffic"
          />
          <CardBody className="pt-2">
            <DataTable
              loading={fleetLoading}
              rows={fleet?.nodes ?? []}
              rowKey={(row) => row.nodeId}
              dense
              emptyTitle="No replicas have reported yet"
              emptyDescription="A node registers itself on boot and flushes every five minutes."
              columns={[
                {
                  key: "nodeId",
                  header: "Node",
                  sortable: true,
                  render: (row) => (
                    <div className="min-w-0">
                      <span className="block truncate font-mono text-[12.5px] font-bold text-ink">
                        {row.nodeId}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {row.region} · {row.version ?? "—"}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "healthy",
                  header: "State",
                  sortable: true,
                  render: (row) => (
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={row.healthy ? "success" : row.status === "active" ? "danger" : "warning"}>
                        {row.healthy ? "Healthy" : row.status === "active" ? "Not reporting" : row.status}
                      </Badge>
                      <span className="text-[11px] text-ink-faint">
                        seen {row.lastSeenAt ? fromNow(row.lastSeenAt) : "never"}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "cpu",
                  header: "CPU",
                  align: "right",
                  sortValue: (row) => row.metrics?.cpuPct ?? 0,
                  render: (row) => (
                    <span className="text-[13px] text-ink-muted">{row.metrics?.cpuPct ?? 0}%</span>
                  ),
                },
                {
                  key: "memory",
                  header: "Memory",
                  align: "right",
                  sortValue: (row) => row.metrics?.rssMb ?? 0,
                  render: (row) => (
                    <span className="text-[13px] text-ink-muted">{row.metrics?.rssMb ?? 0} MB</span>
                  ),
                },
                {
                  key: "lag",
                  header: "Event loop",
                  align: "right",
                  sortValue: (row) => row.metrics?.eventLoopLagMs ?? 0,
                  /**
                   * The single most useful number for "is this process
                   * struggling" in Node. CPU can look fine while every request
                   * queues behind one synchronous parse.
                   */
                  render: (row) => (
                    <span
                      className={
                        (row.metrics?.eventLoopLagMs ?? 0) > 50
                          ? "text-[13px] font-bold text-danger"
                          : "text-[13px] text-ink-muted"
                      }
                    >
                      {formatMs(row.metrics?.eventLoopLagMs ?? 0)}
                    </span>
                  ),
                },
                {
                  key: "uptime",
                  header: "Uptime",
                  align: "right",
                  render: (row) => (
                    <span className="text-[13px] text-ink-muted">{formatUptime(row.uptimeSeconds)}</span>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  render: (row) =>
                    row.status === "active" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button variant="secondary" size="xs" onClick={() => setState(row, "cordoned")}>
                          Cordon
                        </Button>
                        <Button
                          variant="danger-ghost"
                          size="xs"
                          leftIcon={<CircleSlash className="h-3.5 w-3.5" />}
                          onClick={() => setState(row, "draining")}
                        >
                          Drain
                        </Button>
                      </div>
                    ) : (
                      <Button variant="success" size="xs" onClick={() => setState(row, "active")}>
                        Return to service
                      </Button>
                    ),
                },
              ]}
            />
          </CardBody>
        </Card>

        {/* ---------------------------------------------------------- cost */}
        {/**
         * Where the request units are going, by tenant.
         *
         * The question behind "why is the Cosmos bill what it is" — and the read
         * that makes a noisy tenant visible before the invoice does. Folded from
         * the same rollups the analytics screens use, so it costs one lane read.
         */}
        <Card className="col-span-12">
          <CardHeader
            title="Cost by tenant"
            subtitle="Request units spent over the last 30 days — the unit Cosmos actually bills"
            action={
              <span className="text-[13px] font-semibold text-ink-muted">
                {formatNumber(cost?.totals?.ru ?? 0)} RU ·{" "}
                {formatStorage(cost?.totals?.storageGb ?? 0)} held
              </span>
            }
          />
          <CardBody className="pt-2">
            <DataTable
              rows={cost?.byTenant ?? []}
              rowKey={(row) => row.tenantId}
              dense
              emptyTitle="No usage recorded yet"
              columns={[
                {
                  key: "tenantId",
                  header: "Tenant",
                  render: (row) => (
                    <span className="font-mono text-[12.5px] font-semibold text-ink">{row.tenantId}</span>
                  ),
                },
                {
                  key: "requests",
                  header: "Requests",
                  align: "right",
                  sortable: true,
                  render: (row) => (
                    <span className="text-[13px] text-ink-muted">{formatNumber(row.requests)}</span>
                  ),
                },
                {
                  key: "ru",
                  header: "Request units",
                  align: "right",
                  sortable: true,
                  render: (row) => (
                    <span className="text-[13px] font-semibold text-ink">{formatNumber(row.ru)}</span>
                  ),
                },
                {
                  key: "ruPerRequest",
                  header: "RU / request",
                  align: "right",
                  sortable: true,
                  /**
                   * The ratio, not the total — it is what tells you whether a
                   * tenant is busy or whether one of their screens is expensive,
                   * and those two need completely different responses.
                   */
                  render: (row) => (
                    <span
                      className={
                        row.ruPerRequest > 20
                          ? "text-[13px] font-bold text-warning-ink"
                          : "text-[13px] text-ink-muted"
                      }
                    >
                      {row.ruPerRequest}
                    </span>
                  ),
                },
                {
                  key: "storageGb",
                  header: "Storage",
                  align: "right",
                  sortable: true,
                  render: (row) => (
                    <span className="text-[13px] text-ink-muted">{formatStorage(row.storageGb)}</span>
                  ),
                },
              ]}
            />

            {load?.totals?.estimatedCostEgp != null ? (
              <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-soft">
                <Cpu className="h-3.5 w-3.5" />
                Roughly {formatEgpCompact(load.totals.estimatedCostEgp * 100)} of throughput in the
                selected window, at Azure's published autoscale rate. Indicative — the invoice is the
                authority.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
