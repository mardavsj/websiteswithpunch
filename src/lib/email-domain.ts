/**
 * Signup email checks: a small built-in list of disposable inbox providers, and a DNS check that
 * the domain can receive mail (MX, or an A/AAAA record as the implicit MX). DNS problems and
 * timeouts fail open so a slow resolver never blocks a real person.
 */
import { promises as dns } from "dns";

const DISPOSABLE = new Set(
  (
    "10minutemail.com 10minutemail.net 20minutemail.com 33mail.com anonbox.net burnermail.io " +
    "byom.de deadaddress.com discard.email dispostable.com dropmail.me emailondeck.com " +
    "fakeinbox.com fakemail.net getairmail.com getnada.com guerrillamail.biz guerrillamail.com " +
    "guerrillamail.de guerrillamail.info guerrillamail.net guerrillamail.org guerrillamailblock.com " +
    "harakirimail.com inboxbear.com inboxkitten.com incognitomail.org jetable.org mail-temp.com " +
    "mail.tm mailcatch.com maildrop.cc mailinator.com mailinator.net mailinator2.com mailnesia.com " +
    "mailpoof.com mailsac.com mailtemp.net meltmail.com mintemail.com moakt.com mohmal.com " +
    "mytemp.email mytrashmail.com nada.email nwytg.net one-time.email owlymail.com pokemail.net " +
    "sharklasers.com shortmail.net spam4.me spambog.com spambox.us spamgourmet.com spamex.com " +
    "temp-mail.io temp-mail.org tempail.com tempinbox.com tempmail.dev tempmail.net tempmail.plus " +
    "tempmailo.com tempr.email throwawaymail.com tmail.ws tmpmail.net tmpmail.org trash-mail.com " +
    "trashmail.com trashmail.de trashmail.net trashmail.me wegwerfmail.de yopmail.com yopmail.fr " +
    "yopmail.net emailfake.com fakemailgenerator.com tempmailaddress.com mailnull.com spamdecoy.net " +
    "grr.la guerrillamail.ws mvrht.net 1secmail.com 1secmail.net 1secmail.org esiix.com wwjmp.com " +
    "xojxe.com yoggm.com laafd.com vjuum.com tempmail.email minuteinbox.com luxusmail.org " +
    "emailtemporanea.com correotemporal.org disposablemail.com temporarymail.com etempmail.net"
  ).split(/\s+/),
);

export const EMAIL_DOMAIN_ERROR = "Use an email address you can receive mail at (no temporary inboxes).";

export function isDisposable(domain: string): boolean {
  const d = domain.toLowerCase();
  if (DISPOSABLE.has(d)) return true;
  // Subdomains of listed providers (e.g. x.mailinator.com).
  const parts = d.split(".");
  for (let i = 1; i < parts.length - 1; i++) if (DISPOSABLE.has(parts.slice(i).join("."))) return true;
  return false;
}

const timeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);

const missing = (e: unknown) => {
  const code = (e as { code?: string })?.code;
  return code === "ENOTFOUND" || code === "ENODATA";
};

/** false only when DNS clearly says the domain can't receive mail. */
export async function domainAcceptsMail(domain: string, ms = 2500): Promise<boolean> {
  try {
    const mx = await timeout(dns.resolveMx(domain), ms);
    // Null MX (RFC 7505): the domain explicitly accepts no mail.
    if (mx.length === 1 && (mx[0].exchange === "" || mx[0].exchange === ".")) return false;
    if (mx.length > 0) return true;
  } catch (e) {
    if (!missing(e)) return true;
  }
  // No MX: an address record still works as the implicit MX.
  for (const lookup of [(d: string) => dns.resolve4(d), (d: string) => dns.resolve6(d)]) {
    try {
      const r = await timeout(lookup(domain), ms);
      if (r.length > 0) return true;
    } catch (e) {
      if (!missing(e)) return true;
    }
  }
  return false;
}

/** null when the address looks deliverable, otherwise a user-facing message. */
export async function checkSignupEmail(email: string): Promise<string | null> {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain || isDisposable(domain)) return EMAIL_DOMAIN_ERROR;
  if (!(await domainAcceptsMail(domain))) return EMAIL_DOMAIN_ERROR;
  return null;
}
