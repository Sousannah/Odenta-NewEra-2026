import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/lib/format";
import { chartSeries } from "@/theme/tokens";

/**
 * Donut with a dashed inner ring and a centred total, matching the
 * "Expenses" card.
 *
 * Slices are `[{ name, value, color? }]`. A slice with no `color` falls back to
 * the categorical palette in order, so a caller counting cases per department
 * does not have to pick hexes. `valueFormatter` exists because the centre is a
 * money total on the finance screens and a plain count everywhere else.
 */
export function DonutChart({
  data,
  total,
  label = "Total Expense",
  size = 190,
  valueFormatter = formatMoney,
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={2}
            cornerRadius={6}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((slice, index) => (
              <Cell
                key={slice.name}
                fill={slice.color ?? chartSeries[index % chartSeries.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full border-2 border-dashed border-slate-200"
          style={{ width: size * 0.62, height: size * 0.62 }}
        >
          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
              {label}
            </div>
            <div className="mt-0.5 text-[19px] font-extrabold text-ink">
              {valueFormatter(total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Horizontal segmented bar (stock availability, patient split). */
export function SegmentBar({ segments, className, height = 12, gap = 4 }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className={className} style={{ display: "flex", gap }}>
      {segments.map((segment) => (
        <span
          key={segment.name}
          title={`${segment.name}: ${segment.value}`}
          style={{
            width: `${(segment.value / total) * 100}%`,
            height,
            background: segment.color,
            borderRadius: 4,
          }}
        />
      ))}
    </div>
  );
}
