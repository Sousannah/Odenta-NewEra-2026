import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <AlertTriangle className="h-5 w-5 text-danger" />,
  info: <Info className="h-5 w-5 text-brand-600" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type: "success", ...toast }]);
      setTimeout(() => dismiss(id), toast.duration ?? 3600);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (title, description) => push({ type: "success", title, description }),
      error: (title, description) => push({ type: "error", title, description }),
      info: (title, description) => push({ type: "info", title, description }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-5 top-5 z-[60] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex animate-scale-in items-start gap-3 rounded-2xl border bg-white p-4 shadow-pop",
                toast.type === "success" && "border-success/25",
                toast.type === "error" && "border-danger/25",
                toast.type === "info" && "border-brand-200"
              )}
            >
              {ICONS[toast.type]}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink">{toast.title}</div>
                {toast.description ? (
                  <div className="mt-0.5 text-[12px] text-ink-muted">{toast.description}</div>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-ink-faint transition hover:bg-slate-100 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
