import { type Dictionary, de } from "./de";
import { en } from "./en";
import type { Locale } from "./locale";

export type { Dictionary } from "./de";
export * from "./locale";

export const dictionaries: Record<Locale, Dictionary> = { de, en };
