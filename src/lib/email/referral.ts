/** Referral program emails: commission earned, available, payout paid / rejected, method changed. */
import { C, escapeHtml, renderEmail, renderText } from "./layout";
import type { BuiltEmail } from "./templates";
import { TONE } from "./alerts";
import { SITE_URL } from "@/lib/site-config";
import { REFERRAL, fmtUsd } from "@/lib/referrals/config";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const URL_ = `${SITE_URL}/referrals`;
const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const REASON = "You're receiving this because you take part in the Websites With Punch referral program.";

function amountBlock(tone: keyof typeof TONE | "blue", label: string, amount: string) {
  const fg = tone === "blue" ? C.accent : TONE[tone].fg;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr>
<td class="wwp-code" style="background:${C.bg};border:1px solid ${C.rule};border-top:3px solid ${fg};padding:16px 18px;font-family:${FONT}">
<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${fg}">${escapeHtml(label)}</div>
<div class="wwp-ink" style="margin-top:4px;font-size:30px;line-height:36px;font-weight:700;color:${C.ink}">${escapeHtml(amount)}</div>
</td></tr></table>`;
}

function build(o: { subject: string; heading: string; block: string; intro: string[]; notes: string[]; button?: string }): BuiltEmail {
  return {
    subject: o.subject,
    html: renderEmail({
      title: o.subject, preheader: o.intro[0], heading: o.heading, top: o.block,
      intro: o.intro.map(escapeHtml), button: { label: o.button || "Open referrals", url: URL_ },
      notes: o.notes.map(escapeHtml), reason: REASON,
    }),
    text: renderText([o.heading, ...o.intro, `Open referrals: ${URL_}`, ...o.notes, REASON]),
  };
}

export function commissionEarnedEmail(cents: number, availableAt: Date): BuiltEmail {
  return build({
    subject: `You earned ${fmtUsd(cents)} in referral commission`,
    heading: "New referral commission",
    block: amountBlock("blue", "Pending commission", fmtUsd(cents)),
    intro: [`Someone you referred just paid for Websites With Punch, so you earned ${fmtUsd(cents)}.`],
    notes: [`It's on hold until ${fmtDate(availableAt)} (our ${REFERRAL.holdDays}-day refund window), then becomes available to withdraw. If the payment is refunded or disputed, it's reversed.`],
  });
}

export function commissionAvailableEmail(cents: number): BuiltEmail {
  return build({
    subject: `${fmtUsd(cents)} in referral earnings is now available`,
    heading: "Earnings now available",
    block: amountBlock("green", "Now available", fmtUsd(cents)),
    intro: [`${fmtUsd(cents)} finished its ${REFERRAL.holdDays}-day hold and moved to your available balance.`],
    notes: [`You can request a payout once your available balance reaches ${fmtUsd(REFERRAL.minPayoutCents)}.`],
    button: "Withdraw earnings",
  });
}

export function payoutPaidEmail(cents: number, method: string, reference: string): BuiltEmail {
  return build({
    subject: `Your ${fmtUsd(cents)} referral payout was sent`,
    heading: "Payout sent",
    block: amountBlock("green", "Paid", fmtUsd(cents)),
    intro: [`We sent ${fmtUsd(cents)} to your ${method === "upi" ? "UPI ID" : "PayPal account"}.`, `Reference: ${reference}`],
    notes: ["It can take a few days to show, depending on the provider. Reply via our contact page if it hasn't arrived within 7 days."],
  });
}

export function payoutRejectedEmail(cents: number, reason: string): BuiltEmail {
  return build({
    subject: "Your referral payout request needs attention",
    heading: "Payout not sent",
    block: amountBlock("red", "Request declined", fmtUsd(cents)),
    intro: [`We couldn't send your ${fmtUsd(cents)} payout.`, `Reason: ${reason}`],
    notes: ["Unless the reason says otherwise, the amount is back in your available balance and you can request again."],
  });
}

export function payoutMethodChangedEmail(method: string, masked: string): BuiltEmail {
  return build({
    subject: "Your referral payout method was changed",
    heading: "Payout method changed",
    block: amountBlock("amber", "Security notice", method === "upi" ? "UPI" : "PayPal"),
    intro: [`Payouts will now go to ${masked}.`],
    notes: ["Didn't make this change? Change your password now and contact us right away."],
  });
}
