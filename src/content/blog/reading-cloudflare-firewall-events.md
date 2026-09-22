---
title: "Reading Cloudflare firewall events: who is actually attacking you"
description: "Most of what the firewall log shows you isn't an attack. How to tell a credential scanner from a theme loading its own CSS, and why getting the 'not an attack' half right matters more."
date: 2026-09-22
minutes: 8
---

Open the Security Events tab on any zone with a WordPress site behind it and
you'll see thousands of rows. Blocked, challenged, allowed, from everywhere.
The natural reading is "we're under constant attack." The accurate reading is
"a small number of sources are attacking us, and the rest is the internet
being the internet." Telling them apart is the whole skill.

## What an attack actually looks like

Attack traffic has a **shape**, and it's the shape you should look for, not the
volume. Nine patterns cover nearly everything an agency's fleet will see:

1. **WordPress brute force** — `POST /wp-login.php`, `POST /xmlrpc.php`, over
   and over, from one source, mostly 401s and 403s.
2. **CMS and plugin probing** — `GET /wp-content/plugins/<hundreds of names>/readme.txt`.
   Looking for a version with a known hole.
3. **Secrets and config scanning** — `/.env`, `/.git/config`, `/wp-config.php.bak`,
   `/.aws/credentials`, `/config.json`. Trying to steal keys you left in the
   web root.
4. **Admin panel probing** — `/admin`, `/phpmyadmin`, `/administrator`, `/manager/html`.
5. **Path traversal** — `../../etc/passwd` encoded a dozen ways.
6. **Injection** — `' OR 1=1`, `<script>`, `UNION SELECT` in query strings.
7. **Shell and upload probes** — `/shell.php`, `/c99.php`, `/uploads/x.php`.
8. **Credential stuffing** — `POST /wp-json/jwt-auth/v1/token`, API logins at
   volume.
9. **Scanner tooling** — a user agent that says `Nuclei`, `sqlmap`, `masscan`,
   or a Go http client hitting forty paths in a second.

Notice what's common: **breadth of paths that don't exist, from one source,
mostly rejected.** That's the signature. One IP asking for 39 distinct files
that were never there, 100% of them 404 or blocked, is an attacker regardless
of volume. One IP making 40,000 requests for files that exist and were served
is a client.

## What isn't an attack, and gets called one anyway

This is the half that matters, because false positives are what make people
stop reading the log.

**A theme fetching its own assets.** `/wp-content/themes/foo/style.css` from a
thousand IPs is a website working. A naïve rule that says "many requests under
`/wp-content/` = plugin probe" will flag your busiest client on their best
day.

**Uploaded media.** `/wp-content/uploads/2026/09/hero.jpg` served 200, ten
thousand times. Not a probe. It's the hero image.

**`/cdn-cgi/`.** Cloudflare's own endpoints — challenge pages, RUM beacons,
email obfuscation. Traffic there is Cloudflare talking to itself.

**Well-known files.** `/robots.txt`, `/sitemap.xml`, `/favicon.ico`,
`/.well-known/*`. Every crawler on Earth asks for these. It's polite.

**Recognised crawlers**, including the AI ones. Googlebot, Bingbot, GPTBot,
ClaudeBot, PerplexityBot. You may want to *block* some of them — that's a
business decision — but a crawler fetching pages that exist is not an attack,
and calling it one buries the real attackers under thousands of rows.

**Internet-research scanners.** Censys, Shodan, BinaryEdge and friends fetch a
handful of paths from every host on the internet, all the time, and publish
what they find. Annoying. Not targeting you.

**Anything that was requested and served.** The single most useful filter. If
everything a source asked for existed and got a 200, it isn't probing. It's
using the site.

The rule that ties it together: **a genuine attack path overrides every
exclusion.** A source that fetched `/style.css` a hundred times *and*
`/.env` once is an attacker — the one request tells you more than the
hundred.

## Turning this into a score

Volume alone is a bad score. A busy legitimate client outscores a careful
attacker every time. What works is a composite:

- **Category share** — what fraction of requests match an attack pattern.
- **Served ratio** — how much was actually 200. Low is worse.
- **Breadth** — distinct attack paths. Fifty is a scanner; two is curiosity.
- **Intensity** — requests per minute at peak.
- **Scanner signature** — a known tool in the user agent is near-conclusive.

Weight those into 0–100, and the attackers float to the top with a verdict you
can act on: *"Scanning for exposed credential and config files — 39 distinct
paths — 100% rejected."* Below them, list every source you *cleared* and say
why — "recognised crawler", "all requests served" — so nobody wonders whether
the filter is hiding something.

## Then look across zones

The last step is the one the dashboard can't do. Take the top attacker on one
zone and ask: **is this source hitting my other zones?** A credential scanner
working through your whole client list is a fleet problem, and the fix — a
challenge rule fanned across every zone — is a fleet action. Finding that in
forty separate Security Events tabs is not realistic. Finding it in one
question is the reason Zonesteward exists.

If you do one thing after reading this: stop sorting the firewall log by
count. Sort by *breadth of paths that don't exist*. That's where the attackers
are.
