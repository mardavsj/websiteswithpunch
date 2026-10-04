/** Public site facts shared by metadata, robots, sitemap, manifest and JSON-LD. */
export const SITE_URL = "https://www.websiteswithpunch.com";
export const SITE_NAME = "Websites With Punch";
export const PRODUCT_NAME = "Website Health";
export const TAGLINE = "Spot website problems before your customers do.";
export const SITE_DESCRIPTION =
  "Monitor uptime, latency, SSL certificate expiry and domain expiry for your websites in one calm dashboard. Free for one site; Pro and Business plans for more.";
/** Browser UI colour: the page background in each theme. */
export const THEME_LIGHT = "#f6f5f2";
export const THEME_DARK = "#2f3237";
/** Search engines should not index signed-in or one-off pages. */
export const NO_INDEX = { index: false, follow: false } as const;
