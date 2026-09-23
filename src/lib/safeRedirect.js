/**
 * A destination the app is willing to navigate to.
 *
 * ## Why this exists even though nothing currently feeds it a hostile value
 *
 * The one post-sign-in redirect in the product reads `location.state.from`,
 * which `RequireAuth` sets to `location.pathname`. Router state is not settable
 * from a URL, so there is no open redirect today.
 *
 * Two things make that worth defending anyway.
 *
 * The first is that `react-router-dom` at the version this app pins carries
 * GHSA-wrjc-x8rr-h8h6 — an open redirect via a backslash in `<Link to>` and
 * `useNavigate`, a bypass of the earlier CVE-2025-68470. `navigate("\\/evil.com")`
 * leaves the origin. The library fix is a major-version upgrade across sixty
 * routes; this makes the app safe without waiting for it, and keeps it safe if
 * the next bypass lands before the upgrade does.
 *
 * The second is that "remember where they were heading" is the feature that
 * grows a `?redirect=` query parameter the moment somebody needs to link
 * straight into a screen from an email. That is the same line of code with an
 * attacker-controlled input, and by then the check has to be remembered rather
 * than already being there.
 *
 * ## What counts as safe
 *
 * Exactly one shape: a path beginning with a single forward slash. Everything
 * else is refused and the caller falls back to the role's own home.
 *
 *   `/app/patients`        ✓ an internal route
 *   `//evil.example`       ✗ protocol-relative — the browser treats it as a host
 *   `/\evil.example`       ✗ the backslash bypass the advisory is about
 *   `\\/evil.example`      ✗ same, with the slashes the other way round
 *   `https://evil.example` ✗ absolute
 *   `javascript:alert(1)`  ✗ a scheme, and the worst one
 *
 * Backslashes are normalised to forward slashes *before* the test rather than
 * merely rejected, because the browser does that normalisation too — and a
 * check that disagrees with the browser about what a string means is a check
 * that can be walked past.
 */

/** Schemes are refused wholesale; only same-origin paths are ever returned. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * @param {unknown} candidate  a path the app was asked to go to
 * @param {string} fallback    where to go when it is not one we will accept
 * @returns {string} always an internal path
 */
export function safeInternalPath(candidate, fallback = "/") {
  if (typeof candidate !== "string" || candidate === "") return fallback;

  /* `\` is a path separator to every browser's URL parser, so `/\evil.example`
     resolves as `//evil.example` and leaves the origin. Normalise first, then
     judge the result — the same string the browser would act on. */
  const normalised = candidate.replace(/\\/g, "/");

  if (HAS_SCHEME.test(normalised)) return fallback;

  /* A single leading slash, and never two: `//host` is protocol-relative. */
  if (!normalised.startsWith("/") || normalised.startsWith("//")) return fallback;

  /* Control characters are stripped by the URL parser before it decides what a
     string means, so `/\tevil` and `/\n/evil.example` must be judged on what is
     left rather than on what was typed. */
  /* eslint-disable-next-line no-control-regex -- matching control characters
     is the whole point of this line. The rule exists to catch the ones that end
     up in a pattern by accident, and a literal tab inside a character class is
     exactly how that happens — so the escapes are also what makes this
     readable. */
  if (/[\x00-\x1f\x7f]/.test(normalised)) return fallback;

  return normalised;
}
