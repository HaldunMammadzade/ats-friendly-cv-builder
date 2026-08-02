import type { AtsCheck } from "./score";

/** Checks that cannot be inferred from existing CV content. */
const MANUAL_ONLY_IDS = new Set([
  "contact.email",
  "contact.phone",
]);

export function isAtsAutoFixable(check: AtsCheck): boolean {
  if (check.status === "pass") return false;
  if (MANUAL_ONLY_IDS.has(check.id)) return false;
  return true;
}
