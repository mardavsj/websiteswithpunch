import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dismissDefaultLockNotice } from "@/lib/site-limits";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dismissDefaultLockNotice(session.user.id);
  return NextResponse.json({ ok: true });
}
