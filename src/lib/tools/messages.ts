import { describeRequestError } from "@/lib/safe-request";

const FRIENDLY: Record<string, string> = {
  "Blocked: private or reserved address": "That domain points to a private or reserved address, so it can't be checked.",
  "DNS lookup failed": "We couldn't find that domain in DNS. Check the spelling, or the DNS records may be missing.",
  "Connection refused": "The server refused the connection.",
  "Connection reset": "The server closed the connection before answering.",
  "Timed out": "The server didn't answer in time.",
  "Host unreachable": "The server's network is unreachable from here.",
};

/** Plain-English version of a network failure for the public tools. */
export function friendlyNetError(errOrText: unknown): string {
  const text = typeof errOrText === "string" ? errOrText : describeRequestError(errOrText);
  if (FRIENDLY[text]) return FRIENDLY[text];
  if (text.startsWith("TLS certificate error")) return "The HTTPS connection failed because of a certificate problem.";
  return text || "The check failed.";
}
