import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/site/i18n/LanguageContext";
import { SiteButton } from "./SiteButton";

/** Label, control, and a field-level error — every input on the site. */
export function Field({ label, htmlFor, error, required, className, children }) {
  const t = useT();
  return (
    <label htmlFor={htmlFor} className={cn("flex flex-col gap-2", className)}>
      <span className="s-muted text-[13.5px] font-medium">
        {t(label)}
        {required ? <span className="s-accent ms-1">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-[13px] font-medium text-rose-500">{t(error)}</span> : null}
    </label>
  );
}

/** What a form turns into once it has been sent. */
export function FormSuccess({ title, body, again, onAgain }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-5 px-4 py-14 text-center">
      <span className="s-icon-tile h-16 w-16 !rounded-full">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h3 className="text-[24px]">{t(title)}</h3>
      <p className="s-muted max-w-sm text-[15.5px] leading-relaxed">{t(body)}</p>
      {onAgain ? (
        <SiteButton variant="glass" size="sm" onClick={onAgain}>
          {t(again)}
        </SiteButton>
      ) : null}
    </div>
  );
}

/**
 * Field errors from a 422.
 *
 * The API's `details` may be `{ field: message }` or a list of
 * `{ path, message }`; either way the form only needs to know which fields.
 */
export function fieldErrors(cause) {
  const details = cause?.details;
  if (!details) return null;
  if (Array.isArray(details)) {
    return Object.fromEntries(
      details.map((item) => [Array.isArray(item.path) ? item.path[0] : item.path ?? item.field, true]).filter(([key]) => key)
    );
  }
  if (typeof details === "object") return details;
  return null;
}
