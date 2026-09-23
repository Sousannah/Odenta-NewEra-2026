import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeInternalPath } from "@/lib/safeRedirect";

/**
 * Open-redirect defence for the one place the app navigates to a value it did
 * not write itself.
 *
 * The payloads below are the standard bypass ladder, and the backslash rungs
 * are the ones the pinned `react-router-dom` advisory is specifically about
 * (GHSA-wrjc-x8rr-h8h6, itself a bypass of CVE-2025-68470). A browser's URL
 * parser treats `\` as a path separator, so a check that only looks for `//`
 * misses `/\`, and a check that only looks at the raw string misses what the
 * browser will actually do with it.
 */

const FALLBACK = "/app";

describe("an internal path is returned unchanged", () => {
  for (const path of ["/", "/app", "/app/patients", "/university-portal/platform/tenants", "/app/patients/PT-1?tab=chart"]) {
    it(`accepts ${path}`, () => {
      assert.equal(safeInternalPath(path, FALLBACK), path);
    });
  }
});

describe("anything that could leave the origin is refused", () => {
  const hostile = {
    "protocol-relative": "//evil.example/steal",
    "protocol-relative, backslashes": "\\\\evil.example/steal",
    "backslash bypass": "/\\evil.example",
    "backslash bypass, reversed": "\\/evil.example",
    "absolute https": "https://evil.example",
    "absolute http": "http://evil.example",
    "scheme-only": "javascript:alert(document.cookie)",
    "data url": "data:text/html;base64,PHNjcmlwdD4=",
    "no leading slash": "evil.example",
    /**
     * Built with `fromCharCode` rather than as unicode escapes in a string
     * literal.
     *
     * A line-terminator escape inside a normal double-quoted string resolves to
     * a raw line terminator, which some parsers reject outright — and a test
     * file that will not parse reports as one opaque `SyntaxError` rather than
     * as the assertions it was meant to be.
     */
    "tab-smuggled": `/${String.fromCharCode(9)}/evil.example`,
    "newline-smuggled": `/${String.fromCharCode(10)}/evil.example`,
    "carriage-return-smuggled": `/${String.fromCharCode(13)}/evil.example`,
    "null byte": `/app${String.fromCharCode(0)}/../..`,
    /**
     * `DEL` is outside the C0 range the first cut of this guard checked, so it
     * survived a class written as `[\x00-\x1f]`. It is stripped by the same
     * parser step as a tab, which makes it the same attack with a byte that
     * looked out of scope.
     */
    "delete character": `/${String.fromCharCode(127)}/evil.example`,
  };

  for (const [name, payload] of Object.entries(hostile)) {
    it(`refuses ${name}`, () => {
      assert.equal(
        safeInternalPath(payload, FALLBACK),
        FALLBACK,
        `${JSON.stringify(payload)} must not be navigated to`
      );
    });
  }
});

describe("a missing or malformed destination falls back", () => {
  for (const value of [undefined, null, "", 0, false, {}, [], () => {}]) {
    it(`falls back for ${JSON.stringify(value) ?? String(value)}`, () => {
      assert.equal(safeInternalPath(value, FALLBACK), FALLBACK);
    });
  }

  it("can be asked to fall back to null, which is how the sign-in page uses it", () => {
    /* `navigate(destination ?? roleHome(role))` — null is the signal to use the
       role's own home rather than a hardcoded path. */
    assert.equal(safeInternalPath("https://evil.example", null), null);
  });
});
