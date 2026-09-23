import { register } from "node:module";
import { pathToFileURL } from "node:url";

/**
 * Installs the alias-aware resolver in `loader.mjs` for the whole test run.
 *
 * Passed to Node as `--import ./test/register.mjs` from the `test` script;
 * keeping it a separate file is what lets the hook be registered before the
 * first test module is evaluated.
 */
register("./loader.mjs", pathToFileURL(import.meta.filename));
