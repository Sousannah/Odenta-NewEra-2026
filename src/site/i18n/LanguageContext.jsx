import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "odenta.language";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN", dir: "ltr" },
  { code: "ar", label: "العربية", short: "AR", dir: "rtl" },
];

const LanguageContext = createContext(null);

/**
 * Bilingual copy without a translation runtime.
 *
 * Content objects hold either a plain string (English) or `{ en, ar }`. `t()`
 * resolves against the active language and falls back to English, so a string
 * that has not been translated yet still renders rather than showing a key.
 */
export function resolveText(value, language = "en") {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map((entry) => resolveText(entry, language));
  return value[language] ?? value.en ?? "";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.some((item) => item.code === stored) ? stored : "en";
  });

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language, dir]);

  /* The portals are English, left-to-right. Leaving the public surface (a
     sign-in, "My dashboard") must not carry an Arabic visitor's direction in. */
  useEffect(
    () => () => {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    },
    []
  );

  const value = useMemo(
    () => ({
      language,
      dir,
      isRtl: dir === "rtl",
      setLanguage,
      toggle: () => setLanguage((current) => (current === "en" ? "ar" : "en")),
      t: (content) => resolveText(content, language),
    }),
    [language, dir]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

/** `const t = useT(); t(copy.hero.title)` */
export function useT() {
  const { t } = useLanguage();
  return useCallback(t, [t]);
}
