const euroFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 4,
});

/** 228547.3 -> "228.547 €" */
export function formatEuro(value: number): string {
  return euroFormat.format(Math.round(value));
}

const euroCentsFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/** For monthly amounts where cents matter: 327.512 -> "327,51 €" */
export function formatEuroCents(value: number): string {
  return euroCentsFormat.format(value);
}

/** 8.5 -> "8,5 Jahre", 1 -> "1 Jahr" */
export function formatYears(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${numberFormat.format(rounded)} ${rounded === 1 ? "Jahr" : "Jahre"}`;
}

/** 5.123 -> "5,12 %" */
export function formatPercent(value: number): string {
  return `${numberFormat.format(Math.round(value * 100) / 100)} %`;
}

/** Axis labels: 0 € / 50 Tsd. € / 1,2 Mio. € */
export function formatEuroCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${numberFormat.format(value / 1_000_000)} Mio. €`;
  if (abs >= 1_000) return `${numberFormat.format(value / 1_000)} Tsd. €`;
  return `${numberFormat.format(value)} €`;
}

/** 0.2 -> "0,2", 50000 -> "50.000" */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Reads German number input: "50.000" -> 50000, "0,2" -> 0.2, "0.2" -> 0.2 */
export function parseNumber(text: string): number {
  const cleaned = text
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  return cleaned === "" ? Number.NaN : Number(cleaned);
}
