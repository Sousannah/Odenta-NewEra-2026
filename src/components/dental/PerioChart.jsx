import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { PERIO_SITES } from "@/config/dentalStandards";
import { LOWER_ARCH, UPPER_ARCH, formatTooth } from "./notation";

/**
 * Six-point periodontal chart.
 *
 * One column per tooth, one row per measurement. Probing depths ≥ 4 mm are
 * flagged amber and ≥ 6 mm red, which is how a hygienist reads the sheet at a
 * glance. Values are entered inline; the chart derives CAL (PD + recession)
 * and the worst-site summary itself.
 */

const depthTone = (value) => {
  if (value == null || value === "") return "text-ink-faint";
  const depth = Number(value);
  if (depth >= 6) return "text-danger font-bold";
  if (depth >= 4) return "text-[#B27B04] font-bold";
  return "text-ink";
};

function Cell({ value, onChange, readOnly, tone, ariaLabel }) {
  if (readOnly) {
    return (
      <span className={cn("flex h-7 w-full items-center justify-center text-[12px]", tone)}>
        {value ?? "–"}
      </span>
    );
  }
  return (
    <input
      aria-label={ariaLabel}
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value.replace(/[^\d]/g, "").slice(0, 2))}
      className={cn(
        "h-7 w-full rounded border border-transparent bg-transparent text-center text-[12px] transition focus:border-brand-400 focus:bg-white focus:outline-none",
        tone
      )}
    />
  );
}

function ArchTable({ arch, label, data, onChange, readOnly, notation }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-brand-500" />
        <h4 className="text-[13px] font-bold text-ink">{label}</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-center">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[92px] bg-white pb-2 text-left text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                Tooth
              </th>
              {arch.map((tooth) => (
                <th
                  key={tooth}
                  className="pb-2 text-[11px] font-bold text-ink"
                  style={{ width: `${100 / arch.length}%` }}
                >
                  {formatTooth(tooth, notation)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { key: "pd", label: "Probing depth", sites: PERIO_SITES },
              { key: "rec", label: "Recession", sites: PERIO_SITES },
            ].map((row) =>
              row.sites.map((site, siteIndex) => (
                <tr key={`${row.key}-${site}`} className="border-t border-slate-50">
                  <td className="sticky left-0 z-10 bg-white py-0.5 text-left">
                    {siteIndex === 0 ? (
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                        {row.label}
                      </span>
                    ) : null}
                    <span className="text-[11px] text-ink-muted">{site}</span>
                  </td>
                  {arch.map((tooth) => {
                    const value = data?.[tooth]?.[row.key]?.[site];
                    return (
                      <td key={tooth} className="px-0.5 py-0.5">
                        <Cell
                          value={value}
                          readOnly={readOnly}
                          ariaLabel={`Tooth ${tooth} ${row.label} ${site}`}
                          tone={row.key === "pd" ? depthTone(value) : "text-ink-muted"}
                          onChange={(next) => onChange?.(tooth, row.key, site, next)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}

            <tr className="border-t border-slate-100 bg-slate-50/60">
              <td className="sticky left-0 z-10 bg-slate-50/60 py-1 text-left text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                Bleeding
              </td>
              {arch.map((tooth) => {
                const bleeding = data?.[tooth]?.bleeding;
                return (
                  <td key={tooth} className="py-1">
                    <button
                      type="button"
                      disabled={readOnly}
                      aria-label={`Bleeding on probing, tooth ${tooth}`}
                      onClick={() => onChange?.(tooth, "bleeding", null, !bleeding)}
                      className={cn(
                        "mx-auto block h-3.5 w-3.5 rounded-full border transition",
                        bleeding
                          ? "border-danger bg-danger"
                          : "border-slate-300 bg-white hover:border-danger/50"
                      )}
                    />
                  </td>
                );
              })}
            </tr>

            <tr className="border-t border-slate-100">
              <td className="sticky left-0 z-10 bg-white py-1 text-left text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                Mobility
              </td>
              {arch.map((tooth) => (
                <td key={tooth} className="px-0.5 py-1">
                  <Cell
                    value={data?.[tooth]?.mobility}
                    readOnly={readOnly}
                    ariaLabel={`Mobility, tooth ${tooth}`}
                    tone="text-ink"
                    onChange={(next) => onChange?.(tooth, "mobility", null, next)}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Worst-site CAL, bleeding index and pocket counts drive the summary strip. */
export function perioSummary(data = {}) {
  let sites = 0;
  let bleeding = 0;
  let pockets4 = 0;
  let pockets6 = 0;
  let maxCal = 0;

  Object.values(data).forEach((tooth) => {
    if (tooth?.bleeding) bleeding += 1;
    PERIO_SITES.forEach((site) => {
      const pd = Number(tooth?.pd?.[site]);
      const rec = Number(tooth?.rec?.[site]) || 0;
      if (!Number.isFinite(pd) || pd === 0) return;
      sites += 1;
      if (pd >= 4) pockets4 += 1;
      if (pd >= 6) pockets6 += 1;
      maxCal = Math.max(maxCal, pd + rec);
    });
  });

  return {
    sites,
    bleeding,
    pockets4,
    pockets6,
    maxCal,
    bopPercent: sites ? Math.round((bleeding / Object.keys(data).length) * 100) : 0,
  };
}

export function PerioChart({
  data = {},
  onChange,
  readOnly = false,
  notation = "fdi",
  className,
}) {
  const summary = useMemo(() => perioSummary(data), [data]);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Max CAL", value: `${summary.maxCal} mm`, tone: summary.maxCal >= 5 ? "danger" : "ink" },
          { label: "Sites ≥ 4 mm", value: summary.pockets4, tone: summary.pockets4 ? "warning" : "ink" },
          { label: "Sites ≥ 6 mm", value: summary.pockets6, tone: summary.pockets6 ? "danger" : "ink" },
          { label: "Bleeding sites", value: summary.bleeding, tone: summary.bleeding ? "warning" : "ink" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 px-3.5 py-2.5">
            <div className="od-label">{item.label}</div>
            <div
              className={cn(
                "mt-1 text-[18px] font-extrabold",
                item.tone === "danger" && "text-danger",
                item.tone === "warning" && "text-[#B27B04]",
                item.tone === "ink" && "text-ink"
              )}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <ArchTable
        arch={UPPER_ARCH}
        label="Maxilla"
        data={data}
        onChange={onChange}
        readOnly={readOnly}
        notation={notation}
      />
      <ArchTable
        arch={LOWER_ARCH}
        label="Mandible"
        data={data}
        onChange={onChange}
        readOnly={readOnly}
        notation={notation}
      />
    </div>
  );
}
