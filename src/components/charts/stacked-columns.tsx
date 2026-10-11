"use client";

import { useEffect, useRef, useState } from "react";

export interface ColumnSeries {
  key: string;
  label: string;
  /** CSS color, e.g. "var(--series-1)" */
  color: string;
}

export interface ColumnDatum {
  /** Tick label on the x axis; an empty string leaves the tick out. */
  tick: string;
  /** Heading of the tooltip for this column. */
  title: string;
  values: Record<string, number>;
  /** Value of the comparison line at this column. */
  compare?: number;
}

interface Props {
  data: ColumnDatum[];
  /** Stacked from the baseline upwards, in this order. */
  series: ColumnSeries[];
  totalLabel: string;
  compareLabel?: string;
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
  ariaLabel: string;
}

const HEIGHT = 300;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 76 };
const MAX_BAR_WIDTH = 24;
const GAP = 2;
const COMPARE_COLOR = "var(--series-compare)";

/** Round tick step so the axis reads 0 / 50 Tsd. / 100 Tsd. ... */
function niceStep(max: number, targetTicks: number): number {
  const raw = max / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rectangle with only the top corners rounded (the data end of a column). */
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${y + h}Z`;
}

export function StackedColumns({
  data,
  series,
  totalLabel,
  compareLabel,
  formatValue,
  formatAxis,
  ariaLabel,
}: Props) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);

  const showCompare = compareLabel !== undefined;
  const value = (row: ColumnDatum, key: string) => Math.max(0, row.values[key] ?? 0);
  const total = (row: ColumnDatum) =>
    series.reduce((sum, s) => sum + value(row, s.key), 0);

  const dataMax = Math.max(
    1,
    ...data.map((row) => Math.max(total(row), showCompare ? (row.compare ?? 0) : 0)),
  );
  const step = niceStep(dataMax, 4);
  const yMax = Math.ceil(dataMax / step) * step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = data.length > 0 ? innerWidth / data.length : 0;
  const barWidth = Math.max(1, Math.min(MAX_BAR_WIDTH, band - GAP));
  const centerX = (i: number) => MARGIN.left + band * (i + 0.5);
  const y = (v: number) => MARGIN.top + innerHeight * (1 - v / yMax);
  const baseline = y(0);

  const activeRow = active !== null ? data[active] : undefined;
  const tooltipOnLeft = active !== null && centerX(active) > width / 2;

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-xs"
              style={{ background: s.color }}
            />
            {s.label}
          </li>
        ))}
        {showCompare && (
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: COMPARE_COLOR }}
            />
            {compareLabel}
          </li>
        )}
      </ul>

      <div
        ref={ref}
        role="group"
        aria-label={`${ariaLabel}. Mit den Pfeiltasten durch die Jahre blättern.`}
        tabIndex={0}
        className="relative rounded-md"
        style={{ height: HEIGHT }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const delta = event.key === "ArrowRight" ? 1 : -1;
          setActive((current) =>
            Math.min(data.length - 1, Math.max(0, (current ?? -1) + delta)),
          );
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} aria-hidden="true">
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={tick === 0 ? "var(--axis)" : "var(--grid)"}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--muted)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatAxis(tick)}
                </text>
              </g>
            ))}

            {active !== null && (
              <rect
                x={MARGIN.left + band * active}
                y={MARGIN.top}
                width={band}
                height={innerHeight}
                fill="var(--grid)"
                opacity={0.6}
              />
            )}

            {data.map((row, i) => {
              const x = centerX(i) - barWidth / 2;
              const visible = series.filter((s) => value(row, s.key) > 0);
              let stacked = 0;
              return (
                <g key={i}>
                  {visible.map((s, index) => {
                    const from = y(stacked);
                    stacked += value(row, s.key);
                    const to = y(stacked);
                    // Surface gap between segments instead of an outline.
                    const gap = index > 0 && from - to > GAP + 1 ? GAP : 0;
                    const height = from - to - gap;
                    const isTop = index === visible.length - 1;
                    return isTop ? (
                      <path
                        key={s.key}
                        d={roundedTop(x, to, barWidth, height, 4)}
                        fill={s.color}
                      />
                    ) : (
                      <rect
                        key={s.key}
                        x={x}
                        y={to}
                        width={barWidth}
                        height={height}
                        fill={s.color}
                      />
                    );
                  })}
                  {row.tick && (
                    <text
                      x={centerX(i)}
                      y={baseline + 18}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--muted)"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {row.tick}
                    </text>
                  )}
                </g>
              );
            })}

            {showCompare && data.length > 0 && (
              <>
                <path
                  d={data
                    .map((row, i) => `${i === 0 ? "M" : "L"}${centerX(i)},${y(row.compare ?? 0)}`)
                    .join("")}
                  fill="none"
                  stroke={COMPARE_COLOR}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx={centerX(active ?? data.length - 1)}
                  cy={y(data[active ?? data.length - 1].compare ?? 0)}
                  r={4}
                  fill={COMPARE_COLOR}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              </>
            )}

            {data.map((_, i) => (
              <rect
                key={i}
                x={MARGIN.left + band * i}
                y={MARGIN.top}
                width={band}
                height={innerHeight + MARGIN.bottom}
                fill="transparent"
                onPointerMove={() => setActive(i)}
              />
            ))}
          </svg>
        )}

        {activeRow && active !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-56 rounded-lg border border-line bg-surface p-3 text-xs shadow-lg"
            style={
              tooltipOnLeft
                ? { right: width - centerX(active) + band / 2 + 8 }
                : { left: centerX(active) + band / 2 + 8 }
            }
          >
            <p className="mb-2 font-semibold text-ink">{activeRow.title}</p>
            <dl className="space-y-1">
              {[...series].reverse().map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className="inline-block h-0.5 w-3 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <dt className="flex-1 text-ink-2">{s.label}</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {formatValue(value(activeRow, s.key))}
                  </dd>
                </div>
              ))}
              <div className="flex items-center gap-2 border-t border-line pt-1">
                <dt className="flex-1 pl-5 text-ink-2">{totalLabel}</dt>
                <dd className="font-semibold tabular-nums text-ink">
                  {formatValue(total(activeRow))}
                </dd>
              </div>
              {showCompare && (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-0.5 w-3 shrink-0 rounded-full"
                    style={{ background: COMPARE_COLOR }}
                  />
                  <dt className="flex-1 text-ink-2">{compareLabel}</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {formatValue(activeRow.compare ?? 0)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
