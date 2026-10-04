import type { ArticleSection, Faq } from "@/components/seo/types";

export const downChecker = {
  path: "/tools/website-down-checker",
  title: "Is My Website Down? Free Website Down Checker",
  description:
    "Is your website down for everyone or just you? Enter a URL to load it from our server and see the HTTP status code, response time and where redirects end up.",
  h1: "Is my website down?",
  intro:
    "Enter a website to load it from our server, not your device. You'll see whether it answered, the HTTP status code, how long it took and where any redirects ended up, so you know if it's down for everyone or just for you. Free, no signup.",
  sections: [
    {
      h: "Down for everyone, or just you?",
      p: [
        "This checker requests the site's homepage over HTTPS from our server, following up to five redirects, and records the status code and the total time to the final response. Because the request comes from a data centre rather than your phone or office network, it separates a real outage from a local problem.",
        "If we get a normal answer but the site won't open for you, the fault is almost certainly between you and the site: your Wi-Fi or mobile network, your DNS resolver, a VPN, a firewall, a browser extension or a cached old address. If we can't load it either, it's very likely down for other visitors too. A single location can't spot an outage that only affects one region or one network, so treat a green result as \"reachable from here\" rather than a worldwide guarantee.",
      ],
    },
    {
      h: "What the status codes mean",
      list: [
        "200 to 299: the server answered normally. 2xx and 3xx responses count as up.",
        "301, 302, 307, 308: a redirect. We follow it and report the final URL; a long chain of redirects slows every visit.",
        "401 or 403: the server is up but refused the request, often a firewall, bot protection or a password-protected staging site.",
        "404: the server is up but the page doesn't exist. Rare for a homepage, so check recent deployments or DNS pointing at the wrong server.",
        "500: the application crashed while building the page. Check your error logs.",
        "502 or 504: a proxy or CDN in front of your site couldn't get an answer from the origin server, which is usually down or overloaded.",
        "503: the server is overloaded or in maintenance mode.",
        "Unreachable: no HTTP answer at all. The message explains why, for example a DNS lookup failure, a refused connection, a timeout or a certificate error.",
      ],
    },
    {
      h: "What to do if your website is down",
      steps: [
        "Check DNS first. If the result says the DNS lookup failed, make sure the domain hasn't expired (try our domain expiry checker) and that its A, AAAA or CNAME records still point at your host.",
        "Check the certificate. An expired or mismatched SSL certificate makes browsers block the site even when the server is fine; our SSL checker shows it in seconds.",
        "Look at your host or CDN status and your server's resource usage. A full disk, exhausted memory or a hit bandwidth limit takes many small sites offline.",
        "Read the application error logs for 500s, and roll back the most recent deploy, plugin update or theme change if the problem started right after it.",
        "If you see 502 or 504 behind a CDN, restart or scale the origin server, then purge the CDN cache once it answers again.",
        "Run this check again after each fix. Results are cached for about a minute so a fresh check reflects the change quickly.",
      ],
    },
    {
      h: "Response time: how fast is fast enough?",
      p: [
        "The time shown covers DNS lookup, connecting, the TLS handshake, any redirects and the server's response for the homepage HTML. It doesn't include images, scripts or rendering, so it isn't a page-speed score. As a rule of thumb, a homepage that answers in under about 500 ms from the same continent feels quick, while several seconds usually means a slow server, a cold start or a heavy page being built on every request. Our server runs in Asia, so sites hosted far away will show some extra network time.",
      ],
    },
  ] satisfies ArticleSection[],
  faqs: [
    {
      q: "How do I check if a website is down?",
      a: "Type the address into the checker above and press Check website. We request it from our server and show whether it answered, the status code and the response time. If it loads here but not on your device, the problem is on your side of the connection.",
    },
    {
      q: "Why does a site work for me but show as down here, or the other way round?",
      a: "Your browser may be using a cached copy or an old DNS answer, or the site may block data-centre traffic with a firewall. Equally, a site can be fine from our server but blocked on your network by a VPN, ISP or office firewall.",
    },
    {
      q: "Do you check from multiple locations?",
      a: "No. The free checker and our monitoring both run from a single server location. That's enough to tell whether a site is reachable at all, but not to detect regional outages.",
    },
    {
      q: "Does the checker follow redirects?",
      a: "Yes, up to five. The Final URL row shows where the redirects ended up, which helps spot http to https or www mix-ups.",
    },
    {
      q: "Can I check a URL on my local network?",
      a: "No. For security, localhost, private IP ranges and internal hostnames are blocked, and every redirect is checked the same way.",
    },
    {
      q: "Can I get my site checked automatically?",
      a: "Yes. Websites With Punch checks every site you add once a day in the background. On a site's page you can recheck on demand or turn on auto refresh, which rechecks every 60 seconds while the page is open. We don't send alerts; status and history are on your dashboard.",
    },
  ] satisfies Faq[],
  cta: "Add the site and we check it every day, record the status and response time, and keep the history on your dashboard. Recheck on demand, or turn on auto refresh while you're fixing something. Free for one site, no card needed. (No alerts: you check the dashboard when it suits you.)",
};
