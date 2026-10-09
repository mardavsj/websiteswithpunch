import type { Prisma } from "@prisma/client";
import type { DomainResult, SslResult } from "./checks";

/**
 * Certificate and domain facts kept on Site.sslInfo / Site.domainInfo for the analytics Details
 * panels. Built from the same lookups the free tools use. A failed lookup keeps the last good
 * facts and records why it failed, so a transient error never wipes what we know.
 */
export type SslInfo = {
  host: string | null;
  issuer: string | null;
  subject: string | null;
  altNames: string[];
  validFrom: string | null;
  expiresAt: string | null;
  protocol: string | null;
  trusted: boolean | null;
  trustError: string | null;
  serialNumber: string | null;
  fingerprint256: string | null;
  checkedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
};

export type DomainInfo = {
  domain: string | null;
  registrar: string | null;
  registeredAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
  nameservers: string[];
  statuses: string[];
  source: "RDAP" | "WHOIS" | null;
  server: string | null;
  checkedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
};

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const asObj = <T>(v: unknown): T | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as T) : null);

function failed<T extends { lastError: string | null; lastErrorAt: string | null }>(
  prev: T | null,
  blank: T,
  error: string | null,
  at: Date,
): T {
  return { ...(prev ?? blank), lastError: (error || "Lookup failed").slice(0, 200), lastErrorAt: at.toISOString() };
}

export function nextSslInfo(prevRaw: unknown, r: SslResult, at = new Date()): SslInfo {
  const prev = asObj<SslInfo>(prevRaw);
  const d = r.details;
  if (!d || !r.expiresAt) {
    return failed(prev, {
      host: null, issuer: null, subject: null, altNames: [], validFrom: null, expiresAt: null,
      protocol: null, trusted: null, trustError: null, serialNumber: null, fingerprint256: null,
      checkedAt: null, lastError: null, lastErrorAt: null,
    }, r.error, at);
  }
  return {
    host: d.host, issuer: d.issuer, subject: d.subject, altNames: d.altNames, validFrom: d.validFrom,
    expiresAt: d.expiresAt, protocol: d.protocol, trusted: d.trusted, trustError: d.trustError,
    serialNumber: d.serialNumber, fingerprint256: d.fingerprint256, checkedAt: at.toISOString(),
    lastError: null, lastErrorAt: null,
  };
}

export function nextDomainInfo(prevRaw: unknown, r: DomainResult, at = new Date()): DomainInfo {
  const prev = asObj<DomainInfo>(prevRaw);
  if (!r.expiresAt) {
    return failed(prev, {
      domain: r.domain ?? null, registrar: null, registeredAt: null, updatedAt: null, expiresAt: null,
      nameservers: [], statuses: [], source: null, server: null, checkedAt: null,
      lastError: null, lastErrorAt: null,
    }, r.error, at);
  }
  return {
    domain: r.domain ?? null, registrar: r.registrar ?? null, registeredAt: iso(r.registeredAt),
    updatedAt: iso(r.updatedAt), expiresAt: iso(r.expiresAt), nameservers: r.nameservers ?? [],
    statuses: r.statuses ?? [], source: r.source ?? null, server: r.server ?? null,
    checkedAt: at.toISOString(), lastError: null, lastErrorAt: null,
  };
}

/** Prisma data for the info columns after a check. Pass only the lookups that actually ran. */
export function infoFields(
  prev: { sslInfo?: unknown; domainInfo?: unknown } | null,
  result: { ssl?: SslResult; domain?: DomainResult },
): { sslInfo?: Prisma.InputJsonValue; domainInfo?: Prisma.InputJsonValue } {
  return {
    ...(result.ssl ? { sslInfo: nextSslInfo(prev?.sslInfo, result.ssl) as Prisma.InputJsonValue } : {}),
    ...(result.domain ? { domainInfo: nextDomainInfo(prev?.domainInfo, result.domain) as Prisma.InputJsonValue } : {}),
  };
}

export function readSslInfo(v: unknown): SslInfo | null {
  return asObj<SslInfo>(v);
}
export function readDomainInfo(v: unknown): DomainInfo | null {
  return asObj<DomainInfo>(v);
}
