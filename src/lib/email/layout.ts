/**
 * Shared transactional email layout: table-based, inline styles (Gmail, Apple Mail, Outlook),
 * brand colours from tailwind/globals.css, square corners. Dark mode: color-scheme meta plus
 * prefers-color-scheme / Outlook.com [data-ogsc] overrides; Gmail's forced inversion of a light
 * card with near-black text also reads well, and the blue logo mark works on both.
 */
import { SITE_URL } from "@/lib/site-config";

export const C = {
  bg: "#f6f6f3", surface: "#fefefd", ink: "#0a0e15", muted: "#666d7a", rule: "#e3e3e1",
  accent: "#1468e6", danger: "#c52020",
  dBg: "#2f3237", dSurface: "#393c41", dInk: "#e6e7ea", dMuted: "#abaeb5", dRule: "#52555a", dAccent: "#4795f5",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono','Courier New',monospace";
export const LOGO_URL = `${SITE_URL}/email/logo-mark.png`;
export const CONTACT_URL = `${SITE_URL}/contact?topic=general`;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const DARK_CSS = (p: string) => `
${p} .wwp-bg{background:${C.dBg}!important}
${p} .wwp-card{background:${C.dSurface}!important;border-color:${C.dRule}!important}
${p} .wwp-ink{color:${C.dInk}!important}
${p} .wwp-muted{color:${C.dMuted}!important}
${p} .wwp-rule{border-color:${C.dRule}!important}
${p} .wwp-code{background:${C.dBg}!important;color:${C.dInk}!important;border-color:${C.dRule}!important}
${p} .wwp-link{color:${C.dAccent}!important}`;

export type EmailParts = {
  title: string;
  preheader: string;
  heading: string;
  /** Trusted HTML blocks (escape user input before passing it in). */
  intro: string[];
  code?: string;
  button?: { label: string; url: string };
  /** Small muted lines under the main block (expiry, safety note). */
  notes?: string[];
  /** Raw HTML block for custom content (contact notification). */
  extra?: string;
  /** Why the recipient got this email, shown in the footer. */
  reason: string;
};

const p = (html: string, style = "") =>
  `<p class="wwp-ink" style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${C.ink};${style}">${html}</p>`;

function codeBlock(code: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr>
<td class="wwp-code" align="center" style="background:${C.bg};border:1px solid ${C.rule};padding:18px 12px;font-family:${MONO};font-size:34px;line-height:40px;font-weight:700;letter-spacing:10px;color:${C.ink}">${escapeHtml(code)}</td>
</tr></table>`;
}

function button(label: string, url: string) {
  const u = escapeHtml(url);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td>
<!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${u}" style="height:46px;v-text-anchor:middle;width:220px;" stroke="f" fillcolor="${C.accent}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(label)}</center></v:rect><![endif]-->
<!--[if !mso]><!--><a href="${u}" style="display:inline-block;background:${C.accent};color:#ffffff;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;text-decoration:none;padding:13px 26px;mso-hide:all">${escapeHtml(label)}</a><!--<![endif]-->
</td></tr></table>`;
}

export function renderEmail(e: EmailParts): string {
  const notes = (e.notes || [])
    .map((n) => `<p class="wwp-muted" style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted}">${n}</p>`)
    .join("");
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(e.title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%}
a{color:${C.accent}}
@media (max-width:600px){.wwp-pad{padding:24px 20px!important}.wwp-code{font-size:28px!important;letter-spacing:7px!important}}
@media (prefers-color-scheme:dark){${DARK_CSS("")}}
${DARK_CSS("[data-ogsc]")}
</style></head>
<body class="wwp-bg" style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(e.preheader)}${"&#8199;&#65279;&#847; ".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wwp-bg" style="background:${C.bg}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 4px 16px">
<a href="${SITE_URL}" style="text-decoration:none"><img src="${LOGO_URL}" width="32" height="32" alt="" style="display:inline-block;vertical-align:middle;border:0;outline:none">
<span class="wwp-ink" style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:${FONT};font-size:16px;font-weight:600;color:${C.ink}">Websites With Punch</span></a>
</td></tr>
<tr><td class="wwp-card wwp-pad" style="background:${C.surface};border:1px solid ${C.rule};padding:32px 36px">
<h1 class="wwp-ink" style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${C.ink}">${escapeHtml(e.heading)}</h1>
${e.intro.map((h) => p(h)).join("")}
${e.code ? codeBlock(e.code) : ""}${e.button ? button(e.button.label, e.button.url) : ""}${e.extra || ""}${notes}
</td></tr>
<tr><td style="padding:20px 4px 0">
<p class="wwp-muted" style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted}">${e.reason}</p>
<p class="wwp-muted" style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted}">Websites With Punch · A product by Makvion Technologies. · <a class="wwp-link" href="${CONTACT_URL}" style="color:${C.accent};text-decoration:underline">Contact us</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

/** Plain-text twin: same words, links in full. */
export function renderText(lines: string[]): string {
  return `${lines.join("\n\n")}\n\n--\nWebsites With Punch · A product by Makvion Technologies.\nContact us: ${CONTACT_URL}\n`;
}
