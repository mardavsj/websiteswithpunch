/** Hostname rules for a site carried into signup (?site=): plain host, no scheme or path. */
const HOST = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function cleanSiteParam(raw: unknown): string | null {
  const v = (Array.isArray(raw) ? raw[0] : raw) as unknown;
  if (typeof v !== "string") return null;
  const host = v.trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#:]/)[0].replace(/\.$/, "");
  return HOST.test(host) ? host : null;
}

/** Signup link, with the checked site carried along when there is one. */
export function signupHref(site?: string | null) {
  const host = site ? cleanSiteParam(site) : null;
  return host ? `/signup?site=${encodeURIComponent(host)}` : "/signup";
}
