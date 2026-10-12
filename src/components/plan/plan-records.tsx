"use client";

import {
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createPlanRecordAction,
  deletePlanRecordAction,
  loadPlanRecordsAction,
} from "@/app/actions/plan";
import { useSettingsEditor } from "@/components/settings-provider";
import { notifyTabs, useTabSync } from "@/components/tab-sync";
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
  // Requests on their way, and a count of local changes: what was fetched
  // before one of them must not overwrite it.
  const inFlight = useRef(0);
  const changes = useRef(0);
  const shown = useRef(records);
  useEffect(() => {
    shown.current = records;
  });

  /** Takes over what another tab (or browser) saved. */
  const refresh = useCallback(async () => {
    if (inFlight.current > 0) return;
    const seen = changes.current;
    const fresh = await loadPlanRecordsAction().catch(() => null);
    if (!fresh || inFlight.current > 0 || changes.current !== seen) return;
    const key = (value: PlanRecords) =>
      JSON.stringify({
        versions: [...value.versions].sort((a, b) => a.id.localeCompare(b.id)),
        snapshots: [...value.snapshots].sort((a, b) => a.id.localeCompare(b.id)),
      });
    // Equal data must not cause a new render and with it new calculations.
    if (key(fresh) !== key(shown.current)) setRecords(fresh);
  }, []);
  useTabSync("plan", refresh);

  const add = useCallback(
    async <K extends "versions" | "snapshots">(
      list: K,
      kind: "version" | "snapshot",
      data: Omit<PlanRecords[K][number], "id">,
    ) => {
      inFlight.current++;
      const id = await createPlanRecordAction(kind, data)
        .catch(() => null)
        .finally(() => inFlight.current--);
      if (!id) return false;
      changes.current++;
      setRecords((current) => ({
        ...current,
        [list]: [...current[list], { ...data, id }].sort(byDate),
      }));
      notifyTabs("plan");
      return true;
    },
    [],
  );

  const remove = useCallback(
    async (list: "versions" | "snapshots", id: string) => {
      inFlight.current++;
      const deleted = await deletePlanRecordAction(id)
        .catch(() => false)
        .finally(() => inFlight.current--);
      if (!deleted) return false;
      changes.current++;
      setRecords((current) => ({
        ...current,
        [list]: current[list].filter((record) => record.id !== id),
      }));
      notifyTabs("plan");
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
 * latest snapshot, or from the existing capital before the first one.
 */
export function usePlan(): PlanCalculation {
  const { settings: current } = useSettingsEditor();
  // The simulation takes a moment; typing must not wait for it.
  const settings = useDeferredValue(current);
  const { snapshots } = usePlanRecords();
  return useMemo(() => {
    const snapshot = latestSnapshot(snapshots);
    const input = toPlanInput(settings, snapshot?.values);
    const errors = validatePlanInput(input);
    return {
      input,
      errors,
      result: errors.length === 0 ? calculatePlan(input) : null,
      snapshot,
    };
  }, [settings, snapshots]);
}
