import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-soft">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
