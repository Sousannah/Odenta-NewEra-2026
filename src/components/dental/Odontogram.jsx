import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  LOWER_ARCH,
  PRIMARY_LOWER_ARCH,
  PRIMARY_UPPER_ARCH,
  UPPER_ARCH,
  formatTooth,
  isAnterior,
  toothKind,
} from "./notation";

/**
 * Interactive odontogram.
 *
 * Teeth are laid out on two half-ellipse arches so the chart reads like the
 * mouth rather than a grid. Each tooth can be charted whole (extraction,
 * implant, missing) or per surface (caries, restoration) — the five surface
 * hit areas are drawn as a Mesial/Distal/Buccal/Lingual ring around an
 * Occlusal or Incisal centre.
 *
 * props
 *  - findings: { [tooth]: { tone, surfaces?: { [code]: tone } } }
 *  - selected / onSelectTooth / onSelectSurface
 *  - dentition: "permanent" | "primary" | "mixed"
 */

const VIEW_W = 520;
const VIEW_H = 640;

const ARCH_PERMANENT = {
  upper: { cx: VIEW_W / 2, cy: 306, rx: 174, ry: 214, from: 180, to: 360 },
  lower: { cx: VIEW_W / 2, cy: 334, rx: 174, ry: 214, from: 180, to: 0 },
};

const ARCH_PRIMARY = {
  upper: { cx: VIEW_W / 2, cy: 306, rx: 128, ry: 158, from: 180, to: 360 },
  lower: { cx: VIEW_W / 2, cy: 334, rx: 128, ry: 158, from: 180, to: 0 },
};

/* Surface charting needs a bigger target than a read-only glyph does. */
const SIZE = {
  incisor: 23,
  canine: 25,
  premolar: 28,
  molar: 32,
};

/** One palette for every clinical state, shared with the legend. */
export const TONE_STYLE = {
  idle: { fill: "#FFFFFF", stroke: "#CBD5E1", text: "#94A3B8" },
  healthy: { fill: "#EAF7F1", stroke: "#8ED3B4", text: "#199473" },
  treated: { fill: "#A5B8F7", stroke: "#7A93F2", text: "#3D56E8" },
  planned: { fill: "#FDE3A7", stroke: "#F7BA21", text: "#B27B04" },
  danger: { fill: "#FBD0DE", stroke: "#E45689", text: "#C93C6E" },
  warning: { fill: "#FDE3A7", stroke: "#F7BA21", text: "#B27B04" },
  missing: { fill: "#F1F5F9", stroke: "#E2E8F0", text: "#CBD5E1" },
  selected: { fill: "#DDE5FD", stroke: "#405BE6", text: "#3D56E8" },
};

const styleFor = (tone) => TONE_STYLE[tone] ?? TONE_STYLE.idle;

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
      labelX: arch.cx + (arch.rx + 34) * Math.cos(radians),
      labelY: arch.cy + (arch.ry + 34) * Math.sin(radians),
    };
  });
}

/**
 * Surface map drawn as four trapezoid wedges around a centre square —
 * the standard "tooth diagram" clinicians expect on a charting screen.
 */
function SurfaceTooth({ tooth, size, finding, onSurface, interactive }) {
  const half = size / 2;
  const inset = size * 0.31;
  const surfaces = finding?.surfaces ?? {};
  const centreCode = isAnterior(tooth) ? "I" : "O";

  const wedge = (code, points) => {
    const tone = surfaces[code];
    const look = styleFor(tone);
    return (
      <polygon
        key={code}
        points={points}
        fill={tone ? look.fill : "#FFFFFF"}
        stroke={tone ? look.stroke : "#CBD5E1"}
        strokeWidth={1}
        className={cn(interactive && "cursor-pointer hover:brightness-95")}
        onClick={
          interactive
            ? (event) => {
                event.stopPropagation();
                onSurface?.(tooth, code);
              }
            : undefined
        }
      >
        <title>{`${tooth} · ${code}`}</title>
      </polygon>
    );
  };

  const tl = `${-half},${-half}`;
  const tr = `${half},${-half}`;
  const bl = `${-half},${half}`;
  const br = `${half},${half}`;
  const itl = `${-half + inset},${-half + inset}`;
  const itr = `${half - inset},${-half + inset}`;
  const ibl = `${-half + inset},${half - inset}`;
  const ibr = `${half - inset},${half - inset}`;

  const centreTone = surfaces[centreCode];
  const centreLook = styleFor(centreTone);

  return (
    <g>
      {/* top wedge = Buccal for uppers as drawn, kept consistent per quadrant */}
      {wedge("B", `${tl} ${tr} ${itr} ${itl}`)}
      {wedge("L", `${bl} ${br} ${ibr} ${ibl}`)}
      {wedge("M", `${tl} ${itl} ${ibl} ${bl}`)}
      {wedge("D", `${tr} ${itr} ${ibr} ${br}`)}
      <rect
        x={-half + inset}
        y={-half + inset}
        width={size - inset * 2}
        height={size - inset * 2}
        rx={2}
        fill={centreTone ? centreLook.fill : "#FFFFFF"}
        stroke={centreTone ? centreLook.stroke : "#CBD5E1"}
        strokeWidth={1}
        className={cn(interactive && "cursor-pointer hover:brightness-95")}
        onClick={
          interactive
            ? (event) => {
                event.stopPropagation();
                onSurface?.(tooth, centreCode);
              }
            : undefined
        }
      >
        <title>{`${tooth} · ${centreCode}`}</title>
      </rect>
    </g>
  );
}

/** Simplified whole-tooth glyph used when surface charting is off. */
function WholeTooth({ kind, look, size }) {
  const width = kind === "molar" ? size : kind === "premolar" ? size * 0.85 : size * 0.72;
  const height = size * 1.05;
  return (
    <g>
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={kind === "incisor" ? 7 : 6}
        fill={look.fill}
        stroke={look.stroke}
        strokeWidth={1.6}
      />
      {kind === "molar" ? (
        <>
          <circle cx={-4.5} cy={-4} r={2.4} fill="none" stroke={look.stroke} strokeWidth={1} />
          <circle cx={4.5} cy={-4} r={2.4} fill="none" stroke={look.stroke} strokeWidth={1} />
          <circle cx={-4.5} cy={4} r={2.4} fill="none" stroke={look.stroke} strokeWidth={1} />
          <circle cx={4.5} cy={4} r={2.4} fill="none" stroke={look.stroke} strokeWidth={1} />
        </>
      ) : null}
      {kind === "premolar" ? (
        <>
          <circle cx={-3.6} cy={0} r={2.6} fill="none" stroke={look.stroke} strokeWidth={1} />
          <circle cx={3.6} cy={0} r={2.6} fill="none" stroke={look.stroke} strokeWidth={1} />
        </>
      ) : null}
      {kind === "canine" ? (
        <path d="M 0 -8 L 0 8" stroke={look.stroke} strokeWidth={1} strokeLinecap="round" />
      ) : null}
      {kind === "incisor" ? (
        <path
          d="M -4.5 -3 Q 0 1 4.5 -3"
          stroke={look.stroke}
          strokeWidth={1}
          strokeLinecap="round"
          fill="none"
        />
      ) : null}
    </g>
  );
}

export function Odontogram({
  findings = {},
  selected,
  onSelectTooth,
  onSelectSurface,
  renderPopover,
  notation = "fdi",
  dentition = "permanent",
  surfaceMode = false,
  readOnly = false,
  showLabels = true,
  legend,
  className,
}) {
  const [openTooth, setOpenTooth] = useState(null);

  const nodes = useMemo(() => {
    const layout = [];
    if (dentition !== "primary") {
      layout.push(...layoutArch(UPPER_ARCH, ARCH_PERMANENT.upper));
      layout.push(...layoutArch(LOWER_ARCH, ARCH_PERMANENT.lower));
    }
    if (dentition !== "permanent") {
      layout.push(...layoutArch(PRIMARY_UPPER_ARCH, ARCH_PRIMARY.upper));
      layout.push(...layoutArch(PRIMARY_LOWER_ARCH, ARCH_PRIMARY.lower));
    }
    return layout;
  }, [dentition]);

  const selectedSet = useMemo(
    () => new Set(Array.isArray(selected) ? selected : selected != null ? [selected] : []),
    [selected]
  );

  const activeNode = openTooth ? nodes.find((node) => node.tooth === openTooth) : null;

  const handleTooth = (tooth) => {
    if (readOnly) return;
    onSelectTooth?.(tooth);
    if (renderPopover) setOpenTooth((prev) => (prev === tooth ? null : tooth));
  };

  const handleSurface = (tooth, surface) => {
    if (readOnly) return;
    onSelectSurface?.(tooth, surface);
    onSelectTooth?.(tooth);
    if (renderPopover) setOpenTooth(tooth);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full select-none"
        role="img"
        aria-label="Odontogram"
      >
        <line x1={VIEW_W / 2} y1={70} x2={VIEW_W / 2} y2={570} stroke="#F1F5F9" strokeWidth={1.5} />
        <line x1={54} y1={VIEW_H / 2} x2={VIEW_W - 54} y2={VIEW_H / 2} stroke="#F1F5F9" strokeWidth={1.5} />

        {nodes.map((node) => {
          const finding = findings[node.tooth];
          const isSelected = selectedSet.has(node.tooth);
          const tone = isSelected ? "selected" : finding?.tone;
          const look = styleFor(tone);
          const kind = toothKind(node.tooth);
          const size = SIZE[kind];
          const useSurfaces = surfaceMode && finding?.tone !== "missing";

          return (
            <g key={node.tooth}>
              {showLabels ? (
                <text
                  x={node.labelX}
                  y={node.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontWeight="800"
                  fill={look.text}
                >
                  {formatTooth(node.tooth, notation)}
                </text>
              ) : null}

              <g
                transform={`translate(${node.x}, ${node.y}) rotate(${node.rotation})`}
                onClick={() => handleTooth(node.tooth)}
                className={cn(!readOnly && "cursor-pointer")}
              >
                {isSelected ? (
                  <circle
                    r={size * 0.95}
                    fill="none"
                    stroke="#405BE6"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                ) : null}

                {useSurfaces ? (
                  <SurfaceTooth
                    tooth={node.tooth}
                    size={size}
                    finding={finding}
                    onSurface={handleSurface}
                    interactive={!readOnly}
                  />
                ) : (
                  <WholeTooth kind={kind} look={look} size={size} />
                )}

                {finding?.tone === "missing" ? (
                  <g stroke="#94A3B8" strokeWidth={1.6} strokeLinecap="round">
                    <line x1={-size / 2} y1={-size / 2} x2={size / 2} y2={size / 2} />
                    <line x1={size / 2} y1={-size / 2} x2={-size / 2} y2={size / 2} />
                  </g>
                ) : null}

                {finding?.badge ? (
                  <circle cx={size * 0.5} cy={-size * 0.55} r={3.5} fill={styleFor(finding.badge).stroke} />
                ) : null}
              </g>
            </g>
          );
        })}
      </svg>

      {activeNode && renderPopover ? (
        <div
          className="absolute z-20 w-[272px] animate-scale-in"
          style={{
            left: `${(activeNode.x / VIEW_W) * 100}%`,
            top: `${(activeNode.y / VIEW_H) * 100}%`,
            transform:
              activeNode.x > VIEW_W / 2 ? "translate(-104%, -50%)" : "translate(4%, -50%)",
          }}
        >
          {renderPopover(activeNode.tooth, () => setOpenTooth(null))}
        </div>
      ) : null}

      {legend ? <div className="mt-3">{legend}</div> : null}
    </div>
  );
}

export function OdontogramLegend({ items }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-2 text-[12px] font-medium text-ink-muted"
        >
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{
              background: styleFor(item.tone).fill,
              borderColor: styleFor(item.tone).stroke,
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export const DEFAULT_LEGEND = [
  { tone: "danger", label: "Active finding" },
  { tone: "planned", label: "Planned treatment" },
  { tone: "treated", label: "Completed treatment" },
  { tone: "missing", label: "Missing" },
];
