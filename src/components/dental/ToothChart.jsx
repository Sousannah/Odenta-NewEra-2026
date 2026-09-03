import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { LOWER_ARCH, UPPER_ARCH, toothKind } from "./toothMap";

const VIEW_W = 420;
const VIEW_H = 540;

const ARCH = {
  upper: { cx: VIEW_W / 2, cy: 262, rx: 138, ry: 178, from: 180, to: 360 },
  // swept right-to-left so quadrant 4 (patient's right) sits on the viewer's left
  lower: { cx: VIEW_W / 2, cy: 288, rx: 138, ry: 178, from: 180, to: 0 },
};

const SHAPE = {
  incisor: { w: 17, h: 25, r: 7 },
  canine: { w: 18, h: 27, r: 9 },
  premolar: { w: 21, h: 25, r: 7 },
  molar: { w: 25, h: 26, r: 7 },
};

const STATE_STYLE = {
  idle: { fill: "#FFFFFF", stroke: "#CBD5E1", detail: "#CBD5E1", text: "#94A3B8" },
  treated: { fill: "#A5B8F7", stroke: "#7A93F2", detail: "#5A76EA", text: "#3D56E8" },
  pending: { fill: "#FDE3A7", stroke: "#F7BA21", detail: "#D79A05", text: "#B27B04" },
  finding: { fill: "#FBD0DE", stroke: "#E45689", detail: "#C93C6E", text: "#C93C6E" },
  selected: { fill: "#DDE5FD", stroke: "#405BE6", detail: "#405BE6", text: "#3D56E8" },
  disabled: { fill: "#F1F5F9", stroke: "#E2E8F0", detail: "#E2E8F0", text: "#CBD5E1" },
};

/** Polar placement of every tooth on its half-ellipse arch. */
function layoutArch(teeth, arch) {
  const step = (arch.to - arch.from) / teeth.length;
  return teeth.map((tooth, index) => {
    const degrees = arch.from + step * (index + 0.5);
    const radians = (degrees * Math.PI) / 180;
    return {
      tooth,
      x: arch.cx + arch.rx * Math.cos(radians),
      y: arch.cy + arch.ry * Math.sin(radians),
      rotation: degrees + 90,
      labelX: arch.cx + (arch.rx + 30) * Math.cos(radians),
      labelY: arch.cy + (arch.ry + 30) * Math.sin(radians),
    };
  });
}

function ToothGlyph({ kind, style }) {
  const { w, h, r } = SHAPE[kind];
  const half = w / 2;

  return (
    <g>
      <rect
        x={-half}
        y={-h / 2}
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={1.6}
      />
      {kind === "molar" ? (
        <>
          <circle cx={-4.5} cy={-4} r={2.4} fill="none" stroke={style.detail} strokeWidth={1.1} />
          <circle cx={4.5} cy={-4} r={2.4} fill="none" stroke={style.detail} strokeWidth={1.1} />
          <circle cx={-4.5} cy={4} r={2.4} fill="none" stroke={style.detail} strokeWidth={1.1} />
          <circle cx={4.5} cy={4} r={2.4} fill="none" stroke={style.detail} strokeWidth={1.1} />
        </>
      ) : null}
      {kind === "premolar" ? (
        <>
          <circle cx={-3.6} cy={0} r={2.8} fill="none" stroke={style.detail} strokeWidth={1.1} />
          <circle cx={3.6} cy={0} r={2.8} fill="none" stroke={style.detail} strokeWidth={1.1} />
        </>
      ) : null}
      {kind === "canine" ? (
        <path
          d="M 0 -8 L 0 8"
          stroke={style.detail}
          strokeWidth={1.1}
          strokeLinecap="round"
          fill="none"
        />
      ) : null}
      {kind === "incisor" ? (
        <path
          d="M -4.5 -3 Q 0 1 4.5 -3"
          stroke={style.detail}
          strokeWidth={1.1}
          strokeLinecap="round"
          fill="none"
        />
      ) : null}
    </g>
  );
}

/**
 * Interactive odontogram.
 *
 * props
 *  - marks: { [toothNumber]: "treated" | "pending" | "finding" }
 *  - selected: number | number[]
 *  - onSelect(tooth)
 *  - disabledTeeth: number[]
 *  - renderPopover(tooth, close) -> node, anchored next to the tooth
 *  - legend: node rendered underneath
 */
export function ToothChart({
  marks = {},
  selected,
  onSelect,
  disabledTeeth = [],
  renderPopover,
  className,
  legend,
  readOnly = false,
  showLabels = true,
}) {
  const [internalOpen, setInternalOpen] = useState(null);

  const upper = useMemo(() => layoutArch(UPPER_ARCH, ARCH.upper), []);
  const lower = useMemo(() => layoutArch(LOWER_ARCH, ARCH.lower), []);
  const all = useMemo(() => [...upper, ...lower], [upper, lower]);

  const selectedSet = useMemo(
    () => new Set(Array.isArray(selected) ? selected : selected != null ? [selected] : []),
    [selected]
  );

  const openTooth = renderPopover ? internalOpen : null;
  const openNode = openTooth ? all.find((item) => item.tooth === openTooth) : null;

  const handleClick = (tooth) => {
    if (readOnly || disabledTeeth.includes(tooth)) return;
    onSelect?.(tooth);
    if (renderPopover) setInternalOpen((prev) => (prev === tooth ? null : tooth));
  };

  const styleFor = (tooth) => {
    if (disabledTeeth.includes(tooth)) return STATE_STYLE.disabled;
    if (selectedSet.has(tooth)) return STATE_STYLE.selected;
    return STATE_STYLE[marks[tooth]] ?? STATE_STYLE.idle;
  };

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full select-none"
        role="img"
        aria-label="Dental chart"
      >
        {/* midlines */}
        <line x1={VIEW_W / 2} y1={70} x2={VIEW_W / 2} y2={470} stroke="#F1F5F9" strokeWidth={1.5} />
        <line x1={54} y1={VIEW_H / 2} x2={VIEW_W - 54} y2={VIEW_H / 2} stroke="#F1F5F9" strokeWidth={1.5} />

        {all.map((node) => {
          const style = styleFor(node.tooth);
          const interactive = !readOnly && !disabledTeeth.includes(node.tooth);
          return (
            <g key={node.tooth}>
              {showLabels ? (
                <text
                  x={node.labelX}
                  y={node.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={style.text}
                >
                  {node.tooth}
                </text>
              ) : null}
              <g
                transform={`translate(${node.x}, ${node.y}) rotate(${node.rotation})`}
                onClick={() => handleClick(node.tooth)}
                className={cn(interactive && "cursor-pointer")}
                style={{ transition: "opacity 120ms" }}
              >
                {selectedSet.has(node.tooth) ? (
                  <circle r={19} fill="none" stroke="#405BE6" strokeWidth={1.5} strokeDasharray="3 3" />
                ) : null}
                <ToothGlyph kind={toothKind(node.tooth)} style={style} />
                {interactive ? (
                  <circle r={17} fill="transparent">
                    <title>{`Tooth ${node.tooth}`}</title>
                  </circle>
                ) : null}
              </g>
            </g>
          );
        })}
      </svg>

      {openNode && renderPopover ? (
        <div
          className="absolute z-20 w-[262px] animate-scale-in"
          style={{
            left: `${(openNode.x / VIEW_W) * 100}%`,
            top: `${(openNode.y / VIEW_H) * 100}%`,
            transform:
              openNode.x > VIEW_W / 2
                ? "translate(-102%, -50%)"
                : "translate(2%, -50%)",
          }}
        >
          {renderPopover(openNode.tooth, () => setInternalOpen(null))}
        </div>
      ) : null}

      {legend ? <div className="mt-2">{legend}</div> : null}
    </div>
  );
}

export function ToothLegend({ items }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2 text-[12px] font-medium text-ink-muted">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
