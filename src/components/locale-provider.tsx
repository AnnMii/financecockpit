"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { type Format, createFormat } from "@/lib/format";
import {
  type Dictionary,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_NAMES,
  type Locale,
  dictionaries,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  /** Texts in the current language. */
  t: Dictionary;
  /** Number formatting and parsing for the current language. */
  f: Format;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Server-rendered texts (page titles, headings) follow the cookie.
      router.refresh();
    },
    [router],
  );

  const value = useMemo(
    () => ({
      locale,
      t: dictionaries[locale],
      f: createFormat(locale),
      setLocale,
    }),
    [locale, setLocale],
  );
  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside a LocaleProvider");
  return context;
}

/** Switch between the languages; shows each in its own language. */
export function LanguageSwitch() {
  const { locale, t, setLocale } = useLocale();
  return (
    <div role="group" aria-label={t.language} className="flex text-xs">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          title={LOCALE_NAMES[option]}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
          className={`border border-axis px-2 py-1 uppercase first:rounded-l-md last:rounded-r-md last:border-l-0 ${
            option === locale
              ? "bg-accent-wash font-semibold text-accent"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
