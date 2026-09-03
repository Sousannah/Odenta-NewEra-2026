import { cn } from "@/lib/cn";

export function ToothMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <defs>
        <linearGradient id="odMark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5A76EA" />
          <stop offset="100%" stopColor="#3D56E8" />
        </linearGradient>
      </defs>
      <path
        d="M16 3c3 0 4.2-1.2 7.2-1.2C27 1.8 29 4.6 29 8.6c0 4.4-1.6 6.6-2.6 10.4-.9 3.4-1.2 10.8-4.4 10.8-2.7 0-2.6-6.6-6-6.6s-3.3 6.6-6 6.6c-3.2 0-3.5-7.4-4.4-10.8C4.6 15.2 3 13 3 8.6 3 4.6 5 1.8 8.8 1.8 11.8 1.8 13 3 16 3Z"
        fill="url(#odMark)"
      />
      <path
        d="M11.5 8.6c1.4-1 3.1-1.4 4.5-1.4"
        stroke="#fff"
        strokeOpacity="0.8"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ collapsed = false, className }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <ToothMark />
      {!collapsed ? (
        <span className="text-[19px] font-extrabold tracking-tight text-ink">Odenta</span>
      ) : null}
    </div>
  );
}
