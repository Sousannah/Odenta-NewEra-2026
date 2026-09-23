import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { isAnterior } from "@/components/dental/notation";
import { Card, CardBody } from "@/components/ui/Card";
import "./toothChart.css";

/**
 * The odontogram's shared vocabulary and drawing.
 *
 * A student charts a mouth and a supervisor reads the chart back, sometimes
 * days later — if those two screens each held their own colour table, a
 * "Decayed" tooth would eventually be red on one and grey on the other. There
 * is one table, and it lives here.
 */

export const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const isUpperTooth = (tooth) => [1, 2].includes(Number(String(tooth)[0]));

/**
 * Which five surfaces a given tooth actually has.
 *
 * A tooth has five, not seven: an incisor has an incisal edge and no occlusal
 * table, and the tongue side is palatal above and lingual below. Offering all
 * seven names lets a student chart "occlusal" on an upper incisor, which then
 * fails to fill the diagram — the list and the drawing have to agree, so both
 * read from here.
 */
export const surfacesFor = (tooth) => [
  isAnterior(tooth) ? "incisal" : "occlusal",
  "buccal",
  "mesial",
  isUpperTooth(tooth) ? "palatal" : "lingual",
  "distal",
];

export const PROCEDURE_CATEGORIES = [
  {
    title: "Restorative",
    items: [
      { id: "composite", name: "Composite", color: "#4CA3D8" },
      { id: "amalgam", name: "Amalgam", color: "#8C8C8C" },
      { id: "filling", name: "Filling", color: "#7CBEEB" },
    ],
  },
  {
    title: "Prosthodontics",
    items: [
      { id: "crown", name: "Crown", color: "#FFD700" },
      { id: "implant", name: "Implant", color: "#FFA500" },
    ],
  },
  { title: "Endodontics", items: [{ id: "rootCanal", name: "Root Canal", color: "#FF4444" }] },
  { title: "Oral Surgery", items: [{ id: "extraction", name: "Extraction", color: "#666666" }] },
  { title: "Periodontics", items: [{ id: "scaling", name: "Scaling", color: "#20B2AA" }] },
];

export const CONDITION_CATEGORIES = [
  {
    title: "Pathological",
    items: [
      { id: "decayed", name: "Decayed", color: "#FF4444" },
      { id: "cracked", name: "Cracked", color: "#8B0000" },
      { id: "fractured", name: "Fractured", color: "#800000" },
      { id: "abscess", name: "Abscess", color: "#FF0000" },
    ],
  },
  {
    title: "Status",
    items: [
      { id: "missing", name: "Missing", color: "#666666" },
      { id: "filled", name: "Filled", color: "#FFD700" },
      { id: "healthy", name: "Healthy", color: "#32CD32" },
    ],
  },
];

export const ALL_PROCEDURES = PROCEDURE_CATEGORIES.flatMap((category) => category.items);
export const ALL_CONDITIONS = CONDITION_CATEGORIES.flatMap((category) => category.items);

const byName = (list, name) => list.find((item) => item.name === name) ?? null;

/** A charted tooth's colour: the procedure wins, then the condition. */
export const colourFor = (entry) => {
  if (!entry) return null;
  if (entry.procedure && entry.procedure !== "N/A") {
    return byName(ALL_PROCEDURES, entry.procedure)?.color ?? null;
  }
  if (entry.condition && entry.condition !== "N/A") {
    return byName(ALL_CONDITIONS, entry.condition)?.color ?? null;
  }
  return null;
};

/* ------------------------------------------------------------ the diagram */

/**
 * One tooth's five surfaces.
 *
 * Drawn as a square with the four axial surfaces folded out from an occlusal
 * (or incisal) centre — the standard chairside shorthand.
 */
export function ToothSurfaces({ toothNumber, entry, interactive = false, onToggleSurface }) {
  const selected = entry?.surfaces ?? [];
  const tone = colourFor(entry);
  const fill = (surface) => (selected.includes(surface) && tone ? tone : "#FFFFFF");

  const [centre, , , inner] = surfacesFor(toothNumber);

  const surfaceProps = (surface) => ({
    className: "od-surface",
    fill: fill(surface),
    onClick: interactive ? () => onToggleSurface?.(surface) : undefined,
  });

  return (
    <div className={cn("od-tooth-surfaces", interactive && "is-interactive")}>
      <svg viewBox="0 0 300 300" role="img" aria-label={`Tooth ${toothNumber} surfaces`}>
        <rect x="75" y="75" width="150" height="150" {...surfaceProps(centre)} />
        <polygon points="0 0 300 0 225 75 75 75" {...surfaceProps("buccal")} />
        <polygon points="300 0 300 300 225 225 225 75" {...surfaceProps("mesial")} />
        <polygon points="300 300 0 300 75 225 225 225" {...surfaceProps(inner)} />
        <polygon points="0 300 0 0 75 75 75 225" {...surfaceProps("distal")} />
      </svg>
    </div>
  );
}

export function Tooth({ number, upper, entry, selected, onSelect }) {
  const tone = colourFor(entry);
  return (
    <div className={cn("od-tooth-slot", upper ? "is-upper" : "is-lower")}>
      <ToothSurfaces toothNumber={number} entry={entry} />
      <button
        type="button"
        onClick={() => onSelect?.(number)}
        style={tone ? { "--tooth-dot": tone } : undefined}
        className={cn("od-tooth od-focus", selected && "is-selected", tone && "is-charted")}
      >
        <img src={`/imgs/teeth/${number}.png`} alt={`Tooth ${number}`} className="od-tooth-image" />
        <span className="od-tooth-number">{number}</span>
      </button>
    </div>
  );
}

/** Coloured pill for a condition or procedure name. */
export function Swatch({ name, list }) {
  const item = byName(list, name);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
      style={{
        backgroundColor: `${item?.color ?? "#94a3b8"}22`,
        color: item?.color ?? "#475569",
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item?.color ?? "#94a3b8" }} />
      {name}
    </span>
  );
}

/* ------------------------------------------------------------- the legend */

export function ChartLegend() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="od-focus flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-[15px] font-bold text-ink">Colour reference guide</span>
        <ChevronDown className={cn("h-4 w-4 text-ink-soft transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <CardBody className="grid gap-6 border-t border-slate-100 pt-4 md:grid-cols-2">
          {[
            { heading: "Procedures", groups: PROCEDURE_CATEGORIES },
            { heading: "Conditions", groups: CONDITION_CATEGORIES },
          ].map((column) => (
            <div key={column.heading}>
              <h4 className="mb-3 text-[13px] font-bold text-ink">{column.heading}</h4>
              {column.groups.map((group) => (
                <div key={group.title} className="mb-4">
                  <span className="od-label">{group.title}</span>
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                    {group.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-[13px] text-ink-muted">
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </CardBody>
      ) : null}
    </Card>
  );
}
