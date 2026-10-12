"use client";

import { type BudgetPart, budgetUse, restFor } from "@/lib/calculators/budget";
import { AV_DEPOT_MAX_MONTHLY } from "@/lib/calculators/registry";
import { useLocale } from "./locale-provider";
import { useSettingsEditor } from "./settings-provider";

/** How much of the monthly budget the rates of the calculators use. */
export function BudgetHint() {
  const { t, f } = useLocale();
  const { settings } = useSettingsEditor();
  const use = budgetUse(settings);
  const text = t.budget;
  const money = (value: number) =>
    Number.isInteger(value) ? f.euro(value) : f.euroCents(value);
  // Money that is still free or planned twice stands out; the rest is quiet.
  const state =
    use.free === 0 ? (
      text.exact
    ) : use.free > 0 ? (
      <strong className="font-semibold text-accent">{text.free(money(use.free))}</strong>
    ) : (
      <strong className="font-semibold text-critical">{text.over(money(-use.free))}</strong>
    );
  return (
    <>
      {text.hint(money(use.available), money(use.planned))} {state}
    </>
  );
}

/** Small button that sets a rate to what is left of the budget. */
export function RestButton({ part }: { part: BudgetPart }) {
  const { t } = useLocale();
  const { settings, update } = useSettingsEditor();
  const use = budgetUse(settings);
  const rest = restFor(use, part);

  const apply = () => {
    if (part === "av") {
      update("av-depot", {
        savingsRateMonthly: Math.min(rest, AV_DEPOT_MAX_MONTHLY),
      });
    } else if (part === "depot") {
      update("savings", { savingsRateMonthly: rest });
    } else {
      update("plan", { cashMonthly: rest });
    }
  };

  return (
    <button
      type="button"
      disabled={rest === use[part]}
      onClick={apply}
      title={t.budget.restTitle}
      className="rounded-md border border-axis px-2 py-0.5 text-xs font-medium text-ink hover:bg-accent-wash disabled:opacity-40"
    >
      {t.budget.rest}
    </button>
  );
}
