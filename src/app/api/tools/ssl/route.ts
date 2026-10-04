import { runTool } from "@/lib/tools/guard";
import { lookupSsl } from "@/lib/tools/ssl-lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tools/ssl?q=example.com: issuer, validity dates and days left (cached 10 min). */
export function GET(req: Request) {
  return runTool(req, "ssl", 600, async (t) => ({ ...(await lookupSsl(t.host)) }));
}
