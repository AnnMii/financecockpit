/**
 * Income tax by the tariff (basic tariff, § 32a EStG) including the
 * solidarity surcharge. A new tariff only needs one more entry.
 */

interface Tariff {
  grundfreibetrag: number;
  zone2End: number;
  zone3End: number;
  zone4End: number;
  zone2: [number, number];
  zone3: [number, number, number];
  zone4Offset: number;
  zone5Offset: number;
  soliFreigrenze: number;
}

const TARIFFS: Record<number, Tariff> = {
  2026: {
    grundfreibetrag: 12_348,
    zone2End: 17_799,
    zone3End: 69_878,
    zone4End: 277_825,
    zone2: [914.51, 1_400],
    zone3: [173.1, 2_397, 1_034.87],
    zone4Offset: 11_135.63,
    zone5Offset: 19_470.38,
    soliFreigrenze: 20_350,
  },
};

export const INCOME_TAX_YEAR = 2026;

function tariffTax(taxableIncome: number, t: Tariff): number {
  const x = Math.floor(taxableIncome);
  if (x <= t.grundfreibetrag) return 0;
  if (x <= t.zone2End) {
    const y = (x - t.grundfreibetrag) / 10_000;
    return Math.floor((t.zone2[0] * y + t.zone2[1]) * y);
  }
  if (x <= t.zone3End) {
    const z = (x - t.zone2End) / 10_000;
    return Math.floor((t.zone3[0] * z + t.zone3[1]) * z + t.zone3[2]);
  }
  if (x <= t.zone4End) return Math.floor(0.42 * x - t.zone4Offset);
  return Math.floor(0.45 * x - t.zone5Offset);
}

function solidaritySurcharge(tax: number, t: Tariff): number {
  if (tax <= t.soliFreigrenze) return 0;
  const floorCents = (n: number) => Math.floor(n * 100) / 100;
  return Math.min(
    floorCents(tax * 0.055),
    floorCents((tax - t.soliFreigrenze) * 0.119),
  );
}

/** Income tax + solidarity surcharge for a taxable income (single assessment). */
export function incomeTax(taxableIncome: number, year: number = INCOME_TAX_YEAR): number {
  const tariff = TARIFFS[year];
  if (!tariff) throw new Error(`No income tax tariff stored for ${year}`);
  const tax = tariffTax(Math.max(0, taxableIncome), tariff);
  return tax + solidaritySurcharge(tax, tariff);
}

/** Additional tax that `amount` triggers on top of `taxableIncome`, the taxable income (difference method). */
export function marginalTax(amount: number, taxableIncome: number): number {
  return incomeTax(taxableIncome + amount) - incomeTax(taxableIncome);
}
