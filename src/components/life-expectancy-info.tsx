"use client";

import { useState } from "react";
import { LIFE_TABLE_SOURCE, type Sex } from "@/lib/data/life-table";
import {
  DISTRIBUTION_MAX_AGE,
  type LifeStats,
  deathShares,
  lifeStats,
  survivalProbability,
} from "@/lib/life-expectancy";
import { InfoPopover } from "./info-popover";
import { useLocale } from "./locale-provider";
import { formatDate } from "./plan/plan-views";
import { useSettingsEditor } from "./settings-provider";

const SEXES: Sex[] = ["male", "female"];
const COLOR: Record<Sex, string> = {
  male: "var(--series-1)",
  female: "var(--series-2)",
};

const WIDTH = 400;
const HEIGHT = 172;
const LEFT = 34;
const RIGHT = 8;
const TOP = 26;
const AXIS_Y = 148;

/**
 * Share of people dying in each year of age, one curve per sex. The area to
 * the right of the payout age is the share that outlives it.
 */
function LifeChart({
  stats,
  fromAge,
  payoutUntilAge,
}: {
  stats: Record<Sex, LifeStats>;
  fromAge: number;
  payoutUntilAge: number;
}) {
  const { t, f } = useLocale();
  const text = t.life;
  const [hoverAge, setHoverAge] = useState<number | null>(null);

  const maxAge = Math.min(DISTRIBUTION_MAX_AGE, Math.max(105, payoutUntilAge + 2));
  const curves = {
    male: deathShares("male", fromAge).filter((d) => d.age < maxAge),
    female: deathShares("female", fromAge).filter((d) => d.age < maxAge),
  };
  const peak = Math.max(...SEXES.flatMap((sex) => curves[sex].map((d) => d.share)));
  const step = peak > 0.05 ? 0.02 : 0.01;
  const yMax = Math.ceil(peak / step) * step;
  const yTicks: number[] = [];
  for (let tick = 0; tick <= yMax + step / 2; tick += step) yTicks.push(tick);
  const xTicks: number[] = [];
  for (let age = Math.ceil(fromAge / 10) * 10; age <= maxAge; age += 10) xTicks.push(age);

  const x = (age: number) =>
    LEFT + ((age - fromAge) / (maxAge - fromAge)) * (WIDTH - LEFT - RIGHT);
  const y = (share: number) => AXIS_Y - (share / yMax) * (AXIS_Y - TOP);
  // Deaths within a year of age sit in its middle; in between, the curve is straight.
  const shareAt = (sex: Sex, age: number) => {
    const list = curves[sex];
    const position = Math.min(list.length - 1, Math.max(0, age - 0.5 - fromAge));
    const index = Math.min(list.length - 2, Math.floor(position));
    const part = position - index;
    return list[index].share * (1 - part) + list[index + 1].share * part;
  };
  const line = (sex: Sex) =>
    curves[sex]
      .map((d, i) => `${i === 0 ? "M" : "L"}${x(d.age + 0.5).toFixed(1)} ${y(d.share).toFixed(1)}`)
      .join(" ");
  const showPayout = payoutUntilAge > fromAge && payoutUntilAge < maxAge;
  const outliveArea = (sex: Sex) => {
    const right = curves[sex].filter((d) => d.age + 0.5 > payoutUntilAge);
    const end = right.at(-1)!.age + 0.5;
    return (
      `M${x(payoutUntilAge).toFixed(1)} ${AXIS_Y} L${x(payoutUntilAge).toFixed(1)} ${y(shareAt(sex, payoutUntilAge)).toFixed(1)} ` +
      right.map((d) => `L${x(d.age + 0.5).toFixed(1)} ${y(d.share).toFixed(1)}`).join(" ") +
      ` L${x(end).toFixed(1)} ${AXIS_Y} Z`
    );
  };

  const percent = (share: number) => f.percent(Math.round(share * 1000) / 10);
  const payoutX = x(payoutUntilAge);
  const labelLeft = payoutX > WIDTH - 130;
  // Men's label left of their rising curve, women's right of their peak: both free.
  const maleLabelAge = Math.max(fromAge + 0.5, stats.male.mode - 4.5);

  return (
    <>
      <p className="text-[11px] text-muted">{text.shareAxis}</p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={text.chartAria(stats.male.mode, stats.female.mode)}
        className="w-full touch-pan-y"
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const px = ((event.clientX - box.left) / box.width) * WIDTH;
          const age = Math.round(
            fromAge + ((px - LEFT) / (WIDTH - LEFT - RIGHT)) * (maxAge - fromAge),
          );
          setHoverAge(age >= fromAge && age <= maxAge ? age : null);
        }}
        onPointerLeave={() => setHoverAge(null)}
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={LEFT}
              x2={WIDTH - RIGHT}
              y1={y(tick)}
              y2={y(tick)}
              stroke={tick === 0 ? "var(--axis)" : "var(--line)"}
            />
            <text
              x={LEFT - 6}
              y={y(tick) + 4}
              fontSize={11}
              textAnchor="end"
              fill="var(--muted)"
            >
              {f.percent(Math.round(tick * 100))}
            </text>
          </g>
        ))}
        {xTicks.map((age) => (
          <text
            key={age}
            x={x(age)}
            y={AXIS_Y + 15}
            fontSize={11}
            textAnchor="middle"
            fill="var(--muted)"
          >
            {age}
          </text>
        ))}

        {SEXES.map((sex) => (
          <g key={sex}>
            {showPayout && <path d={outliveArea(sex)} fill={COLOR[sex]} opacity={0.18} />}
            <path
              d={line(sex)}
              fill="none"
              stroke={COLOR[sex]}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </g>
        ))}
        {showPayout && (
          <>
            <line
              x1={payoutX}
              x2={payoutX}
              y1={18}
              y2={AXIS_Y}
              stroke="var(--ink-2)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={payoutX + (labelLeft ? -6 : 6)}
              y={14}
              fontSize={11}
              textAnchor={labelLeft ? "end" : "start"}
              fill="var(--ink-2)"
            >
              {text.payoutMarker(payoutUntilAge)}
            </text>
          </>
        )}

        <text
          x={x(maleLabelAge) - 6}
          y={y(shareAt("male", maleLabelAge)) - 4}
          fontSize={12}
          textAnchor="end"
          fill="var(--ink)"
          stroke="var(--surface)"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {text.male}
        </text>
        <text
          x={x(stats.female.mode + 3)}
          y={y(shareAt("female", stats.female.mode + 0.5)) + 6}
          fontSize={12}
          fill="var(--ink)"
          stroke="var(--surface)"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {text.female}
        </text>


        {hoverAge !== null && (
          <g pointerEvents="none">
            <line
              x1={x(hoverAge)}
              x2={x(hoverAge)}
              y1={TOP}
              y2={AXIS_Y}
              stroke="var(--axis)"
            />
            {SEXES.map((sex) => (
              <circle
                key={sex}
                cx={x(hoverAge)}
                cy={y(shareAt(sex, hoverAge))}
                r={4}
                fill={COLOR[sex]}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </svg>
      <p className="min-h-8 text-xs text-ink-2" aria-live="polite">
        {hoverAge === null
          ? text.hoverHint
          : text.hover(
              hoverAge,
              percent(survivalProbability("male", fromAge, hoverAge)),
              percent(survivalProbability("female", fromAge, hoverAge)),
            )}
      </p>
    </>
  );
}

/**
 * "i" next to the payout age: how old people in Germany become, with the
 * scatter around the mean and what that means for the chosen payout age.
 */
export function LifeExpectancyInfo() {
  const { locale, t, f } = useLocale();
  const text = t.life;
  const { settings } = useSettingsEditor();
  const { retirementAge, payoutUntilAge } = settings.shared;

  const stats = {
    male: lifeStats("male", retirementAge),
    female: lifeStats("female", retirementAge),
  };
  const one = (value: number) => f.number(Math.round(value * 10) / 10);
  const share = (value: number) => f.percent(Math.round(value * 1000) / 10);
  const outlive = (sex: Sex) =>
    share(survivalProbability(sex, retirementAge, payoutUntilAge));

  // The payout age and a few round ages, to show how fast it thins out.
  const reachAges = [...new Set([payoutUntilAge, 90, 95, 100])]
    .filter((age) => age > retirementAge)
    .sort((a, b) => a - b);

  const rows: [string, (sex: Sex) => string][] = [
    [text.expectedAge, (sex) => f.years(Math.round(stats[sex].mean * 10) / 10)],
    [text.mostCommonAge, (sex) => f.years(stats[sex].mode)],
    [text.sigma, (sex) => f.years(Math.round(stats[sex].sigma * 10) / 10)],
    ...stats.male.bands.map(
      (band, i): [string, (sex: Sex) => string] => [
        text.band(band.sigmas),
        (sex) => {
          const b = stats[sex].bands[i];
          return `${one(b.low)} – ${one(b.high)} (${share(b.share)})`;
        },
      ],
    ),
    ...reachAges.map((age): [string, (sex: Sex) => string] => [
      text.olderThan(age),
      (sex) => share(survivalProbability(sex, retirementAge, age)),
    ]),
  ];

  return (
    <InfoPopover label={text.button}>
      <h3 className="text-sm font-semibold text-ink">{text.title}</h3>
      <p className="mb-3 mt-1 text-xs text-ink-2">{text.intro(retirementAge)}</p>

      <LifeChart
        stats={stats}
        fromAge={retirementAge}
        payoutUntilAge={payoutUntilAge}
      />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {SEXES.map((sex) => (
          <li key={sex} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ background: COLOR[sex] }} />
            {text[sex]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-xs"
            style={{ background: COLOR.male, opacity: 0.35 }}
          />
          {text.outliveLegend(payoutUntilAge, outlive("male"), outlive("female"))}
        </li>
      </ul>

      <table className="mt-3 w-full text-xs">
        <thead className="text-ink-2">
          <tr className="border-b border-line">
            <th className="py-1 pr-2 text-left font-medium" />
            <th className="px-2 py-1 text-right font-medium">{text.male}</th>
            <th className="py-1 pl-2 text-right font-medium">{text.female}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-line last:border-0">
              <th className="py-1 pr-2 text-left font-normal text-ink-2">{label}</th>
              <td className="px-2 py-1 text-right tabular-nums">{value("male")}</td>
              <td className="py-1 pl-2 text-right tabular-nums">{value("female")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-ink">
        {text.planning(payoutUntilAge, outlive("male"), outlive("female"))}
      </p>

      <h4 className="mt-3 text-xs font-semibold text-ink">{text.sigmaTitle}</h4>
      <p className="mt-1 text-xs text-ink-2">{text.sigmaText}</p>
      <p className="mt-1 text-xs text-ink-2">{text.sigmaCaveat}</p>

      <p className="mt-3 text-xs text-ink-2">
        <span className="font-medium text-ink">{text.source}:</span>{" "}
        <a
          href={LIFE_TABLE_SOURCE.url}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          {text.sourceText(
            LIFE_TABLE_SOURCE.period,
            formatDate(locale, LIFE_TABLE_SOURCE.published),
          )}
        </a>{" "}
        {text.ownCalculation} {text.periodNote}
      </p>
    </InfoPopover>
  );
}
