import { cn } from "@/lib/cn";

export function Card({ className, children, as: Tag = "section", ...props }) {
  return (
    <Tag className={cn("od-card flex flex-col", className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className, children }) {
  return (
    <header
      className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}
    >
      <div className="min-w-0">
        {title ? (
          <h3 className="truncate text-[15px] font-bold text-ink">{title}</h3>
        ) : null}
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p>
        ) : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("flex-1 px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <footer className={cn("border-t border-slate-100 px-5 py-3.5", className)}>
      {children}
    </footer>
  );
}

/** Small uppercase caption used all over the dashboard. */
export function Caption({ className, children }) {
  return <span className={cn("od-label", className)}>{children}</span>;
}

/** Big number used inside stat blocks. */
export function Stat({ className, children }) {
  return (
    <span className={cn("text-[26px] font-extrabold leading-none tracking-tight text-ink", className)}>
      {children}
    </span>
  );
}
