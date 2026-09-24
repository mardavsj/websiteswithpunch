import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const TEST_USERS = [
  {
    email: "dp@gmail.com",
    name: "Test Pro",
    plan: "pro" as const,
    password: "123456789",
  },
  {
    email: "db@gmail.com",
    name: "Test Business",
    plan: "business" as const,
    password: "123456789",
  },
];

function authorized(req: Request): boolean {
  const key = req.headers.get("x-seed-key");
  if (!key) return false;
  const secret = process.env.SEED_SECRET || process.env.NEXTAUTH_SECRET;
  return Boolean(secret && key === secret);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = [];
    for (const u of TEST_USERS) {
      const password = await bcrypt.hash(u.password, 12);
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          password,
          plan: u.plan,
          stripeStatus: "active",
          sitePackCount: 0,
          pendingSitePackCount: null,
          pendingPackChangeAt: null,
          pendingPlan: null,
          pendingPlanAt: null,
          cancelAtPeriodEnd: false,
          showDefaultLockNotice: false,
        },
        create: {
          email: u.email,
          name: u.name,
          password,
          plan: u.plan,
          stripeStatus: "active",
        },
        select: { id: true, email: true, plan: true, stripeStatus: true },
      });
      results.push(user);
    }

    return NextResponse.json({
      ok: true,
      users: results,
      note: "Passwords set to 123456789; plans Pro/Business with stripeStatus=active (payment bypassed).",
    });
  } catch (err) {
    console.error("seed-test-users error", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
