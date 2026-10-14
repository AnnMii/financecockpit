import type { Locale } from "@/lib/i18n/locale";

/**
 * Number formatting and parsing for one language. German writes 50.000,5 and
 * 228.547 €, English 50,000.5 and €228,547. The currency is always euro.
 */
export interface Format {
  /** 228547.3 -> "228.547 €" */
  euro: (value: number) => string;
  /** For monthly amounts where cents matter: 327.512 -> "327,51 €" */
  euroCents: (value: number) => string;
  /** Axis labels: 0 € / 50 Tsd. € / 1,2 Mio. € */
  euroCompact: (value: number) => string;
  /** 0.2 -> "0,2", 50000 -> "50.000" */
  number: (value: number) => string;
  /** 8.5 -> "8,5 Jahre" (German), 1 -> "1 Jahr" */
  years: (value: number) => string;
  /** 5.123 -> "5,12 %" */
  percent: (value: number) => string;
  /** Reads what `number` writes, plus input without grouping: "50.000" -> 50000 */
  parse: (text: string) => number;
}

const INTL_LOCALE: Record<Locale, string> = { de: "de-DE", en: "en-US" };

const WORDS = {
  de: { thousand: " Tsd. €", million: " Mio. €", euro: " €", year: "Jahr", years: "Jahre", percent: " %" },
  en: { thousand: "k", million: "M", euro: "", year: "year", years: "years", percent: "%" },
};

function parseGermanNumber(text: string): number {
  // A dot followed by exactly three digits groups thousands; "0.2" stays 0.2.
  return Number(text.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
}

function parseEnglishNumber(text: string): number {
  return Number(text.replace(/,/g, ""));
}

export function createFormat(locale: Locale): Format {
  const intl = INTL_LOCALE[locale];
  const words = WORDS[locale];
  const euroFormat = new Intl.NumberFormat(intl, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const euroCentsFormat = new Intl.NumberFormat(intl, {
    style: "currency",
    currency: "EUR",
  });
  const numberFormat = new Intl.NumberFormat(intl, { maximumFractionDigits: 4 });
  const number = (value: number) => numberFormat.format(value);
  const round2 = (value: number) => Math.round(value * 100) / 100;
  // English puts the sign first (€50k), German the unit last (50 Tsd. €).
  const compact = (value: number, suffix: string) =>
    locale === "en" ? `€${number(value)}${suffix}` : `${number(value)}${suffix}`;

  return {
    euro: (value) => euroFormat.format(Math.round(value)),
    euroCents: (value) => euroCentsFormat.format(value),
    euroCompact: (value) => {
      const abs = Math.abs(value);
      if (abs >= 1_000_000) return compact(value / 1_000_000, words.million);
      if (abs >= 1_000) return compact(value / 1_000, words.thousand);
      return compact(value, words.euro);
    },
    number,
    years: (value) => {
      const rounded = round2(value);
      return `${number(rounded)} ${rounded === 1 ? words.year : words.years}`;
    },
    percent: (value) => `${number(round2(value))}${words.percent}`,
    parse: (text) => {
      const cleaned = text.trim().replace(/\s/g, "");
      if (cleaned === "") return Number.NaN;
      return locale === "en"
        ? parseEnglishNumber(cleaned)
        : parseGermanNumber(cleaned);
    },
  };
}
