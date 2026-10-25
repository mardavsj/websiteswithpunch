import { NextResponse } from "next/server";

/**
 * CSRF guard for cookie-authenticated mutations: JSON body required (a cross-site form can't send
 * application/json without a CORS preflight we never allow) and, when present, Origin must match.
 */
export function crossSiteBlocked(req: Request): NextResponse | null {
  const type = req.headers.get("content-type") || "";
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let bad = !type.toLowerCase().startsWith("application/json");
  if (origin && host) {
    try {
      bad ||= new URL(origin).host !== host;
    } catch {
      bad = true;
    }
  }
  return bad ? NextResponse.json({ error: "Request blocked." }, { status: 403 }) : null;
}
