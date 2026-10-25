import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanCode } from "@/lib/referrals/attribution";
import { REFERRAL } from "@/lib/referrals/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /r/CODE: first-touch attribution. Sets a 30-day httpOnly cookie only if none is set yet and the
 * code exists, then sends the visitor to the homepage. Unknown codes just redirect.
 */
export async function GET(req: Request, { params }: { params: { code: string } }) {
  const res = NextResponse.redirect(new URL("/", req.url), 307);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  const code = cleanCode(params.code);
  const already = req.headers.get("cookie")?.includes(`${REFERRAL.cookie}=`);
  if (!code || already) return res;
  const owner = await prisma.user
    .updateMany({ where: { referralCode: code }, data: { referralClicks: { increment: 1 } } })
    .catch(() => ({ count: 0 }));
  if (!owner.count) return res;
  res.cookies.set(REFERRAL.cookie, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL.attributionDays * 86_400,
  });
  return res;
}
