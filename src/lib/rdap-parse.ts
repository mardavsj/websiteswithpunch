import type { DomainResult } from "./checks-domain";

/** The parts of an RDAP domain reply (RFC 9083) we read. */
type RdapEntity = { roles?: string[]; vcardArray?: [string, Array<[string, unknown, string, unknown]>] };
export type RdapDoc = {
  events?: Array<{ eventAction?: string; eventDate?: string }>;
  entities?: RdapEntity[];
  nameservers?: Array<{ ldhName?: string }>;
  status?: string[];
};

function isExpirationAction(action: string | undefined): boolean {
  if (!action) return false;
  return action.toLowerCase().trim().includes("expir");
}

export function daysLeftFrom(expiresAt: Date): number {
  return Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function rdapRegistrar(data: RdapDoc): string | null {
  const ent = data.entities?.find((e) => e.roles?.includes("registrar"));
  const fn = ent?.vcardArray?.[1]?.find((f) => f[0] === "fn")?.[3];
  return typeof fn === "string" && fn.trim() ? fn.trim().slice(0, 120) : null;
}

function eventDate(data: RdapDoc, test: (action: string) => boolean): Date | null {
  const raw = data.events?.find((e) => e.eventAction && test(e.eventAction.toLowerCase()))?.eventDate;
  return raw && !Number.isNaN(Date.parse(raw)) ? new Date(raw) : null;
}

/** Expiry plus registrar, dates, nameservers and status codes; null when there's no expiry. */
export function parseRdapDomain(data: RdapDoc): DomainResult | null {
  const expiresAt = eventDate(data, isExpirationAction);
  if (!expiresAt) return null;
  const nameservers = (data.nameservers ?? [])
    .map((n) => (typeof n.ldhName === "string" ? n.ldhName.toLowerCase().replace(/\.$/, "") : ""))
    .filter(Boolean)
    .slice(0, 13);
  const statuses = (Array.isArray(data.status) ? data.status : [])
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.slice(0, 60))
    .slice(0, 12);
  return {
    expiresAt,
    daysLeft: daysLeftFrom(expiresAt),
    error: null,
    registrar: rdapRegistrar(data),
    registeredAt: eventDate(data, (a) => a === "registration"),
    updatedAt: eventDate(data, (a) => a === "last changed"),
    nameservers,
    statuses,
  };
}
