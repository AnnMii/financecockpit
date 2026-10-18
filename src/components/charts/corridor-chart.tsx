"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { niceStep, useWidth } from "./stacked-columns";

export interface Corridor {
  key: string;
  label: string;
  /** CSS color of the line and, washed out, of the band. */
  color: string;
  points: { x: number; low: number; mid: number; high: number }[];
}

export interface CorridorMarkers {
  label: string;
  color: string;
  items: { x: number; y: number; title: string }[];
}

interface Props {
  /** Drawn in this order; the last one lies on top. */
  corridors: Corridor[];
  /** Single measured values, e.g. recorded balances. */
  markers?: CorridorMarkers;
  /** Names of the band's ends and middle, for the tooltip. */
  rangeLabel: string;
  formatX: (x: number) => string;
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
  ariaLabel: string;
  height?: number;
}

const MARGIN = { top: 12, right: 16, bottom: 28, left: 76 };

/**
 * Ranges over time: for each corridor a band between its low and high course
 * with the middle course as a line, plus single measured points.
 */
export function CorridorChart({
  corridors,
  markers,
  rangeLabel,
  formatX,
  formatValue,
  formatAxis,
  ariaLabel,
  height = 300,
}: Props) {
  const { t } = useLocale();
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);

  const allPoints = corridors.flatMap((c) => c.points);
  const xs = [...allPoints.map((p) => p.x), ...(markers?.items.map((m) => m.x) ?? [])];
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs, xMin + 1);
  const dataMax = Math.max(
    1,
    ...allPoints.map((p) => p.high),
    ...(markers?.items.map((m) => m.y) ?? []),
  );
  const step = niceStep(dataMax, height < 220 ? 3 : 4);
  const yMax = Math.ceil(dataMax / step) * step;
  const yTicks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = height - MARGIN.top - MARGIN.bottom;
  const x = (value: number) =>
    MARGIN.left + ((value - xMin) / (xMax - xMin)) * innerWidth;
  const y = (value: number) => MARGIN.top + innerHeight * (1 - value / yMax);

  // Whole positions on the x axis, a label on every fifth.
  const positions: number[] = [];
  for (let p = Math.ceil(xMin); p <= Math.floor(xMax); p++) positions.push(p);

  const line = (points: Corridor["points"], pick: (p: Corridor["points"][number]) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x)},${y(pick(p))}`).join("");
  const band = (points: Corridor["points"]) =>
    `${line(points, (p) => p.high)}${[...points]
      .reverse()
      .map((p) => `L${x(p.x)},${y(p.low)}`)
      .join("")}Z`;

  const at = (corridor: Corridor, position: number) =>
    corridor.points.find((p) => Math.abs(p.x - position) < 0.5);
  const markersAt = (position: number) =>
    markers?.items.filter((m) => Math.abs(m.x - position) < 0.5) ?? [];
  const tooltipOnLeft = active !== null && x(active) > width / 2;

  const selectAt = (event: React.PointerEvent<HTMLDivElement>) => {
    if (innerWidth === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const value =
      xMin + ((event.clientX - bounds.left - MARGIN.left) / innerWidth) * (xMax - xMin);
    setActive(
      Math.min(positions.at(-1)!, Math.max(positions[0], Math.round(value))),
    );
  };

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        {corridors.map((corridor) => (
          <li key={corridor.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: corridor.color }}
            />
            {corridor.label}
          </li>
        ))}
        {markers && markers.items.length > 0 && (
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: markers.color }}
            />
            {markers.label}
          </li>
        )}
      </ul>

      <div
        ref={ref}
        role="group"
        aria-label={`${ariaLabel}. ${t.common.chartKeyboardHint}`}
        tabIndex={0}
        className="relative touch-pan-y rounded-md"
        style={{ height }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const delta = event.key === "ArrowRight" ? 1 : -1;
          setActive((current) =>
            Math.min(
              positions.at(-1)!,
              Math.max(positions[0], (current ?? positions[0] - 1) + delta),
            ),
          );
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={(event) => {
          // A finger lifting off must not hide the tooltip again.
          if (event.pointerType === "mouse") setActive(null);
        }}
        onPointerMove={selectAt}
        onPointerDown={selectAt}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden="true">
            {yTicks.map((tick) => (
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
                  fontSize={12}
                  fill="var(--muted)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatAxis(tick)}
                </text>
              </g>
            ))}
            {positions
              .filter((p) => p % 5 === 0)
              .map((p) => (
                <text
                  key={p}
                  x={x(p)}
                  y={y(0) + 18}
                  textAnchor="middle"
                  fontSize={12}
                  fill="var(--muted)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {p}
                </text>
              ))}

            {corridors.map((corridor) => (
              <g key={corridor.key}>
                <path d={band(corridor.points)} fill={corridor.color} opacity={0.12} />
                <path
                  d={line(corridor.points, (p) => p.mid)}
                  fill="none"
                  stroke={corridor.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {active !== null && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={MARGIN.top}
                y2={y(0)}
                stroke="var(--axis)"
              />
            )}

            {markers?.items.map((marker) => (
              <circle
                key={`${marker.x}-${marker.y}`}
                cx={x(marker.x)}
                cy={y(marker.y)}
                r={5}
                fill={markers.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
          </svg>
        )}

        {active !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-60 rounded-lg border border-line bg-surface p-3 text-xs shadow-lg"
            style={
              tooltipOnLeft
                ? { right: width - x(active) + 10 }
                : { left: x(active) + 10 }
            }
          >
            <p className="mb-2 font-semibold text-ink">{formatX(active)}</p>
            <dl className="space-y-1.5">
              {corridors.map((corridor) => {
                const point = at(corridor, active);
                if (!point) return null;
                return (
                  <div key={corridor.key}>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-0.5 w-3 shrink-0 rounded-full"
                        style={{ background: corridor.color }}
                      />
                      <dt className="flex-1 text-ink-2">{corridor.label}</dt>
                      <dd className="font-semibold tabular-nums text-ink">
                        {formatValue(point.mid)}
                      </dd>
                    </div>
                    <dd className="pl-5 tabular-nums text-ink-2">
                      {rangeLabel}: {formatValue(point.low)} – {formatValue(point.high)}
                    </dd>
                  </div>
                );
              })}
              {markers &&
                markersAt(active).map((marker) => (
                  <div key={marker.title} className="flex items-center gap-2">
                    <span
                      className="inline-block size-2 shrink-0 rounded-full"
                      style={{ background: markers.color }}
                    />
                    <dt className="flex-1 text-ink-2">{marker.title}</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      {formatValue(marker.y)}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
