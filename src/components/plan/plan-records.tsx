"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  createPlanRecordAction,
  deletePlanRecordAction,
} from "@/app/actions/plan";
import { useSettingsEditor } from "@/components/settings-provider";
import type { CalculationError } from "@/lib/calculators/errors";
import { toPlanInput } from "@/lib/calculators/registry";
import {
  type PlanInput,
  type PlanResult,
  type Pots,
  calculatePlan,
  validatePlanInput,
} from "@/lib/plan/plan";
import type { PlanRecords } from "@/lib/plan/store";
import {
  type PlanVersion,
  type Snapshot,
  latestSnapshot,
} from "@/lib/plan/tracking";

interface PlanRecordsContextValue extends PlanRecords {
  /** These return false when the record could not be stored. */
  addVersion: (version: Omit<PlanVersion, "id">) => Promise<boolean>;
  addSnapshot: (snapshot: Omit<Snapshot, "id">) => Promise<boolean>;
  removeVersion: (id: string) => Promise<boolean>;
  removeSnapshot: (id: string) => Promise<boolean>;
}

const PlanRecordsContext = createContext<PlanRecordsContextValue | null>(null);

const byDate = (a: { date: string }, b: { date: string }) =>
  a.date.localeCompare(b.date);

/** Holds the frozen plan versions and recorded snapshots of the signed-in user. */
export function PlanRecordsProvider({
  initialRecords,
  children,
}: {
  initialRecords: PlanRecords;
  children: React.ReactNode;
}) {
  const [records, setRecords] = useState(initialRecords);

  const add = useCallback(
    async <K extends "versions" | "snapshots">(
      list: K,
      kind: "version" | "snapshot",
      data: Omit<PlanRecords[K][number], "id">,
    ) => {
      const id = await createPlanRecordAction(kind, data).catch(() => null);
      if (!id) return false;
      setRecords((current) => ({
        ...current,
        [list]: [...current[list], { ...data, id }].sort(byDate),
      }));
      return true;
    },
    [],
  );

  const remove = useCallback(
    async (list: "versions" | "snapshots", id: string) => {
      const deleted = await deletePlanRecordAction(id).catch(() => false);
      if (!deleted) return false;
      setRecords((current) => ({
        ...current,
        [list]: current[list].filter((record) => record.id !== id),
      }));
      return true;
    },
    [],
  );

  const value = useMemo<PlanRecordsContextValue>(
    () => ({
      versions: [...records.versions].sort(byDate),
      snapshots: [...records.snapshots].sort(byDate),
      addVersion: (version) => add("versions", "version", version),
      addSnapshot: (snapshot) => add("snapshots", "snapshot", snapshot),
      removeVersion: (id) => remove("versions", id),
      removeSnapshot: (id) => remove("snapshots", id),
    }),
    [records, add, remove],
  );
  return <PlanRecordsContext value={value}>{children}</PlanRecordsContext>;
}

export function usePlanRecords(): PlanRecordsContextValue {
  const context = useContext(PlanRecordsContext);
  if (!context) {
    throw new Error("usePlanRecords must be used inside a PlanRecordsProvider");
  }
  return context;
}

export const NO_BALANCES: Pots = { av: 0, depot: 0, cash: 0 };

export interface PlanCalculation {
  input: PlanInput;
  errors: CalculationError[];
  result: PlanResult | null;
  /** The snapshot the balances come from; undefined before the first one. */
  snapshot: Snapshot | undefined;
}

/**
 * The Gesamtplan for the settings in effect, starting from the balances of the
 * latest snapshot.
 */
export function usePlan(): PlanCalculation {
  const { settings } = useSettingsEditor();
  const { snapshots } = usePlanRecords();
  return useMemo(() => {
    const snapshot = latestSnapshot(snapshots);
    const input = toPlanInput(settings, snapshot?.values ?? NO_BALANCES);
    const errors = validatePlanInput(input);
    return {
      input,
      errors,
      result: errors.length === 0 ? calculatePlan(input) : null,
      snapshot,
    };
  }, [settings, snapshots]);
}
