import { cn } from "@/lib/cn";
import { OdentaSpinner } from "./OdentaLoader";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm disabled:bg-slate-200 disabled:text-ink-soft disabled:shadow-none",
  secondary:
    "bg-white text-ink border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:text-ink-faint",
  ghost: "bg-transparent text-ink-muted hover:bg-slate-100 hover:text-ink",
  soft: "bg-brand-100 text-brand-700 hover:bg-brand-200",
  success: "bg-success text-white hover:bg-success-strong shadow-sm",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm",
  "danger-ghost": "bg-white text-danger border border-danger/30 hover:bg-danger-soft",
  link: "bg-transparent text-brand-600 hover:text-brand-800 hover:underline px-0",
};

const SIZES = {
  xs: "h-7 px-2.5 text-[12px] gap-1 rounded-lg",
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-xl",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
};

export function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "od-focus inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        (disabled || loading) && "cursor-not-allowed opacity-70",
        className
      )}
      disabled={Tag === "button" ? disabled || loading : undefined}
      {...props}
    >
      {/* The wordmark loader cannot fit inside a control, so a button waits
          with its compact sibling — inheriting the label colour, which is what
          keeps it legible on both the blue fill and the white outline. */}
      {loading ? <OdentaSpinner size={16} tone="current" /> : leftIcon}
      {children}
      {rightIcon}
    </Tag>
  );
}

export function IconButton({
  size = "md",
  variant = "ghost",
  className,
  label,
  children,
  ...props
}) {
  const box = { xs: "h-7 w-7", sm: "h-8 w-8", md: "h-10 w-10", lg: "h-11 w-11" }[size];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "od-focus inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
        VARIANTS[variant],
        box,
        "px-0",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
