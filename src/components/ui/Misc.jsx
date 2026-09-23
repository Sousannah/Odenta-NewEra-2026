import { useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Info,
  Minus,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------- search box */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  inputClassName,
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm text-ink placeholder:text-ink-faint transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10",
          inputClassName
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange?.("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint transition hover:bg-slate-100 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ info banner */

const BANNER_TONES = {
  info: "bg-brand-50 text-brand-800",
  warning: "bg-warning-soft text-warning-ink",
  success: "bg-success-soft text-success-strong",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-slate-50 text-ink-muted",
};

export function InfoBanner({ tone = "info", icon, action, className, children }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium",
        BANNER_TONES[tone],
        className
      )}
    >
      <span className="shrink-0">{icon ?? <Info className="h-4 w-4" />}</span>
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}

/* --------------------------------------------------------- number stepper */

export function Counter({ value, onChange, min = 0, max = 9999, suffix, className }) {
  const clamp = (next) => Math.min(Math.max(next, min), max);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => onChange?.(clamp(value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-muted transition hover:border-slate-300 hover:text-ink disabled:opacity-40"
          disabled={value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-ink">{value}</span>
        <button
          type="button"
          aria-label="Increase"
          onClick={() => onChange?.(clamp(value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-ink-muted transition hover:border-slate-300 hover:text-ink disabled:opacity-40"
          disabled={value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {suffix ? <span className="text-xs text-ink-soft">{suffix}</span> : null}
    </div>
  );
}

/* -------------------------------------------------------------- file drop */

const FILE_ICON = {
  image: <ImageIcon className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  doc: <FileText className="h-4 w-4" />,
};

const FILE_TONE = {
  image: "bg-accent-50 text-accent-700",
  pdf: "bg-danger-soft text-danger-ink",
  doc: "bg-brand-50 text-brand-700",
};

export function FileDrop({ files = [], onAdd, onRemove, maxFiles = 5, maxSizeLabel = "10MB" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list) => {
    const next = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type.startsWith("image/") ? "image" : file.name.endsWith(".pdf") ? "pdf" : "doc",
      progress: 100,
    }));
    onAdd?.(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition",
          dragging ? "border-brand-500 bg-brand-50/60" : "border-slate-200 bg-white"
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-ink-soft">
          <Upload className="h-4 w-4" />
        </span>
        <span className="text-ink-muted">Drag &amp; drop files here</span>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-semibold text-brand-600 hover:text-brand-800"
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-soft">
        <span>Maximum upload file sizes : {maxSizeLabel}</span>
        <span>
          {files.length} of {maxFiles}
        </span>
      </div>

      {files.map((file) => (
        <div key={file.id} className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              FILE_TONE[file.type] ?? FILE_TONE.doc
            )}
          >
            {FILE_ICON[file.type] ?? FILE_ICON.doc}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] font-semibold text-ink">{file.name}</span>
              <span className="shrink-0 text-[11px] text-ink-soft">
                {file.progress >= 100 ? "Completed" : `${file.progress}%`}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[11px] text-ink-soft">{file.size}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-success transition-all"
                  style={{ width: `${file.progress}%` }}
                />
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label={`Remove ${file.name}`}
            onClick={() => onRemove?.(file.id)}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-slate-100 hover:text-danger"
          >
            {file.progress >= 100 ? <Trash2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- pagination */

export function Pagination({ page = 1, pageCount = 1, onChange, total, className }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 7);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 py-3",
        className
      )}
    >
      <span className="text-[13px] text-ink-soft">
        {total != null ? `${total} result${total === 1 ? "" : "s"}` : null}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange?.(page - 1)}
          className="h-8 rounded-lg border border-slate-200 px-3 text-[13px] font-semibold text-ink-muted transition hover:bg-slate-50 disabled:opacity-40"
        >
          Prev
        </button>

        {/* Seven numbered buttons do not fit a phone; it gets "3 / 12" instead. */}
        <span className="px-2 text-[13px] font-semibold text-ink-muted sm:hidden">
          {page} / {pageCount}
        </span>

        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange?.(item)}
            className={cn(
              "hidden h-8 w-8 rounded-lg text-[13px] font-semibold transition sm:block",
              item === page
                ? "bg-brand-600 text-white"
                : "text-ink-muted hover:bg-slate-100"
            )}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange?.(page + 1)}
          className="h-8 rounded-lg border border-slate-200 px-3 text-[13px] font-semibold text-ink-muted transition hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ misc */

export function Divider({ vertical = false, className }) {
  return vertical ? (
    <span className={cn("inline-block w-px self-stretch bg-slate-200", className)} />
  ) : (
    <hr className={cn("border-t border-slate-100", className)} />
  );
}

export function KeyValue({ label, value, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="od-label">{label}</div>
      <div className="mt-1 break-words text-[13px] font-semibold text-ink">{value ?? "—"}</div>
    </div>
  );
}
