/**
 * Parse a fetch reply that should be JSON. A timeout page or proxy error (HTML) gives a
 * friendly `error` instead of throwing, so buttons never fail silently.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same shape as res.json() (any)
export async function readJson<T extends object = any>(res: Response): Promise<T & { error?: string }> {
  const data = await res.json().catch(() => null);
  if (data && typeof data === "object") return data as T;
  return (res.ok
    ? {}
    : { error: res.status >= 500 ? "Something went wrong on our side. Please try again in a moment." : "That didn't work. Please refresh and try again." }) as T;
}
