import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Signed-in only (the layouts check again on the server). */
const APP = /^\/(dashboard|plan|profile)(\/|$)/;
const VERIFY = "/verify-email";
/** APIs an unverified account may still call (auth, its own verification, public endpoints). */
const OPEN_API = /^\/api\/(auth|contact|tools|cron|webhooks\/dodo|me)(\/|$)/;

/**
 * - Signed-out visitors to app pages go to our login page (with a callbackUrl back).
 * - Signed-in but unverified accounts can only reach /verify-email: app pages redirect there and
 *   app APIs answer 403. Tokens from before verification existed have no flag and pass.
 * - Signed-in visitors to the homepage go to their dashboard (keeps the homepage static).
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  if (isApi && OPEN_API.test(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const unverified = Boolean(token) && token?.ev === false;

  if (isApi) {
    if (unverified) {
      return NextResponse.json(
        { error: "Verify your email to continue.", code: "EMAIL_UNVERIFIED" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.next();
  }

  if (pathname === VERIFY) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (!unverified) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }
  if (APP.test(pathname)) {
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    if (unverified) return NextResponse.redirect(new URL(VERIFY, req.url));
  }
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL(unverified ? VERIFY : "/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/plan/:path*", "/profile/:path*", "/verify-email", "/api/:path*"],
};
