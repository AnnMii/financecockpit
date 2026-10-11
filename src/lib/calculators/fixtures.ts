/** Helpers for tests that compare with answers recorded from the Finanzfluss website. */

/** "617.285€" -> 617285, "512,25€" -> 512.25, "8,50" -> 8.5 */
export function parseGerman(value: string): number {
  return Number(value.replace("€", "").replaceAll(".", "").replace(",", "."));
}

/**
 * How far a result may be from a recorded value: the website shows cents for
 * small amounts and whole euros from 1.000 € on.
 */
export function tolerance(recorded: string): number {
  return recorded.includes(",") ? 0.0051 : 0.51;
}
