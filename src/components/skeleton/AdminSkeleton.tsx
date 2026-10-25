import { Sk, SkBtn, SkCard, SkInput, SkStatus } from "./Sk";

type Kind = "overview" | "table" | "messages" | "payouts";
const rows = (n: number) => Array.from({ length: n }, (_, i) => i);
const W = ["someone@example.com", "a.longer.name@company.io", "team@shop.in", "hello@site.dev"];

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-medium"><Sk>{title}</Sk></h1>
      <p className="mt-1 text-sm"><Sk>{sub}</Sk></p>
    </div>
  );
}

function Chips({ n = 4 }: { n?: number }) {
  return <div className="flex flex-wrap gap-1.5">{rows(n).map((i) => <SkBtn key={i} outline className="px-3 py-1.5 text-sm">Filter</SkBtn>)}</div>;
}

function TableSk({ cols, n = 8 }: { cols: number; n?: number }) {
  return (
    <SkCard className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex gap-4 border-b border-rule px-4 py-2.5 text-xs">{rows(cols).map((i) => <span key={i} className="flex-1"><Sk>Column</Sk></span>)}</div>
        {rows(n).map((r) => (
          <div key={r} className="flex gap-4 border-b border-rule px-4 py-2.5 text-sm last:border-0">
            {rows(cols).map((c) => <span key={c} className="flex-1 truncate"><Sk>{c === 0 ? W[r % 4] : c % 2 ? "value" : "12 Oct 2026"}</Sk></span>)}
          </div>
        ))}
      </div>
    </SkCard>
  );
}

function ListSk({ n = 6 }: { n?: number }) {
  return (
    <SkCard className="divide-y divide-rule">
      {rows(n).map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <span className="min-w-0 flex-1 truncate"><Sk>{W[i % 4]}</Sk></span>
          <Sk className="text-xs">12 Oct 2026</Sk>
        </div>
      ))}
    </SkCard>
  );
}

/** Content-area skeletons for /admin pages (the sidebar stays mounted from the layout). */
export function AdminSkeleton({ kind, title }: { kind: Kind; title: string }) {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <SkStatus label={`Loading ${title.toLowerCase()}…`} />
      <Header title={title} sub="Live numbers from the database." />
      {kind === "overview" && (
        <>
          <SkCard className="divide-y divide-rule">
            <div className="px-4 py-2.5 text-xs"><Sk>Needs attention</Sk></div>
            {rows(3).map((i) => <div key={i} className="px-4 py-3 text-sm"><Sk>2 payout requests · $41.60 to pay</Sk></div>)}
          </SkCard>
          <div className="grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
            {rows(8).map((i) => (
              <div key={i} className="bg-surface px-4 py-4">
                <p className="text-xs"><Sk>Metric label</Sk></p>
                <p className="mt-1 font-display text-2xl font-medium"><Sk>1,234</Sk></p>
                <p className="mt-0.5 text-xs"><Sk>Small note</Sk></p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2"><ListSk n={8} /><ListSk n={8} /></div>
        </>
      )}
      {kind === "table" && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex gap-2 sm:w-80"><SkInput className="flex-1">Search email</SkInput><SkBtn outline className="px-3 py-2 text-sm">Search</SkBtn></div>
            <Chips />
          </div>
          <TableSk cols={6} />
        </>
      )}
      {kind === "messages" && (
        <>
          <Chips n={5} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <ListSk n={7} />
            <SkCard className="space-y-2 px-4 py-4 text-sm">{rows(5).map((i) => <p key={i}><Sk>A line of the message body text</Sk></p>)}</SkCard>
          </div>
        </>
      )}
      {kind === "payouts" && (
        <>
          <Chips />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex gap-2 sm:w-80"><SkInput className="flex-1">Search by email</SkInput><SkBtn outline className="px-3 py-2 text-sm">Search</SkBtn></div>
            <p className="text-sm"><Sk>Sort: Newest Oldest</Sk></p>
          </div>
          <TableSk cols={6} n={6} />
        </>
      )}
    </div>
  );
}
