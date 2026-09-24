import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  applyDuePendingAndEnforce,
  pendingTargetLimit,
  setKeepOnDowngrade,
} from "@/lib/site-limits";

export const dynamic = "force-dynamic";

const schema = z.object({
  siteIds: z.array(z.string().min(1)).max(200),
});

/**
 * Pending reductions only: update keepOnDowngrade flags.
 * Never locks/unlocks sites now. Returns 403 when nothing is pending.
 */
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

  const target = pendingTargetLimit(user);
  if (target == null) {
    return NextResponse.json(
      {
        error: "Active sites are fixed after your plan change. Delete an active site to free a slot, then unlock or add.",
        code: "NO_PENDING_CHANGE",
      },
      { status: 403 },
    );
  }

  const result = await setKeepOnDowngrade(session.user.id, parsed.data.siteIds, target);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, pending: true, maxKeep: target });
}
