/**
 * Check the Dodo product / add-on IDs in env against the Dodo API (mode from
 * DODO_PAYMENTS_ENVIRONMENT). Read-only. With production env pulled from Vercel:
 *   npx tsx --env-file=.env.production.local scripts/check-dodo-catalog.ts
 */
import { getDodo, dodoEnvironment } from "../src/lib/dodo";
import { checkCatalog } from "../src/lib/dodo-catalog-check";

async function main() {
  const dodo = getDodo();
  if (!dodo) throw new Error("DODO_PAYMENTS_API_KEY is not set");
  console.log(`Dodo mode: ${dodoEnvironment()}\n`);
  const lines = await checkCatalog(dodo);
  for (const l of lines) console.log(`${l.ok ? "OK  " : "FAIL"} ${l.envVar.padEnd(34)} ${(l.id ?? "-").padEnd(28)} ${l.detail}`);
  const bad = lines.filter((l) => !l.ok).length;
  console.log(bad ? `\n${bad} problem(s). Fix them in Vercel → Settings → Environment Variables, then redeploy.` : "\nAll 8 IDs check out.");
  if (bad) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
