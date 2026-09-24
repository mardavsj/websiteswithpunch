import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  applyDuePendingAndEnforce,
  pendingTargetLimit,
  setKeepOnDowngrade,
  swapActiveSites,
} from "@/lib/site-limits";

export const dynamic = "force-dynamic";

const schema = z.object({
  siteIds: z.array(z.string().min(1)).max(200),
  /** When true, only store keepOnDowngrade for a pending change (no immediate lock). */
  pendingOnly: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid selection." }, { status: 400 });
  }

  await applyDuePendingAndEnforce(session.user.id);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (parsed.data.pendingOnly) {
    const target = pendingTargetLimit(user);
    if (target == null) {
      return NextResponse.json(
        { error: "No pending plan change to choose sites for." },
        { status: 400 },
      );
    }
    const result = await setKeepOnDowngrade(session.user.id, parsed.data.siteIds, target);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true, pending: true, maxKeep: target });
  }

  const result = await swapActiveSites(session.user.id, parsed.data.siteIds);
  if (!result.ok) {
    const status = result.code === "SWAP_COOLDOWN" ? 429 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json({ ok: true });
}
