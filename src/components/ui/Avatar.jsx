import { cn } from "@/lib/cn";
import { avatarTone, initials } from "@/lib/format";

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-[12px]",
  md: "h-10 w-10 text-[13px]",
  lg: "h-12 w-12 text-[15px]",
  xl: "h-14 w-14 text-[18px]",
};

export function Avatar({ name = "", src, size = "md", className, square = false }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden font-bold",
        square ? "rounded-xl" : "rounded-full",
        SIZES[size],
        src ? "bg-slate-100" : avatarTone(name),
        className
      )}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** Avatar + name + secondary line — used in headers, tables and the calendar. */
export function AvatarCard({ name, label, src, size = "md", className, nameClassName }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar name={name} src={src} size={size} />
      <div className="min-w-0 leading-tight">
        <div className={cn("truncate text-sm font-bold text-ink", nameClassName)}>{name}</div>
        {label ? <div className="truncate text-xs text-ink-soft">{label}</div> : null}
      </div>
    </div>
  );
}
