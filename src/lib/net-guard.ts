import dns from "node:dns";
import net from "node:net";

/**
 * SSRF guard for every outbound request to a user-supplied host (uptime, SSL, redirects).
 * Only public unicast addresses are allowed; the check runs inside the socket's DNS lookup, so
 * the address we validate is the address we connect to (no DNS-rebinding gap).
 */

export class BlockedTargetError extends Error {
  code = "BLOCKED_TARGET";
  constructor(message = "Blocked: private or reserved address") {
    super(message);
    this.name = "BlockedTargetError";
  }
}

/** Ports a monitored site may use (default http/https plus the common alternates). */
export const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

// [first address, prefix length] for IPv4 ranges that must never be fetched.
const V4_BLOCKS: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local incl. 169.254.169.254 metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;
}

function isBlockedV4(ip: string): boolean {
  const n = v4ToInt(ip);
  return V4_BLOCKS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (v4ToInt(base) & mask);
  });
}

/** Expand an IPv6 address to 8 numeric groups. */
function v6Groups(ip: string): number[] | null {
  let s = ip.toLowerCase().split("%")[0];
  // Embedded IPv4 tail (::ffff:1.2.3.4)
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = v4ToInt(v4[1]);
    s = s.slice(0, -v4[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [head, tail] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined ? (tail ? tail.split(":") : []) : [];
  const fill = s.includes("::") ? 8 - h.length - t.length : 0;
  const all = [...h, ...Array(Math.max(0, fill)).fill("0"), ...t].map((g) => parseInt(g || "0", 16));
  return all.length === 8 && all.every((g) => g >= 0 && g <= 0xffff) ? all : null;
}

function isBlockedV6(ip: string): boolean {
  const g = v6Groups(ip);
  if (!g) return true;
  if (g.every((x) => x === 0)) return true; // :: unspecified
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1 loopback
  // IPv4-mapped / -compatible / NAT64 (64:ff9b::/96): judge the embedded IPv4 address.
  const mapped = g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0);
  const nat64 = g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0);
  if (mapped || nat64) {
    return isBlockedV4(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`);
  }
  const first = g[0];
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (first === 0x2001 && g[1] === 0x0db8) return true; // documentation
  if (first === 0x2002) return true; // 6to4 (can embed private IPv4)
  if (first === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return true; // discard-only
  return (first & 0xe000) !== 0x2000; // anything outside global unicast 2000::/3
}

/** True for any address we must not connect to. Non-IP input counts as blocked. */
export function isBlockedIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return isBlockedV4(ip);
  if (kind === 6) return isBlockedV6(ip);
  return true;
}

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void;

/**
 * Drop-in `lookup` for http/https/tls: resolves the host and refuses if ANY returned address is
 * private or reserved (a mixed answer is treated as hostile).
 */
export function guardedLookup(hostname: string, options: dns.LookupOptions, cb: LookupCb): void {
  dns.lookup(hostname, { ...options, all: true, verbatim: true }, (err, addresses) => {
    if (err) return cb(err, "", 4);
    const list = addresses as dns.LookupAddress[];
    if (!list.length) return cb(Object.assign(new Error("No address"), { code: "ENOTFOUND" }), "", 4);
    if (list.some((a) => isBlockedIp(a.address))) return cb(new BlockedTargetError(), "", 4);
    if (options.all) return cb(null, list);
    cb(null, list[0].address, list[0].family);
  });
}

/** Resolve a host and throw BlockedTargetError if it points anywhere private. */
export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new BlockedTargetError();
    return;
  }
  const list = await dns.promises.lookup(host, { all: true, verbatim: true });
  if (list.some((a) => isBlockedIp(a.address))) throw new BlockedTargetError();
}

/** Validate a URL before any request: scheme, credentials, port and literal-IP hosts. */
export function assertSafeUrl(raw: string | URL): URL {
  const u = typeof raw === "string" ? new URL(raw) : raw;
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new BlockedTargetError("Blocked: only http and https are allowed");
  }
  if (u.username || u.password) throw new BlockedTargetError("Blocked: credentials in URL");
  const port = u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80;
  if (!ALLOWED_PORTS.has(port)) throw new BlockedTargetError(`Blocked: port ${port} is not allowed`);
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost")) throw new BlockedTargetError();
  if (net.isIP(host) && isBlockedIp(host)) throw new BlockedTargetError();
  return u;
}
