import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatNumber } from "@/lib/format";
import { chart } from "@/theme/tokens";

const compact = (value) => (value >= 1000 ? `${value / 1000}K` : value);

function BarTooltip({ active, payload, label, series }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-white shadow-pop">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
        {label}
      </div>
      {payload.map((entry) => {
        const meta = series.find((item) => item.key === entry.dataKey);
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 text-[12px] font-semibold">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color }}
              aria-hidden="true"
            />
            {meta?.label ?? entry.dataKey}
            <span className="ml-auto pl-3">
              {meta?.format === "money" ? formatMoney(entry.value) : formatNumber(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * series: [{ key, label, color, format?: "money" | "number", axis?: "left" | "right" }]
 *
 * `format` defaults to "number" — most of these charts count things (visits,
 * submissions, sign-ins) and a count rendered as currency is a lie the reader
 * has no way to catch. A money series has to say so.
 * Pass `dualAxis` when the series live on very different scales (e.g. revenue
 * against a headcount) so the smaller bars stay readable.
 */
export function GroupedBarChart({
  data,
  xKey = "month",
  series,
  height = 200,
  dualAxis = false,
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: dualAxis ? 4 : 4, bottom: 0, left: -22 }}
          barGap={4}
        >
          <CartesianGrid vertical={false} stroke={chart.grid} strokeDasharray="2 6" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} dy={6} />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={compact}
          />
          {dualAxis ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={34}
              tickFormatter={compact}
            />
          ) : null}
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
            content={<BarTooltip series={series} />}
          />
          {series.map((item) => (
            <Bar
              key={item.key}
              yAxisId={dualAxis ? (item.axis ?? "left") : "left"}
              dataKey={item.key}
              fill={item.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
