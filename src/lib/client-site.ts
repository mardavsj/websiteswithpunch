/**
 * Strip monitoring metrics for locked sites before sending to the client. The full SSL/domain
 * facts never ride along (the analytics Details panels load them from /api/sites/[id]/details).
 */
export function toClientSite<T extends Record<string, unknown>>(full: T): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sslInfo, domainInfo, ...site } = full;
  if (!(site as { locked?: boolean }).locked) return site as unknown as T;
  return {
    ...(site as unknown as T),
    status: "locked",
    lastCheckedAt: null,
    lastStatusCode: null,
    lastLatencyMs: null,
    sslExpiresAt: null,
    sslDaysLeft: null,
    domainExpiresAt: null,
    domainDaysLeft: null,
  };
}
