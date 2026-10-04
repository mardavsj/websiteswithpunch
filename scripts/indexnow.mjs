// Optional: tell Bing, Yandex, Seznam and other IndexNow engines that pages changed.
// Run after a deploy:  npm run indexnow            (all URLs in the live sitemap)
//                      npm run indexnow -- /tools/ssl-checker /uptime-monitoring
// Needs the key file public/<KEY>.txt to be live at the site root first. Google doesn't use
// IndexNow; use Search Console there. Uses Node 18+ fetch, no dependencies.
const SITE = process.env.INDEXNOW_SITE || "https://www.websiteswithpunch.com";
const KEY = "dfdb734c5bafbf0c7c766800ba810a97";

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const args = process.argv.slice(2);
const urlList = args.length ? args.map((p) => new URL(p, SITE).toString()) : await sitemapUrls();
const keyCheck = await fetch(`${SITE}/${KEY}.txt`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  console.error(`Key file ${SITE}/${KEY}.txt isn't live yet. Deploy first, then run this again.`);
  process.exit(1);
}
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
// 200 = accepted, 202 = accepted (key validation pending). 4xx explains what's wrong.
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
if (res.status >= 400) {
  console.error(await res.text());
  process.exit(1);
}
