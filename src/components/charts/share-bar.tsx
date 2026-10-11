export interface Share {
  label: string;
  value: number;
  /** CSS color; leave out for the part that is still missing. */
  color?: string;
}

const MISSING_COLOR = "var(--axis)";

/**
 * One horizontal bar split into parts of a whole, e.g. a desired pension into
 * what is covered and what is missing. The values stand in the legend, so
 * nothing depends on telling the colors apart.
 */
export function ShareBar({
  shares,
  formatValue,
  ariaLabel,
}: {
  shares: Share[];
  formatValue: (value: number) => string;
  ariaLabel: string;
}) {
  const total = shares.reduce((sum, share) => sum + share.value, 0) || 1;
  const visible = shares.filter((share) => share.value > 0);

  return (
    <div>
      <div
        role="img"
        aria-label={`${ariaLabel}: ${shares
          .map((share) => `${share.label} ${formatValue(share.value)}`)
          .join(", ")}`}
        className="flex h-5 gap-0.5"
      >
        {visible.map((share, index) => (
          <div
            key={share.label}
            title={`${share.label}: ${formatValue(share.value)}`}
            className={index === visible.length - 1 ? "rounded-r-sm" : ""}
            style={{
              width: `${(share.value / total) * 100}%`,
              background: share.color ?? MISSING_COLOR,
            }}
          />
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {shares.map((share) => (
          <div key={share.label} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 shrink-0 rounded-xs"
              style={{ background: share.color ?? MISSING_COLOR }}
            />
            <dt className="text-ink-2">{share.label}</dt>
            <dd className="font-semibold tabular-nums text-ink">
              {formatValue(share.value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
