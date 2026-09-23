import { OdentaLoader } from "@/components/ui/OdentaLoader";

/**
 * Branded splash shown while a lazily-loaded marketing page arrives.
 *
 * The same wordmark loader the portal uses, so a visitor who signs in never
 * sees the wait change character between the site and the app. Transparent,
 * so it sits on whichever theme the site is in.
 */
export function SiteLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <OdentaLoader size="md" label="Loading Odenta" />
    </div>
  );
}

export default SiteLoading;
