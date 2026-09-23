import { CLINIC_NAV } from "./clinicRoles.js";
import { UNIVERSITY_NAV } from "./universityRoles.js";
import { PLATFORM_NAV } from "./superadmin.js";
import { hasPermission } from "@/auth/permissions";

/**
 * The navigation registry: role in, sidebar out.
 *
 * One lookup, not a filter. `navFor("dentist")` returns the Dentist's sidebar
 * because a file says that is the Dentist's sidebar — not because the Dentist's
 * permission set happened to intersect a shared tree in that shape.
 *
 * The distinction is the whole point of the change. See `nav/README.md` for the
 * two failures the filtered version produced; the short version is that a role's
 * navigation used to be an emergent property, and emergent properties change
 * without anybody deciding to change them.
 */

/** Every role that has a sidebar. A role absent from here gets nothing. */
export const ROLE_NAV = { ...CLINIC_NAV, ...UNIVERSITY_NAV, ...PLATFORM_NAV };

const EMPTY = { sections: [], footer: [] };

/**
 * A second gate, deliberately kept.
 *
 * The role decides membership; this catches an entry that was written into the
 * wrong role's file, or a permission a role lost without its sidebar being
 * updated. Belt and braces, and cheap.
 *
 * It is *not* a security control and must never be mistaken for one. A person
 * who edits their session object in a debugger changes what this returns and
 * changes nothing at all about what the server will serve them. The controls are
 * `requirePortal`, `attachScope` / `attachClinicScope` / `attachPlatformScope`
 * and the per-route permission guards, all on the API.
 */
const permitted = (user, item) => !item.permission || hasPermission(user, item.permission);

const prune = (nav, user) => ({
  sections: nav.sections
    .map((section) => ({ ...section, items: section.items.filter((item) => permitted(user, item)) }))
    .filter((section) => section.items.length > 0),
  footer: nav.footer.filter((item) => permitted(user, item)),
});

/**
 * The sidebar for a signed-in user.
 *
 * An unknown role returns an empty sidebar rather than a default one. That is
 * the correct failure direction: a role nobody has written a sidebar for should
 * render nothing and be obvious, not silently inherit somebody else's
 * navigation — which is precisely how the platform account ended up with the
 * clinic owner's.
 */
export function navFor(user) {
  const nav = ROLE_NAV[user?.role];
  if (!nav) return EMPTY;
  return prune(nav, user);
}

/** Flat list of a role's entries — the top bar reads this to title a route. */
export function navItemsFor(user) {
  const { sections, footer } = navFor(user);
  return [...sections.flatMap((section) => section.items), ...footer];
}

/**
 * The permission a role's own sidebar declares for a destination.
 *
 * Used by the cross-check test, which walks every role and asserts that each
 * entry's permission is one the **server's** matrix grants that role. Drift
 * between the two matrices — the thing that made fourteen clinic entries render
 * for an account the API would refuse — is now a failing test.
 */
export function navEntriesOf(role) {
  const nav = ROLE_NAV[role];
  if (!nav) return [];
  return [...nav.sections.flatMap((section) => section.items), ...nav.footer];
}
