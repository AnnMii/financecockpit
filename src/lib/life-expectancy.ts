import {
  LIFE_TABLE_MAX_AGE,
  REMAINING_AT_MAX_AGE,
  SURVIVORS,
  type Sex,
} from "@/lib/data/life-table";

/**
 * Figures from the life table for people who have reached a given age: the
 * age they reach on average, how much the age at death scatters around it,
 * and the share that reaches a later age.
 */

export interface SigmaBand {
  /** How many standard deviations around the mean. */
  sigmas: 1 | 2 | 3;
  /** Ages mean − k·σ and mean + k·σ; `low` is not below the age already reached. */
  low: number;
  high: number;
  /** Share of people who die at an age inside the band, per the table, 0 to 1. */
  share: number;
}

export interface LifeStats {
  fromAge: number;
  /** Average age at death of those alive at `fromAge`. */
  mean: number;
  /** Standard deviation of the age at death. */
  sigma: number;
  /** Year of age in which most of them die. */
  mode: number;
  bands: SigmaBand[];
}

/** Oldest year of age the distribution of deaths is spelled out for. */
export const DISTRIBUTION_MAX_AGE = 110;

/**
 * Share of those alive at `fromAge` who die in each year of age, 0 to 1.
 * `age` is the completed age, so the deaths happen between `age` and `age + 1`.
 */
export function deathShares(
  sex: Sex,
  fromAge: number,
): { age: number; share: number }[] {
  const from = Math.min(LIFE_TABLE_MAX_AGE, Math.max(0, Math.round(fromAge)));
  const result: { age: number; share: number }[] = [];
  for (let age = from; age < DISTRIBUTION_MAX_AGE; age++) {
    result.push({
      age,
      share:
        survivalProbability(sex, from, age) -
        survivalProbability(sex, from, age + 1),
    });
  }
  return result;
}

/** Ages at death and how many of 100.000 newborns die at each, from `fromAge` on. */
function deaths(sex: Sex, fromAge: number): { age: number; count: number }[] {
  const survivors = SURVIVORS[sex];
  const result: { age: number; count: number }[] = [];
  for (let age = fromAge; age < LIFE_TABLE_MAX_AGE; age++) {
    // Deaths within a year of age happen on average in its middle.
    result.push({ age: age + 0.5, count: survivors[age] - survivors[age + 1] });
  }
  result.push({
    age: LIFE_TABLE_MAX_AGE + REMAINING_AT_MAX_AGE[sex],
    count: survivors[LIFE_TABLE_MAX_AGE],
  });
  return result;
}

export function lifeStats(sex: Sex, fromAge: number): LifeStats {
  const age = Math.min(LIFE_TABLE_MAX_AGE, Math.max(0, Math.round(fromAge)));
  const alive = SURVIVORS[sex][age];
  const list = deaths(sex, age);

  const mean = list.reduce((sum, d) => sum + d.age * d.count, 0) / alive;
  // The oldest group is a single entry; its own spread is about as large as
  // its remaining life expectancy.
  const tail = list.at(-1)!;
  const variance =
    (list.reduce((sum, d) => sum + (d.age - mean) ** 2 * d.count, 0) +
      REMAINING_AT_MAX_AGE[sex] ** 2 * tail.count) /
    alive;
  const sigma = Math.sqrt(variance);

  const bands = ([1, 2, 3] as const).map((sigmas) => {
    const low = Math.max(age, mean - sigmas * sigma);
    const high = mean + sigmas * sigma;
    const inside = list
      .filter((d) => d.age >= low && d.age <= high)
      .reduce((sum, d) => sum + d.count, 0);
    return { sigmas, low, high, share: inside / alive };
  });

  const mode = deathShares(sex, age).reduce((most, d) =>
    d.share > most.share ? d : most,
  ).age;

  return { fromAge: age, mean, sigma, mode, bands };
}

/** Share of those alive at `fromAge` who are still alive at `toAge`, 0 to 1. */
export function survivalProbability(
  sex: Sex,
  fromAge: number,
  toAge: number,
): number {
  const survivors = SURVIVORS[sex];
  const from = Math.min(LIFE_TABLE_MAX_AGE, Math.max(0, Math.round(fromAge)));
  if (toAge <= from) return 1;
  if (toAge <= LIFE_TABLE_MAX_AGE) return survivors[Math.round(toAge)] / survivors[from];
  // Beyond the table: the oldest group thins out at its average rate.
  const beyond = Math.exp(-(toAge - LIFE_TABLE_MAX_AGE) / REMAINING_AT_MAX_AGE[sex]);
  return (survivors[LIFE_TABLE_MAX_AGE] / survivors[from]) * beyond;
}
