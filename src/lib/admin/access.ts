/**
 * Edge-safe admin rules (no Prisma/Node imports): used by middleware, server pages and tests.
 * ADMIN_EMAILS is a comma separated allowlist; matching is trimmed and case-insensitive.
 */
export function isAdminEmail(email: string | null | undefined, list = process.env.ADMIN_EMAILS || ""): boolean {
  if (!email) return false;
  const allow = list.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}

/** Customer-only pages: admins are sent to /admin instead. */
const CUSTOMER_PAGE = /^\/(dashboard|plan|referrals|checkout|onboarding)(\/|$)/;
/** Customer APIs that create or change sites, billing or referral state: 403 for admins. */
const CUSTOMER_API = /^\/api\/(sites|billing|referrals)(\/|$)/;
const ADMIN_AREA = /^\/(admin|api\/admin)(\/|$)/;

export type AdminDecision = "next" | "to-admin" | "not-found" | "forbidden";

/** What middleware does with a request, given whether a session exists and whether it is an admin. */
export function adminDecision(pathname: string, method: string, signedIn: boolean, admin: boolean): AdminDecision {
  if (ADMIN_AREA.test(pathname)) return admin ? "next" : "not-found";
  if (!admin || !signedIn) return "next";
  if (pathname === "/" || CUSTOMER_PAGE.test(pathname)) return "to-admin";
  // Reads stay harmless; anything that would add sites, buy plans or move referral money is refused.
  if (CUSTOMER_API.test(pathname) && method !== "GET" && method !== "HEAD") return "forbidden";
  return "next";
}
