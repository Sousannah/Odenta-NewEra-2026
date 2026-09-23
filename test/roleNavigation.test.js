import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";

import { PORTALS, ROLES, portalFor } from "@/auth/roles";
import { ROLE_PERMISSIONS } from "@/auth/permissions";
import { ROLE_NAV, navEntriesOf, navFor } from "@/config/nav";
import { APP_BASE, PLATFORM_BASE, UNI_BASE } from "@/config/paths";

/**
 * The sidebar is a promise. These tests are what make it one.
 *
 * Three claims are checked, and each one failed in production before the
 * per-role split:
 *
 *   1. **A role is offered only its own portal's screens.** A Super Admin
 *      rendered the clinic owner's sidebar, because the shell came from the URL
 *      and the entries came from a permission filter.
 *
 *   2. **Every entry a role is offered is one the SERVER will serve.** Fourteen
 *      clinic entries were offered to the platform account and answered 403,
 *      because the two permission matrices had drifted and nothing compared
 *      them.
 *
 *   3. **No role inherits another role's navigation.** With a shared tree that
 *      was structurally impossible to guarantee; with one file per role it is
 *      true by construction, and asserted here so it stays true.
 */

/* ------------------------------------------------- the server's own matrix */

/**
 * The API's permission matrix, read from the sibling repository.
 *
 * Imported rather than duplicated, because a duplicate is the thing being
 * tested for. The two matrices are *meant* to be separate files — a client that
 * lies about its role must not be able to change the server's answer — and the
 * cost of that separation is exactly the drift this test exists to catch.
 *
 * Skipped with a loud message rather than failing when the backend is not
 * checked out beside the frontend, so a frontend-only clone still runs green.
 * The check belongs in CI, where both are present.
 */
const BACKEND = path.resolve(import.meta.dirname, "..", "..", "Odenta-NewEra-2026-backend");
const backendMatrixPath = path.join(BACKEND, "src", "domain", "permissions.js");
const backendPresent = existsSync(backendMatrixPath);

const serverPermissionsFor = backendPresent
  ? (await import(`file://${backendMatrixPath.replace(/\\/g, "/")}`)).permissionsFor
  : null;

/* --------------------------------------------------------------- helpers */

const asList = (permission) =>
  permission == null ? [] : Array.isArray(permission) ? permission : [permission];

/** Which portal a destination belongs to. Mirrors the router's own rule. */
const portalOfPath = (to) => {
  if (String(to).startsWith(PLATFORM_BASE)) return PORTALS.PLATFORM;
  if (String(to).startsWith(UNI_BASE)) return PORTALS.UNIVERSITY;
  if (String(to).startsWith(APP_BASE)) return PORTALS.CLINIC;
  return null;
};

const EVERY_ROLE = Object.values(ROLES);

/* ----------------------------------------------------------------- tests */

describe("every role has exactly one sidebar", () => {
  it("defines one for each role the product recognises", () => {
    for (const role of EVERY_ROLE) {
      assert.ok(ROLE_NAV[role], `${role} has no sidebar — it would render an empty shell`);
    }
  });

  it("returns nothing for a role nobody has written one for", () => {
    /* The correct failure direction. A role with no sidebar must render empty
       and be obvious, never inherit somebody else's — which is precisely how
       the platform account came to have the clinic owner's. */
    const nav = navFor({ role: "role_that_does_not_exist", permissions: [] });
    assert.deepEqual(nav, { sections: [], footer: [] });
  });

  it("never lets one role's entries appear in another role's sidebar by accident", () => {
    /**
     * Two roles legitimately share a destination — every clinic role reaches
     * `/app/patients`. What must not happen is two roles sharing an entry
     * *object*, which is how a shared registry leaks: change it for one role and
     * it changes for all of them.
     *
     * Shared constants inside a single file (the `support` row) are fine and
     * intended; what is checked is that no entry is shared across the portal
     * boundary, which is the leak that mattered.
     */
    const seen = new Map();
    for (const role of EVERY_ROLE) {
      for (const entry of navEntriesOf(role)) {
        const previous = seen.get(entry);
        if (previous && portalFor(previous) !== portalFor(role)) {
          assert.fail(
            `entry "${entry.label}" is the same object in ${previous} (${portalFor(previous)}) and ${role} (${portalFor(role)})`
          );
        }
        seen.set(entry, role);
      }
    }
  });
});

describe("a role is only offered its own portal", () => {
  for (const role of EVERY_ROLE) {
    it(`${role} — every destination belongs to the ${portalFor(role)} portal`, () => {
      for (const entry of navEntriesOf(role)) {
        const destination = portalOfPath(entry.to);
        if (destination === null) continue; // a relative dashboard path
        assert.equal(
          destination,
          portalFor(role),
          `${role} is offered "${entry.label}" → ${entry.to}, which is a ${destination} screen`
        );
      }
    });
  }

  it("the platform account is offered no tenant screen at all", () => {
    /**
     * The regression test for the bug this whole change was opened for.
     *
     * Before the split, a Super Admin opening `/app` rendered: Reservations,
     * Patients, Recalls, Treatments, Staff List, Lab Cases, Sterilisation,
     * Accounts, Sales, Purchases, Stocks, Peripherals, Report and Audit Log.
     * That is the clinic owner's sidebar under a Super Admin badge.
     */
    const entries = navEntriesOf(ROLES.SUPERADMIN);
    assert.ok(entries.length > 0, "the console should not be empty");

    const tenantScreens = entries.filter((entry) => {
      const destination = portalOfPath(entry.to);
      return destination === PORTALS.CLINIC || destination === PORTALS.UNIVERSITY;
    });

    assert.deepEqual(
      tenantScreens.map((entry) => `${entry.label} → ${entry.to}`),
      [],
      "the platform account reaches a tenant through an audited preview, never through its own sidebar"
    );
  });
});

describe("the client never offers what the server will refuse", { skip: backendPresent ? false : "backend repo not checked out beside this one" }, () => {
  for (const role of EVERY_ROLE) {
    it(`${role} — the API grants every permission this sidebar names`, () => {
      const granted = new Set(serverPermissionsFor(role));

      for (const entry of navEntriesOf(role)) {
        const required = asList(entry.permission);
        if (!required.length) continue;

        /* `any of these`, matching how the sidebar and the route guard both
           evaluate a list. */
        const satisfiable = required.some((permission) => granted.has(permission));
        assert.ok(
          satisfiable,
          `${role} is offered "${entry.label}" (${entry.to}) which needs ${required.join(" or ")}, ` +
            `and the server's matrix grants that role none of them — this entry would answer 403`
        );
      }
    });
  }

  it("the two matrices agree about the platform account", () => {
    /**
     * The specific drift that caused the bug, pinned.
     *
     * The client granted `superadmin` fourteen clinic permissions the server
     * had never heard of. Comparing the whole set — rather than just the
     * sidebar's subset — is what stops the next one going unnoticed while its
     * screens are still unbuilt.
     */
    const client = new Set(ROLE_PERMISSIONS[ROLES.SUPERADMIN]);
    const server = new Set(serverPermissionsFor(ROLES.SUPERADMIN));

    const clientOnly = [...client].filter((permission) => !server.has(permission)).sort();
    assert.deepEqual(clientOnly, [], "the client grants the platform account permissions the API does not");

    const serverOnly = [...server].filter((permission) => !client.has(permission)).sort();
    assert.deepEqual(serverOnly, [], "the API grants the platform account permissions the client does not");
  });

  for (const role of EVERY_ROLE) {
    it(`${role} — the client grants nothing the API withholds`, () => {
      const server = new Set(serverPermissionsFor(role));
      const clientOnly = (ROLE_PERMISSIONS[role] ?? [])
        .filter((permission) => !server.has(permission))
        .sort();

      assert.deepEqual(
        clientOnly,
        [],
        `the client believes ${role} holds permissions the API will not honour — every screen behind them 403s`
      );
    });
  }
});
