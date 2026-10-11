import { describe, expect, it } from "vitest";
import {
  PUBLISHED_LIFE_EXPECTANCY,
  SURVIVORS,
  type Sex,
} from "@/lib/data/life-table";
import { deathShares, lifeStats, survivalProbability } from "./life-expectancy";

const sexes: Sex[] = ["male", "female"];

describe("lifeStats", () => {
  it.each(sexes)("reproduces the published life expectancy: %s", (sex) => {
    for (const [age, remaining] of Object.entries(PUBLISHED_LIFE_EXPECTANCY[sex])) {
      const stats = lifeStats(sex, Number(age));
      // Our deaths sit in the middle of each year; the table is slightly finer.
      expect(Math.abs(stats.mean - (Number(age) + remaining))).toBeLessThan(0.15);
    }
  });

  it("shows women living longer than men, with similar scatter", () => {
    const men = lifeStats("male", 67);
    const women = lifeStats("female", 67);
    expect(women.mean).toBeGreaterThan(men.mean);
    expect(men.sigma).toBeGreaterThan(6);
    expect(men.sigma).toBeLessThan(11);
    expect(Math.abs(men.sigma - women.sigma)).toBeLessThan(1.5);
  });

  it.each(sexes)("nests the sigma bands and covers almost everyone with three: %s", (sex) => {
    const [one, two, three] = lifeStats(sex, 67).bands;
    expect(one.share).toBeGreaterThan(0.55);
    expect(one.share).toBeLessThan(two.share);
    expect(two.share).toBeLessThanOrEqual(three.share);
    expect(three.share).toBeGreaterThan(0.99);
    // Nobody alive at 67 dies before 67.
    expect(three.low).toBe(67);
    expect(three.high).toBeGreaterThan(100);
  });
});

describe("deathShares", () => {
  it.each(sexes)("accounts for practically everyone: %s", (sex) => {
    const total = deathShares(sex, 67).reduce((sum, d) => sum + d.share, 0);
    expect(total).toBeGreaterThan(0.995);
    expect(total).toBeLessThanOrEqual(1);
  });

  it("peaks above the mean and drops steeply after that", () => {
    for (const sex of sexes) {
      const stats = lifeStats(sex, 67);
      const shares = deathShares(sex, 67);
      const at = (age: number) => shares.find((d) => d.age === age)!.share;
      expect(stats.mode).toBeGreaterThan(stats.mean);
      expect(at(stats.mode + 10)).toBeLessThan(at(stats.mode) / 3);
      // Fewer die 10 years before the peak than at it, but far more than 10 years after.
      expect(at(stats.mode - 10)).toBeGreaterThan(at(stats.mode + 10));
    }
    expect(lifeStats("male", 67).mode).toBe(88);
    expect(lifeStats("female", 67).mode).toBe(90);
  });
});

describe("survivalProbability", () => {
  it("is the ratio of survivors in the table", () => {
    expect(survivalProbability("male", 67, 85)).toBeCloseTo(
      SURVIVORS.male[85] / SURVIVORS.male[67],
      10,
    );
    expect(survivalProbability("female", 67, 67)).toBe(1);
  });

  it("falls with age and is higher for women", () => {
    const ages = [70, 80, 90, 100, 105];
    for (const sex of sexes) {
      const values = ages.map((age) => survivalProbability(sex, 67, age));
      expect([...values].sort((a, b) => b - a)).toEqual(values);
      expect(values.at(-1)).toBeGreaterThan(0);
    }
    expect(survivalProbability("female", 67, 90)).toBeGreaterThan(
      survivalProbability("male", 67, 90),
    );
  });
});
