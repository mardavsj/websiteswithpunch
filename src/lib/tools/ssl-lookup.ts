import net from "node:net";
import tls from "node:tls";
import { guardedLookup } from "@/lib/net-guard";
import { friendlyNetError } from "./messages";

export type SslDetails = {
  ok: boolean;
  issuer: string | null;
  subject: string | null;
  validFrom: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  trusted: boolean;
  trustError: string | null;
  protocol: string | null;
  altNames: string[];
  error: string | null;
};

const empty = (error: string): SslDetails => ({
  ok: false, issuer: null, subject: null, validFrom: null, expiresAt: null, daysLeft: null,
  trusted: false, trustError: null, protocol: null, altNames: [], error,
});

const TRUST_MESSAGES: Record<string, string> = {
  CERT_HAS_EXPIRED: "The certificate has expired.",
  ERR_TLS_CERT_ALTNAME_INVALID: "The certificate doesn't cover this hostname.",
  DEPTH_ZERO_SELF_SIGNED_CERT: "The certificate is self-signed.",
  SELF_SIGNED_CERT_IN_CHAIN: "The chain contains a self-signed certificate.",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: "The intermediate certificate is missing from the server.",
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: "The intermediate certificate is missing from the server.",
  CERT_NOT_YET_VALID: "The certificate isn't valid yet.",
};

const name = (o: unknown): string | null => {
  const r = o as Record<string, string | string[] | undefined> | undefined;
  const v = r?.O ?? r?.CN;
  return (Array.isArray(v) ? v[0] : v) ?? null;
};

/**
 * Read the certificate a host presents on port 443. The connection resolves through the SSRF
 * guard (public addresses only) and never sends an HTTP request.
 */
export function lookupSsl(host: string): Promise<SslDetails> {
  if (net.isIP(host)) return Promise.resolve(empty("Enter a domain name, not an IP address."));
  return new Promise((resolve) => {
    const socket = tls.connect({
      host, port: 443, servername: host, rejectUnauthorized: false, timeout: 8000,
      lookup: guardedLookup as never,
    });
    socket.once("secureConnect", () => {
      const cert = socket.getPeerCertificate();
      const protocol = socket.getProtocol();
      const authError = socket.authorizationError ? String(socket.authorizationError) : null;
      socket.end();
      if (!cert?.valid_to) return resolve(empty("The server didn't present a certificate."));
      const expires = new Date(cert.valid_to);
      const altNames = (cert.subjectaltname ?? "")
        .split(", ").filter((s) => s.startsWith("DNS:")).map((s) => s.slice(4)).slice(0, 20);
      resolve({
        ok: true,
        issuer: name(cert.issuer),
        subject: (cert.subject as { CN?: string } | undefined)?.CN ?? null,
        validFrom: new Date(cert.valid_from).toISOString(),
        expiresAt: expires.toISOString(),
        daysLeft: Math.floor((expires.getTime() - Date.now()) / 86_400_000),
        trusted: !authError,
        trustError: authError ? TRUST_MESSAGES[authError] ?? "Browsers won't trust this certificate." : null,
        protocol,
        altNames,
        error: null,
      });
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(empty("The server didn't answer on port 443 within 8 seconds."));
    });
    socket.once("error", (err) => {
      socket.destroy();
      resolve(empty(friendlyNetError(err)));
    });
  });
}
