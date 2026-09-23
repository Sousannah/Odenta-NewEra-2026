import { pathToFileURL } from "node:url";
import { statSync } from "node:fs";
import path from "node:path";

/**
 * A module resolver that understands what Vite understands.
 *
 * The app is built by Vite, which resolves the `@/` alias from `vite.config.js`
 * and fills in missing extensions. Node does neither, so without this the
 * navigation modules — which are plain data and import nothing but icons —
 * would be untestable outside a browser bundle. That is the wrong reason for a
 * permission matrix to go unverified.
 *
 * Deliberately a Node loader hook rather than a test-runner dependency. The
 * only thing these tests need from a bundler is path resolution; adding Vitest
 * to get it would pull a second test runner and a second config into a repo
 * that already runs `node --test` on the API side. Forty lines is the cheaper
 * answer, and it keeps `npm test` dependency-free.
 *
 * Scope is deliberately narrow: it resolves the alias and tries three
 * extensions. Anything needing a transform — JSX, CSS, an asset import — is out
 * of reach, and that is fine. What is tested here is the role/permission data,
 * which is plain JavaScript on purpose.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

/** Same order Vite tries, so a file that resolves here resolves in a build. */
const EXTENSIONS = ["", ".js", ".jsx", "/index.js", "/index.jsx"];

/**
 * `isFile`, not `exists`.
 *
 * `@/config/nav` names a directory that also exists, so an existence check
 * returns the directory itself and the import fails with `EISDIR` — the
 * `/index.js` candidate behind it never gets tried. Asking whether the
 * candidate is a *file* is what makes the extension list do its job.
 */
const isFile = (candidate) => {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
};

const firstExisting = (base) => {
  for (const extension of EXTENSIONS) {
    const candidate = base + extension;
    if (isFile(candidate)) return candidate;
  }
  return null;
};

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = firstExisting(path.join(SRC, specifier.slice(2)));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  /**
   * A relative import with no extension, which Vite allows and Node does not.
   *
   * `auth/roles.js` importing `./permissions` is the case — idiomatic in a Vite
   * app and an `ERR_MODULE_NOT_FOUND` here without this branch.
   */
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = path.dirname(new URL(context.parentURL).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
    const resolved = firstExisting(path.resolve(parentDir, specifier));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
