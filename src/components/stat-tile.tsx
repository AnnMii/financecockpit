export function StatTile({
  label,
  value,
  note,
  secondary,
  hero = false,
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
  /** A second figure shown beside the first, e.g. the same value before taxes. */
  secondary?: { label: string; value: string };
  /** The one headline figure of a view. */
  hero?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
        <div>
          <p className="text-sm text-ink-2">{label}</p>
          <p
            className={`mt-1 font-semibold text-ink ${hero ? "text-5xl" : "text-2xl"}`}
          >
            {value}
          </p>
        </div>
        {secondary && (
          <div>
            <p className="text-sm text-ink-2">{secondary.label}</p>
            <p
              className={`mt-1 font-semibold text-ink-2 ${hero ? "text-3xl" : "text-xl"}`}
            >
              {secondary.value}
            </p>
          </div>
        )}
      </div>
      {note && <p className="mt-2 text-xs text-ink-2">{note}</p>}
    </div>
  );
}
