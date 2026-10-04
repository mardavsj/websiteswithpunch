/**
 * Cheap bot checks for public forms (contact, signup): a hidden honeypot field people never see,
 * and a minimum time between the form appearing and being sent. The form sends `elapsedMs`;
 * a value under MIN_FILL_MS means the form was filled faster than a person can type.
 */
export const MIN_FILL_MS = 2500;

export function looksLikeBot(body: Record<string, unknown>, honeypot: string): boolean {
  const trap = body[honeypot];
  if (typeof trap === "string" && trap.trim() !== "") return true;
  const elapsed = body.elapsedMs;
  return typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS;
}
