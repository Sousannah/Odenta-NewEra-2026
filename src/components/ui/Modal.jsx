import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

const WIDTHS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

function useLockScroll(active) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

/**
 * Centered dialog. `stacked` renders it slightly offset so a second dialog can
 * sit on top of the first one (the "stackable dialogs" pattern in Zendenta).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
  className,
  bodyClassName,
  closeIcon = "x",
  hideOverlay = false,
}) {
  useLockScroll(open);
  useEscape(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className={cn(
          "fixed inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]",
          hideOverlay && "bg-transparent backdrop-blur-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative my-auto w-full animate-scale-in rounded-3xl bg-white shadow-pop",
          WIDTHS[size],
          className
        )}
      >
        {title ? (
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm text-ink-muted">{description}</p>
              ) : null}
            </div>
            <IconButton
              label="Close"
              size="sm"
              onClick={onClose}
              className="bg-slate-100 text-ink-muted hover:bg-slate-200"
            >
              {closeIcon === "chevron" ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </IconButton>
          </header>
        ) : null}

        <div className={cn("max-h-[70vh] overflow-y-auto px-6 py-5", bodyClassName)}>
          {children}
        </div>

        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

/** Right-hand slide-over used for the reservation detail panel. */
export function Drawer({
  open,
  onClose,
  width = "max-w-[560px]",
  className,
  children,
  overlay = true,
}) {
  useLockScroll(open);
  useEscape(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      {overlay ? (
        <div
          className="absolute inset-0 animate-fade-in bg-slate-900/35"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex h-full w-full animate-slide-in-right flex-col bg-white shadow-panel",
          width,
          className
        )}
      >
        {children}
      </aside>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  tone = "danger",
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-ink-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-ink-muted hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
          className={cn(
            "h-10 rounded-xl px-4 text-sm font-semibold text-white",
            tone === "danger" ? "bg-danger" : "bg-brand-600"
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
