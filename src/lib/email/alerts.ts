/** Branded alert emails: status banner (red / amber / green), facts table, one button. */
import { C, escapeHtml, renderEmail, renderText } from "./layout";
import type { BuiltEmail } from "./templates";
import type { PlannedAlert } from "@/lib/alerts/plan";
import { SITE_URL } from "@/lib/site-config";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const TONE = {
  red: { fg: "#c52020", bg: "#fdf0f0" },
  amber: { fg: "#b45309", bg: "#fdf6ec" },
  green: { fg: "#15803d", bg: "#eef8f1" },
} as const;
type Tone = keyof typeof TONE;

export type AlertSiteInfo = {
  id: string; name: string; url: string;
  statusCode?: number | null; error?: string | null; checkedAt: Date;
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const fmtTime = (d: Date) =>
  `${d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

function duration(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60_000));
  if (m < 60) return plural(m, "minute");
  const h = Math.round(m / 60);
  return h < 48 ? plural(h, "hour") : plural(Math.round(h / 24), "day");
}

function banner(tone: Tone, label: string, line: string) {
  const t = TONE[tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr>
<td style="background:${t.bg};border-left:4px solid ${t.fg};padding:12px 16px;font-family:${FONT}">
<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${t.fg}">${escapeHtml(label)}</div>
<div style="margin-top:2px;font-size:14px;line-height:20px;font-weight:600;color:#0a0e15">${escapeHtml(line)}</div>
</td></tr></table>`;
}

function facts(rows: [string, string][]) {
  const tr = rows.map(([k, v]) => `<tr>
<td class="wwp-muted wwp-rule" style="padding:9px 0;border-top:1px solid ${C.rule};font-family:${FONT};font-size:13px;color:${C.muted};width:38%;vertical-align:top">${escapeHtml(k)}</td>
<td class="wwp-ink wwp-rule" style="padding:9px 0;border-top:1px solid ${C.rule};font-family:${FONT};font-size:13px;color:${C.ink};word-break:break-word">${escapeHtml(v)}</td></tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px">${tr.join("")}</table>`;
}

type Copy = { tone: Tone; label: string; subject: string; heading: string; intro: string; rows: [string, string][]; tip: string };

function copyFor(a: PlannedAlert, s: AlertSiteInfo): Copy {
  const site: [string, string][] = [["Site", s.name], ["URL", s.url]];
  if (a.kind === "down") {
    return {
      tone: "red", label: "Site down", subject: `Down: ${s.name} isn't responding`,
      heading: `${s.name} is down`,
      intro: "Our latest check couldn't load your site. Visitors may be seeing an error right now.",
      rows: [...site, ["Checked", fmtTime(s.checkedAt)], ["Result", s.statusCode ? `HTTP ${s.statusCode}` : s.error || "No response"]],
      tip: "We'll email you once when it's back up. Use Recheck on the site page to test again now.",
    };
  }
  if (a.kind === "recovered") {
    return {
      tone: "green", label: "Recovered", subject: `Recovered: ${s.name} is back up`,
      heading: `${s.name} is back up`,
      intro: "Good news: your site is responding normally again.",
      rows: [...site, ["Back up at", fmtTime(s.checkedAt)], ["Down for about", duration(s.checkedAt.getTime() - a.downSince.getTime())]],
      tip: "Downtime is measured between our checks, so the real outage may have been shorter.",
    };
  }
  const what = a.kind === "ssl" ? "SSL certificate" : "domain";
  const What = a.kind === "ssl" ? "SSL certificate" : "Domain";
  const fix = a.kind === "ssl"
    ? "Renew or reissue the certificate with your host or certificate provider."
    : "Renew the domain with your registrar (turning on auto-renew avoids this).";
  const rows: [string, string][] = [...site, [a.level === "expired" ? "Expired on" : "Expires on", fmtDate(a.expiresAt)]];
  if (a.level === "invalid") {
    return {
      tone: "red", label: "SSL invalid", subject: `Action needed: ${s.name} has an untrusted SSL certificate`,
      heading: "Browsers don't trust this certificate",
      intro: `The certificate on ${s.name} isn't trusted (wrong host name, self-signed or incomplete chain). Visitors will see a security warning.`,
      rows, tip: fix,
    };
  }
  if (a.level === "expired") {
    return {
      tone: "red", label: `${What} expired`, subject: `Expired: ${s.name} ${what}`,
      heading: `The ${what} for ${s.name} has expired`,
      intro: a.kind === "ssl"
        ? "Browsers now show a security warning instead of your site."
        : "An expired domain can stop your site and email from working, and may be released to someone else.",
      rows, tip: fix,
    };
  }
  const days = Math.max(1, a.daysLeft);
  return {
    tone: a.level === "1" ? "red" : "amber",
    label: a.level === "1" ? `${What} expires tomorrow` : `${What} expiring`,
    subject: `${a.level === "1" ? "Urgent" : "Reminder"}: ${s.name} ${what} expires in ${plural(days, "day")}`,
    heading: `${What} expires in ${plural(days, "day")}`,
    intro: `The ${what} for ${s.name} expires on ${fmtDate(a.expiresAt)}.`,
    rows: [...rows, ["Days left", String(days)]],
    tip: fix,
  };
}

export function alertEmail(a: PlannedAlert, s: AlertSiteInfo, links: { page: string }): BuiltEmail {
  const c = copyFor(a, s);
  const url = `${SITE_URL}/dashboard/sites/${encodeURIComponent(s.id)}`;
  const prefs = `${SITE_URL}/profile#alerts`;
  const reason = `You're receiving this because email alerts are on for ${escapeHtml(s.name)}. <a class="wwp-link" href="${escapeHtml(prefs)}" style="color:${C.accent}">Alert settings</a> · <a class="wwp-link" href="${escapeHtml(links.page)}" style="color:${C.accent}">Unsubscribe</a>`;
  return {
    subject: c.subject,
    html: renderEmail({
      title: c.subject,
      preheader: `${c.label}: ${c.intro}`,
      top: banner(c.tone, c.label, s.url),
      heading: c.heading,
      intro: [escapeHtml(c.intro)],
      extra: facts(c.rows),
      button: { label: "Open site details", url },
      notes: [escapeHtml(c.tip), "We check sites once a day and whenever you press Recheck, so alerts aren't real-time."],
      reason,
    }),
    text: renderText([
      `${c.label.toUpperCase()}: ${c.heading}`,
      c.intro,
      c.rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      `Open site details: ${url}`,
      c.tip,
      "We check sites once a day and whenever you press Recheck, so alerts aren't real-time.",
      `Alert settings: ${prefs}\nUnsubscribe: ${links.page}`,
    ]),
  };
}
