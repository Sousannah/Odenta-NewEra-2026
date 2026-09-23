import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chart } from "@/theme/tokens";

/**
 * An area chart whose tooltip formats what it is actually showing.
 *
 * `components/charts/LineAreaChart` is the clinic's cashflow chart and its
 * tooltip renders `point.total` as currency — correct there, and wrong for
 * every series on the platform screens, which are gigabytes, request units,
 * milliseconds and percentages. Rendering gigabytes as "EGP 412" is the class
 * of bug a reader has no way to catch, so this takes a `valueFormatter` and the
 * caller says what the number means.
 *
 * Deliberately local to the platform feature rather than added to the shared
 * chart set: the shared components are owned by another build, and a second
 * area chart there would be two components with almost the same name whose
 * difference nobody would remember.
 */
export function TrendArea({
  data,
  xKey = "day",
  yKey = "value",
  height = 200,
  color = chart.primary,
  valueFormatter = (value) => value,
  label,
}) {
  const gradientId = `odPlatformFill-${yKey}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={chart.grid} strokeDasharray="2 6" strokeWidth={1} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            dy={8}
            /**
             * A ninety-day range is ninety labels in the width of a card, which
             * renders as a grey smear. Recharts thins them out when asked; the
             * tooltip still names the exact day, which is where the precision
             * actually matters.
             */
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}K` : value)}
          />
          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1.5, strokeOpacity: 0.5 }}
            content={({ active, payload, label: at }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl bg-ink px-3 py-2 text-white shadow-pop">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    {at}
                  </div>
                  <div className="text-[13px] font-bold">
                    {valueFormatter(payload[0].value)}
                    {label ? <span className="ml-1.5 font-medium text-white/70">{label}</span> : null}
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            /* A ninety-point series with a dot per point is a solid line of
               dots. The tooltip is the affordance instead. */
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendArea;
