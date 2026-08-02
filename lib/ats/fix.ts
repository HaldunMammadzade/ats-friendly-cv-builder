export type { FixResult } from "./fix-engine";
export { runAtsFix } from "./fix-engine";
export { isAtsAutoFixable } from "./fixable";

/** @deprecated Client code should call the API route; kept for type compatibility. */
export function applyAtsFix(): never {
  throw new Error("Use POST /api/ats/fix instead of applyAtsFix on the client.");
}

export const AUTO_FIXABLE_IDS = new Set<string>();
