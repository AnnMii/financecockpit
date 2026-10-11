"use client";

import { useMemo } from "react";
import { useSettingsEditor } from "@/components/settings-provider";
import {
  type AvDepotInput,
  type AvDepotResult,
  calculateAvDepot,
  validateAvDepotInput,
} from "@/lib/calculators/av-depot";
import type { CalculationError } from "@/lib/calculators/errors";
import { toAvDepotInput } from "@/lib/calculators/registry";

export interface AvDepotCalculation {
  input: AvDepotInput;
  errors: CalculationError[];
  /** null while the inputs are outside what the model covers */
  result: AvDepotResult | null;
}

/** AV-Depot calculation for the settings in effect: the local draft inside a calculator, otherwise the saved ones. */
export function useAvDepot(): AvDepotCalculation {
  const { settings } = useSettingsEditor();
  return useMemo(() => {
    const input = toAvDepotInput(settings);
    const errors = validateAvDepotInput(input);
    return {
      input,
      errors,
      result: errors.length === 0 ? calculateAvDepot(input) : null,
    };
  }, [settings]);
}
