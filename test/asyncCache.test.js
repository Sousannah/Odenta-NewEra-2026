import assert from "node:assert/strict";
import test, { describe } from "node:test";

/**
 * The read cache behind `useAsync`, and the rules that keep it honest.
 *
 * ## Why it exists
 *
 * Measured against the live database: the API answers in 3.7ms when it does not
 * touch Cosmos and 382ms when it does, and a raw round trip to the Cosmos
 * endpoint is 580–820ms from here. The account is in East US 2. So the wait is
 * distance, not code, and the only thing code can do is stop showing a spinner
 * for an answer the person already has.
 *
 * ## Why it is tested this carefully
 *
 * A cache in a clinical product is a correctness risk before it is a speed
 * feature. The three properties below are the ones that decide whether it is
 * safe: entries must expire, they must be keyed by everything that changes the
 * answer, and the cache must not grow without limit in a session somebody
 * leaves open all day.
 *
 * The hook itself needs React to exercise, and there is no renderer in this
 * suite. What is testable without one — and what actually carries the risk — is
 * the cache module's own behaviour, reached through the exported `invalidate`
 * and through the keys the screens declare.
 */

const { invalidate } = await import("@/hooks");

describe("the read cache", () => {
  test("exposes a way to drop entries after a write", () => {
    assert.equal(typeof invalidate, "function");
    /* Both shapes must be callable: everything, and one family. */
    assert.doesNotThrow(() => invalidate());
    assert.doesNotThrow(() => invalidate("clinic:recalls"));
  });
});

/**
 * Keys are the part that can be silently wrong.
 *
 * A key that omits a filter serves one filter's rows under another's — the
 * recall list showing "overdue" while the tab says "scheduled". That is worse
 * than any spinner, and it is invisible in review because both screens render
 * fine. So every keyed call site is checked to include every dependency it
 * varies on.
 */
describe("every keyed read names everything that changes its answer", () => {
  const read = async (file) => {
    const { readFileSync } = await import("node:fs");
    return readFileSync(file, "utf8");
  };

  test("the recall list keys on its status filter", async () => {
    const source = await read("src/features/recalls/RecallsPage.jsx");
    assert.match(source, /key: `clinic:recalls:\$\{status\}`/);
    assert.match(source, /getRecalls\(\{ status \}\)/, "precondition: status is the only query input");
  });

  test("the patient list keys on status, risk and the search text", async () => {
    const source = await read("src/features/patients/PatientsPage.jsx");
    assert.match(source, /key: `clinic:patients:\$\{status\}:\$\{risk\}:\$\{query\}`/);
    assert.match(source, /getPatients\(\{ status, q: query, risk \}\)/);
  });

  test("the day's appointments key on the day and the dentist", async () => {
    const source = await read("src/features/schedule/SchedulePage.jsx");
    assert.match(source, /key: `clinic:appointments:\$\{iso\(date\)\}:\$\{dentistId\}`/);
    assert.match(source, /getAppointments\(\{ date: iso\(date\), dentistId \}\)/);
  });

  test("the owner board keys on its range", async () => {
    const source = await read("src/roles/owner/OwnerDashboard.jsx");
    assert.match(source, /key: `clinic:owner-board:\$\{range\}`/);
  });

  /**
   * Keys must not collide across screens. Two screens sharing a key would serve
   * each other's payloads, which renders as a table of the wrong shape.
   */
  test("no two screens declare the same key", async () => {
    const files = [
      "src/features/recalls/RecallsPage.jsx",
      "src/features/patients/PatientsPage.jsx",
      "src/features/schedule/SchedulePage.jsx",
      "src/roles/owner/OwnerDashboard.jsx",
    ];

    /**
     * Only the cache keys, which are namespaced `clinic:`.
     *
     * A looser pattern picks up every `key:` in the file — these screens are
     * full of them, because each `DataTable` column declares one — and the test
     * then fails on thirty-one strings that have nothing to do with caching.
     * The namespace is what makes them distinguishable, which is a second
     * reason to insist on it below.
     */
    const keys = [];
    for (const file of files) {
      const source = await read(file);
      for (const match of source.matchAll(/key: [`"](clinic:[^`"]+)[`"]/g)) keys.push(match[1]);
    }

    assert.ok(keys.length >= 6, `expected the wired call sites, found ${keys.length}`);
    assert.equal(new Set(keys).size, keys.length, `duplicate key among: ${keys.join(", ")}`);

    /* Namespaced, so a campus screen can never collide with a clinic one. */
    for (const key of keys) {
      assert.match(key, /^clinic:/, `${key} must be namespaced`);
    }
  });
});

/**
 * The safety rails, read off the module rather than exercised through React.
 * Crude, and it is the difference between "there is an expiry" and "somebody
 * believed there was one".
 */
describe("the rails that keep it from going stale or unbounded", () => {
  test("entries expire, and the window is short", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/hooks/useAsync.js", "utf8");

    const maxAge = source.match(/MAX_AGE_MS = ([\d_]+)/);
    assert.ok(maxAge, "there must be a maximum age");
    const ms = Number(maxAge[1].replace(/_/g, ""));
    assert.ok(ms > 0 && ms <= 120_000, `expiry must be at most two minutes, got ${ms}ms`);

    assert.match(source, /cache\.delete\(key\)/, "an expired entry must be dropped");
  });

  test("the cache is bounded", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/hooks/useAsync.js", "utf8");

    assert.match(source, /MAX_ENTRIES = \d+/, "there must be a ceiling on entries");
    assert.match(source, /while \(cache\.size > MAX_ENTRIES\)/, "and it must be enforced on write");
  });

  /**
   * A read with no key must behave exactly as it always did — spinner, fetch,
   * render — because ~100 call sites still pass no key and none of them were
   * reviewed for cache safety.
   */
  test("an unkeyed read is never cached", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/hooks/useAsync.js", "utf8");

    assert.match(source, /if \(!key\) return undefined;/, "reads with no key must miss");
    assert.match(source, /if \(!key\) return;/, "and writes with no key must be dropped");
  });
});
