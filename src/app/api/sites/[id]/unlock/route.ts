import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { applyDuePendingAndEnforce, unlockSiteIfSlot } from "@/lib/site-limits";

export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await applyDuePendingAndEnforce(session.user.id);
  const result = await unlockSiteIfSlot(session.user.id, params.id);
  if (!result.ok) {
    const status = result.code === "NO_SLOT" ? 403 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json({ ok: true });
}
