/**
 * The password policy, as the two screens that set one show it.
 *
 * Mirrors `domain/accounts.js` on the server. Duplicated across the seam
 * deliberately rather than shared: the client's copy is *guidance* and the
 * server's is the rule, and a single shared module would invite somebody to
 * believe the check had already happened. What matters is that they agree —
 * there must be no rule satisfiable here that is refused there.
 *
 * Length leads because length is what actually matters. A twelve-character
 * passphrase beats an eight-character one with a symbol in it by orders of
 * magnitude, and every complexity rule past two character classes mostly
 * teaches people to write `Summer2026!` on a sticky note.
 */

/** The short blocklist. Not a breach corpus — that belongs behind an API. */
const OBVIOUS = [
  "password",
  "odenta",
  "welcome",
  "changeme",
  "qwerty",
  "12345678",
  "dentist",
  "student",
];

export const MIN_PASSWORD = 12;

/**
 * @param {string} value the candidate password
 * @param {{name?: string, email?: string}} person whose account it is
 * @returns {{key: string, label: string, met: boolean}[]}
 */
export function passwordRules(value = "", person = {}) {
  const lower = String(value).toLowerCase();
  const compact = lower.replace(/[^a-z0-9]/g, "");
  const local = String(person?.email ?? "").split("@")[0];

  /**
   * Their own name and address are the two guesses a targeted attacker starts
   * from, and both are printed on the screen the password is being typed into.
   * Short tokens are ignored — a three-letter name would otherwise invalidate
   * every password containing those three letters, which is a rule nobody could
   * satisfy.
   */
  const personal = [local, person?.name].some((entry) => {
    const token = String(entry ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return token.length >= 4 && compact.includes(token);
  });

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) =>
    pattern.test(value)
  ).length;

  return [
    {
      key: "length",
      label: `At least ${MIN_PASSWORD} characters`,
      met: String(value).length >= MIN_PASSWORD,
    },
    {
      key: "classes",
      label: "Two of: lower case, upper case, digits, symbols",
      met: classes >= 2,
    },
    {
      key: "obvious",
      label: "Not an obvious word like “password” or “odenta”",
      met: value.length > 0 && !OBVIOUS.some((word) => lower.includes(word)),
    },
    {
      key: "personal",
      label: "Not your own name or email address",
      met: value.length > 0 && !personal,
    },
  ];
}

export const passwordAccepted = (value, person) =>
  passwordRules(value, person).every((rule) => rule.met);
