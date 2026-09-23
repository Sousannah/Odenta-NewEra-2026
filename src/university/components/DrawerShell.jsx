import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Drawer } from "@/components/ui/Modal";
import { IconButton } from "@/components/ui/Button";

/**
 * `Drawer` is a bare panel by design. Every university drawer wants the same
 * three bands — sticky header, scrolling body, sticky footer — so that shape
 * lives here rather than being re-typed on each screen.
 */
export function DrawerShell({
  open,
  onClose,
  title,
  description,
  badges,
  footer,
  width,
  className,
  children,
}) {
  return (
    <Drawer open={open} onClose={onClose} width={width} className={className}>
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-extrabold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 truncate text-[13px] text-ink-muted">{description}</p>
          ) : null}
          {badges ? <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div> : null}
        </div>
        <IconButton label="Close" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </header>

      <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-5")}>{children}</div>

      {footer ? (
        <footer className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">{footer}</footer>
      ) : null}
    </Drawer>
  );
}
