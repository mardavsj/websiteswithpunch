import { checkUptime } from "@/lib/checks";
import { runTool } from "@/lib/tools/guard";
import { friendlyNetError } from "@/lib/tools/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tools/down?q=example.com: one request from our server, status code + time (cached 60 s). */
export function GET(req: Request) {
  return runTool(req, "down", 60, async (t) => {
    const r = await checkUptime(`https://${t.host}`);
    return {
      ok: r.status !== "error",
      status: r.status,
      statusCode: r.statusCode,
      latencyMs: r.latencyMs,
      finalUrl: r.finalUrl ?? null,
      error: r.error ? friendlyNetError(r.error) : null,
    };
  });
}
