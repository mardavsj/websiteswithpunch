/**
 * How and where checks run, for the Uptime Details panel. Keep in step with vercel.json
 * ("regions" and the /api/cron/check schedule) and the recheck/auto-update limits.
 */
export const CHECK_SCHEDULE = {
  daily: "Once a day, around 06:00 IST (automatic background check)",
  manual: "Recheck on demand, at most once a minute",
  auto: "Auto update: every 60 seconds while the site page is open",
  location: "Singapore (one location)",
} as const;
