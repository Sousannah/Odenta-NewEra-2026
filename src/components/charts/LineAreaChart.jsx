import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { formatMoney } from "@/lib/format";

function CashTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl bg-[#1E293B] px-3 py-2 text-white shadow-pop">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Total:</div>
      <div className="text-[13px] font-bold">{formatMoney(point.total)}</div>
    </div>
  );
}

/**
 * The dashboard cashflow chart: soft gradient area, dotted grid, and a
 * vertical guide line pinned to the hovered month.
 */
export function LineAreaChart({
  data,
  xKey = "month",
  yKey = "value",
  height = 220,
  color = "#4B66E9",
}) {
  const [activeX, setActiveX] = useState(null);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          onMouseMove={(state) => setActiveX(state?.activeLabel ?? null)}
          onMouseLeave={() => setActiveX(null)}
        >
          <defs>
            <linearGradient id="odCashFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#E2E8F0"
            strokeDasharray="2 6"
            strokeWidth={1}
          />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} dy={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(value) => (value >= 1000 ? `${value / 1000}K` : value)}
          />
          <Tooltip content={<CashTooltip />} cursor={false} />
          {activeX ? (
            <ReferenceLine x={activeX} stroke={color} strokeWidth={1.5} strokeOpacity={0.55} />
          ) : null}
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2.2}
            fill="url(#odCashFill)"
            activeDot={{
              r: 5,
              fill: "#fff",
              stroke: color,
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
