# Per-role navigation

One module per role. Each file is the **whole** sidebar for that role, written
out, in the order that role reads it.

## Why this replaced the filtered registry

There used to be two shared registries — `config/navigation.js` for the clinic
and `config/universityNavigation.js` for the campus — and each built a role's
sidebar by taking every entry in the tree and keeping the ones whose declared
permission the signed-in user happened to hold.

That is an elegant shape and it has one property that turned out to matter more
than the elegance: **a role's navigation was an emergent result, not a
decision.** Nobody wrote down what a Dentist's sidebar is. It was whatever fell
out of intersecting a twenty-entry tree with a twenty-permission grant, and it
changed silently whenever either side moved.

Two concrete failures came out of that:

1. **Portal bleed.** The shell was chosen by URL prefix, and the sidebar inside
   it by permission. The platform account legitimately holds read permissions on
   both sides of the product, so the moment it opened `/app` it rendered the
   *clinic owner's* navigation — every clinical, financial and inventory entry
   the owner sees. The badge said "Super Admin" and the sidebar said "Dentist".
   Nobody chose that; it was the intersection doing what it was told.

2. **Silent drift against the server.** The frontend matrix granted the platform
   account fourteen clinic permissions the backend's matrix never granted. Those
   entries rendered, were clickable, and answered `403`. A sidebar is a promise
   about what a person can do, and half of this one was a lie that no test could
   catch because no test could know what the sidebar was supposed to contain.

## The contract now

- `navFor(role)` returns that role's sidebar. It is a **lookup by role**, not a
  filter by permission. A role that is not in the registry gets nothing, which
  is the correct failure direction.
- A role cannot inherit another role's entries, because there is no shared tree
  left to inherit from. Adding an entry to the Dentist's file adds it to the
  Dentist and to nobody else.
- Permissions are still declared on every entry, and still checked — but as a
  **second** gate and as the thing the cross-check test reads, not as the
  mechanism that builds the list. Belt and braces: the role decides membership,
  the permission catches a line somebody moved into the wrong file.
- `test/roleNavigation.test.js` asserts that every entry in every role's sidebar
  names a permission that role actually holds in the **backend** matrix. Drift
  is now a failing test rather than a `403` a user discovers.

## The rule for the platform role

`superadmin.js` is the console and nothing else. The platform account has no
clinic sidebar at all — it reaches a tenant's screens through the read-only,
audited preview in the Tenants screen, which the server enforces
(`middleware/clinicScope.js` refuses a platform session with no preview claim).

None of this is the security boundary. The server is. These files decide what a
person is *offered*; `requirePortal`, `attachClinicScope`, `attachScope` and the
per-route permission guards decide what a person *gets*.
