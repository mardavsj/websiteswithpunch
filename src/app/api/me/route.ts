import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      plan: true,
      stripeCustomerId: true,
      stripeStatus: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    name: user.name,
    email: user.email,
    plan: user.plan,
    stripeStatus: user.stripeStatus,
    hasBilling: Boolean(user.stripeCustomerId),
  });
}
