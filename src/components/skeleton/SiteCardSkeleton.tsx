import { Sk, SkBtn } from "./Sk";

const TILES = [
  ["Last check", "4 Oct 2026, 1:00 pm"],
  ["Latency / code", "120ms · 200"],
  ["SSL left", "75 days"],
  ["Domain left", "220 days"],
] as const;

const BTN = "px-3 py-1.5 text-xs font-medium";
const NAME = "Website name for the monitoring dashboard example site";
const URL = "https://www.example-website.com/a-longer-path/for-the-skeleton/url";

/** Stand-in text of the remembered length (natural text, so widths stay realistic). */
const ghost = (src: string, len?: number) => (len ? src.slice(0, Math.max(3, len)) : undefined);

/** Mirrors SiteCard: title row, four metric tiles, action buttons. */
export function SiteCardSkeleton({
  analyticsLink = true,
  nameLen,
  urlLen,
}: {
  analyticsLink?: boolean;
  nameLen?: number;
  urlLen?: number;
}) {
  return (
    <article className="rounded-none border border-rule bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate font-display text-lg font-medium text-transparent">
            <Sk>{ghost(NAME, nameLen) ?? "Website name"}</Sk>
          </h3>
          <SkBtn className="px-2.5 py-0.5 text-xs font-medium">• Up</SkBtn>
        </div>
        <p className="min-w-0 max-w-[50%] shrink truncate text-right text-sm text-transparent">
          <Sk>{ghost(URL, urlLen) ?? "https://www.example-website.com"}</Sk>
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TILES.map(([label, value]) => (
          <div key={label} className="rounded-none border border-rule bg-surface px-3 py-2">
            <p className="text-xs">
              <Sk>{label}</Sk>
            </p>
            <p className="text-sm font-medium">
              <Sk>{value}</Sk>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <SkBtn className={BTN}>Recheck</SkBtn>
          {analyticsLink && <SkBtn className={BTN}>Analytics →</SkBtn>}
        </div>
        <div className="flex flex-wrap gap-2">
          <SkBtn outline className={BTN}>
            Edit
          </SkBtn>
          <SkBtn className={BTN}>Delete</SkBtn>
        </div>
      </div>
    </article>
  );
}

/** Locked card (site over the plan limit): name row, note lines and Delete. */
export function LockedSiteCardSkeleton({ nameLen, urlLen }: { nameLen?: number; urlLen?: number }) {
  return (
    <article className="rounded-none border border-rule bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate font-display text-lg font-medium text-transparent">
              <Sk>🔒 {ghost(NAME, nameLen) ?? "Website name"}</Sk>
            </h3>
            <p className="min-w-0 max-w-[50%] shrink truncate text-right text-sm text-transparent">
              <Sk>{ghost(URL, urlLen) ?? "https://www.example-website.com"}</Sk>
            </p>
          </div>
          <p className="mt-2 text-sm">
            <Sk>Locked. Your plan includes 10 sites.</Sk>
          </p>
          <p className="mt-1 text-xs">
            <Sk>To use this site, delete an active site or upgrade.</Sk>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SkBtn className={BTN}>Delete</SkBtn>
        </div>
      </div>
    </article>
  );
}
