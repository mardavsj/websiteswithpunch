import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader, Badge, Filters, PAGE_SIZE, Pager, Panel, fmtDate, pageOf, qs } from "@/components/admin/ui";
import { CopyText } from "@/components/admin/CopyText";
import { MessageHandled } from "@/components/admin/MessageHandled";

export const metadata = { title: "Messages" };
const TOPICS = ["general", "billing", "custom-limits", "other"];

export default async function AdminMessages({ searchParams: sp }: { searchParams: { topic?: string; state?: string; page?: string; m?: string } }) {
  await requireAdmin();
  const topic = TOPICS.includes(sp.topic ?? "") ? sp.topic : undefined;
  const state = sp.state === "handled" || sp.state === "all" ? sp.state : undefined; // default: open
  const where = { ...(topic && { topic }), ...(state === "handled" ? { handledAt: { not: null } } : state === "all" ? {} : { handledAt: null }) };
  const page = pageOf(sp.page);
  const [total, list, open, unread] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { id: true, name: true, email: true, topic: true, message: true, createdAt: true, emailSent: true, handledAt: true } }),
    sp.m ? prisma.contactMessage.findUnique({ where: { id: sp.m.slice(0, 40) } }) : null,
    prisma.contactMessage.count({ where: { handledAt: null } }),
  ]);
  const base = { topic, state, page: sp.page };

  return (
    <div className="space-y-4">
      <AdminHeader title="Messages" sub={`Contact form submissions. ${unread} open. Reply from the team inbox, then mark it handled.`} />
      <div className="flex flex-wrap gap-3">
        <Filters path="/admin/messages" q={base} name="state" options={[["", `Open (${unread})`], ["handled", "Handled"], ["all", "All"]]} />
        <Filters path="/admin/messages" q={base} name="topic" options={[["", "All"], ["general", "General"], ["billing", "Billing"], ["custom-limits", "Custom limits"], ["other", "Other"]]} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Panel>
          {list.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">No messages yet.</p> : (
            <ul className="divide-y divide-rule">
              {list.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/messages${qs(base, { m: c.id })}`} scroll={false} className={`block px-4 py-3 hover:bg-accent-soft ${open?.id === c.id ? "bg-accent-soft" : ""}`}>
                    <span className="flex items-center gap-2">
                      {!c.handledAt && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Open" />}
                      <span className={`min-w-0 flex-1 truncate text-sm text-ink ${c.handledAt ? "" : "font-medium"}`}>{c.name}</span>
                      <span className="shrink-0 text-xs text-muted">{fmtDate(c.createdAt, false)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{c.message}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Pager path="/admin/messages" q={base} page={page} total={total} />
        </Panel>
        <Panel title="Message">
          {!open ? <p className="px-4 py-8 text-center text-sm text-muted">Select a message to read it.</p> : (
            <div className="space-y-3 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-medium text-ink">{open.name}</h2>
                <Badge tone="accent">{open.topic}</Badge>
                {!open.emailSent && <Badge tone="danger">team email failed</Badge>}
                {open.handledAt ? <Badge tone="ok">handled</Badge> : <Badge>open</Badge>}
              </div>
              <CopyText value={open.email} label="Copy email" />
              <p className="text-xs text-muted">{fmtDate(open.createdAt)}{open.handledAt && ` · handled ${fmtDate(open.handledAt)} by ${open.handledBy}`}</p>
              <p className="whitespace-pre-wrap break-words border-t border-rule pt-3 text-sm leading-relaxed text-ink">{open.message}</p>
              <div className="border-t border-rule pt-3"><MessageHandled id={open.id} handled={Boolean(open.handledAt)} /></div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
