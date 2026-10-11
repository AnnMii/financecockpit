export function StatTile({
  label,
  value,
  note,
  hero = false,
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
  /** The one headline figure of a view. */
  hero?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p
        className={`mt-1 font-semibold text-ink ${hero ? "text-5xl" : "text-2xl"}`}
      >
        {value}
      </p>
      {note && <p className="mt-2 text-xs text-ink-2">{note}</p>}
    </div>
  );
}
