"use client";

import { useMemo } from "react";
import type { CalculationError } from "@/lib/calculators/errors";
import {
  type PensionGapInput,
  type PensionGapResult,
  calculatePensionGap,
  validatePensionGapInput,
} from "@/lib/calculators/pension-gap";
import {
  toPensionGapInput,
  toSavingsInput,
  toWithdrawalPlanInput,
} from "@/lib/calculators/registry";
import {
  type SavingsInput,
  type SavingsResult,
  calculateSavings,
} from "@/lib/calculators/savings";
import {
  type WithdrawalPlanInput,
  type WithdrawalPlanResult,
  calculateWithdrawalPlan,
  validateWithdrawalPlanInput,
} from "@/lib/calculators/withdrawal-plan";
import { useSettingsEditor } from "./settings-provider";

/**
 * One hook per calculator, shared by its page and the cockpit. Each computes
 * from the settings in effect: the local draft inside a calculator, otherwise
 * the saved profiles.
 */
export interface Calculation<Input, Result> {
  input: Input;
  errors: CalculationError[];
  /** null while the inputs are outside what the calculator covers */
  result: Result | null;
}

export function usePensionGap(): Calculation<PensionGapInput, PensionGapResult> {
  const { settings } = useSettingsEditor();
  return useMemo(() => {
    const input = toPensionGapInput(settings);
    const errors = validatePensionGapInput(input);
    return {
      input,
      errors,
      result: errors.length === 0 ? calculatePensionGap(input) : null,
    };
  }, [settings]);
}

export function useSavings(): Calculation<SavingsInput, SavingsResult> {
  const { settings } = useSettingsEditor();
  return useMemo(() => {
    const input = toSavingsInput(settings);
    return { input, ...calculateSavings(input) };
  }, [settings]);
}

export function useWithdrawalPlan(): Calculation<
  WithdrawalPlanInput,
  WithdrawalPlanResult
> {
  const { settings } = useSettingsEditor();
  return useMemo(() => {
    const input = toWithdrawalPlanInput(settings);
    const errors = validateWithdrawalPlanInput(input);
    return {
      input,
      errors,
      result: errors.length === 0 ? calculateWithdrawalPlan(input) : null,
    };
  }, [settings]);
}
