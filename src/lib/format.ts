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
