export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";
/** Cookie that remembers the chosen language, so the server renders it too. */
export const LOCALE_COOKIE = "fc_locale";

/** Names of the languages, each in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

export function toLocale(value: unknown): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}
