/**
 * Host configuration for the vendored odontogram.
 *
 * The module ships translations for twelve languages and they are all kept —
 * `lib/i18n/translations.ts` is untouched, so switching a locale back on is a
 * one-line edit here rather than a re-translation. Odenta ships English and
 * Arabic for now, so those are the only two the language menu offers.
 */

/** Locales the in-chart language menu lists, in menu order. */
export const VISIBLE_LANGUAGES = ["en", "ar"];

/** Locale the chart starts in when the host does not pass one. */
export const DEFAULT_LANGUAGE = "en";

/** Locales that render right-to-left (the charts themselves stay LTR). */
export const RTL_LANGUAGES = ["ar"];

export const isRtlLanguage = (lang) => RTL_LANGUAGES.includes(lang);
