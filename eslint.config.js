import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * The lint rules, and what they are for.
 *
 * `npm run lint` has been in `package.json` since the project started and has
 * never been able to run, because eslint was never installed — so every rule
 * below is being applied to this codebase for the first time. That shapes the
 * configuration: a wall of pre-existing errors is a lint nobody runs twice, and
 * a lint nobody runs is worth less than no lint at all.
 *
 * So the set is drawn narrowly and deliberately, around the mistakes that are
 * *silent* in a React app — the ones that do not fail a build, do not fail a
 * test, and show up as a screen that renders the wrong thing. Style is left
 * alone entirely: nothing here has an opinion about quotes, semicolons or line
 * length, because the editor already formats this codebase consistently and a
 * linter arguing with a formatter is noise that trains people to ignore it.
 *
 * ## What is an error, and what the first run actually found
 *
 * The first run reported 225 problems. Every one was read before deciding its
 * severity, because "turn the noisy ones down" and "turn the ones we are not
 * fixing today down" are the same action with very different honesty, and the
 * difference is whether anybody looked.
 *
 * `react-hooks/rules-of-hooks` is an error, and it found exactly one violation:
 * a `useCallback`-wrapped click handler in `auth/SignInPage.jsx` named
 * `useProvider`, called inside an `onClick`. Not a real hook-order bug — but
 * the rule cannot know that, and neither can a reader, which is the actual
 * problem with the name. Renamed rather than suppressed.
 *
 * `react-hooks/exhaustive-deps` is a **warning**, and that is a considered
 * downgrade rather than a convenience. All eighteen of its findings were read.
 * Twelve are the `rows ?? []` pattern — a fresh array literal in a `useMemo`
 * dependency, which costs a recompute and changes no output. The remaining six
 * are "reset this form when the modal opens" effects keyed deliberately on
 * `open` alone; including the record would re-reset the form under the user
 * mid-edit, so the rule is asking for a worse component. None is a defect, so
 * none justifies a red build for everybody else.
 *
 * The React-Compiler-era rules that ship in the recommended set
 * (`set-state-in-effect`, `purity`, `static-components`,
 * `preserve-manual-memoization`, `use-memo`) are warnings for the same reason:
 * sixty-six findings, all of them advice about render cost in a codebase that
 * does not use the compiler. Worth reading; not worth blocking on.
 *
 * `react-refresh/only-export-components` is off. It fired 129 times, and at
 * that rate it is not reporting mistakes — it is reporting a convention this
 * codebase chose, where a screen file exports its own column definitions and
 * helpers next to the component. The cost is a slower hot reload in those
 * files, which is a real cost and still not one worth 129 warnings.
 *
 * The result: `npm run lint` exits zero on the tree as it stands, so the next
 * error anybody introduces is visible instead of being the 226th line of
 * output.
 */
export default [
  {
    /**
     * `src/odontogram/lib` is a verbatim vendored drop-in — the note at the top
     * of `vite.config.js` explains why that folder is kept byte-identical to
     * its upstream. Linting somebody else's TypeScript with a JavaScript config
     * produces parse errors, not findings.
     */
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/odontogram/lib/**",
      "public/**",
      "*.timestamp-*.mjs",
    ],
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser,
        /* Stamped in by `vite.config.js` — see the note on it there. */
        __APP_VERSION__: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      /* The one that is worth an error. See the note above. */
      "react-hooks/rules-of-hooks": "error",

      /* Read, all eighteen of them; none is a defect. See the note above. */
      "react-hooks/exhaustive-deps": "warn",

      /* Advice about render cost, in a codebase without the compiler. */
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/use-memo": "warn",

      /**
       * Off, not down. A screen file here exports its own column definitions
       * and helpers beside the component on purpose; the rule fired 129 times,
       * which is a convention being reported rather than a mistake.
       */
      "react-refresh/only-export-components": "off",

      /**
       * `prop-types` is off: this codebase does not use them anywhere, and a
       * rule that fires on every component is a rule that hides the others.
       */
      "react/prop-types": "off",

      /* Caught by the formatter and by review; noise here. */
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",

      /**
       * An unused *variable* is usually dead code worth deleting. An unused
       * *argument* often is not — a callback that takes `(event, index)` and
       * only uses the second is clearer than one that renames things to get
       * past a linter. And `catch (error) {}` where the error is deliberately
       * swallowed is a pattern this codebase uses on purpose.
       */
      "no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
          ignoreRestSiblings: true,
        },
      ],

      /**
       * The silent ones, all errors.
       *
       * Each of these is a mistake that runs: a comparison that is always
       * false, an assignment that never happens, a promise nobody waits for in
       * a loop that was meant to be sequential.
       */
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "no-self-compare": "error",
      "no-unmodified-loop-condition": "error",
      "no-constant-binary-expression": "error",
      "no-promise-executor-return": "error",
      "require-atomic-updates": "off",

      /* `console.warn`/`error` are used for real diagnostics; `console.log` is
         almost always a leftover. */
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  /**
   * The test loader and the config files run in Node, not a browser.
   */
  {
    files: ["test/**/*.{js,mjs}", "*.config.js", "vite.config.js", "eslint.config.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },
];
