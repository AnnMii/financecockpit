"use client";

import type { SettingsScope } from "@/lib/settings/schema";
import { DraftBar } from "./draft-settings";
import { Card } from "./fields";
import { CalculatorProfiles } from "./profile-picker";

/**
 * Page frame every calculator shares: profile pickers and the input form on
 * the left, results (or the reasons why nothing can be calculated) on the
 * right, and the panel for unsaved local changes. Must sit inside
 * <DraftSettings>.
 */
export function CalculatorShell({
  scope,
  form,
  errors,
  children,
}: {
  scope: Exclude<SettingsScope, "shared">;
  form: React.ReactNode;
  errors: string[];
  /** The results; shown when there are no errors. */
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="space-y-4">
        <CalculatorProfiles scope={scope} />
        <Card className="space-y-7">{form}</Card>
      </div>

      <DraftBar />

      {errors.length === 0 ? (
        <div className="min-w-0 space-y-5">{children}</div>
      ) : (
        <Card>
          <h2 className="mb-2 text-base font-semibold">
            Mit diesen Eingaben kann nicht gerechnet werden
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-critical">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function Assumptions({ items }: { items: React.ReactNode[] }) {
  return (
    <Card>
      <h2 className="mb-2 text-base font-semibold">Annahmen</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}
