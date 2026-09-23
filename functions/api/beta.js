/**
 * Beta applications.
 *
 * Works without JavaScript: a plain form post gets a real HTML confirmation
 * back. The page enhances it with fetch when JS is available, but the form is
 * not dependent on it — a signup is the one thing on this site that must never
 * be lost to a script that failed to load.
 */
import { sign } from "../_lib/sign.js";
import { sendMail, shell, rows, button } from "../_lib/mail.js";

const ZONES = new Set(["1-10", "11-25", "26-100", "100+"]);
const TRAFFIC = new Set(["<1M", "1-10M", "10-100M", "100M+", "unsure"]);
const PLANS = new Set(["free", "pro", "business", "enterprise"]);
const FOCUS = new Set(["security", "dns", "performance", "investigation", "reporting"]);
const ROLE = new Set(["me", "team", "ops", "client"]);
const KEY = new Set(["yes", "not yet", "what is that"]);

/* Labels for the no-JS receipt. The JS path reads them off the form itself. */
const LABEL = {
  zones: { "1-10": "1–10", "11-25": "11–25", "26-100": "26–100", "100+": "100+" },
  traffic: { "<1M": "Under 1 million", "1-10M": "1–10 million", "10-100M": "10–100 million", "100M+": "100 million or more", unsure: "Not sure" },
  plans: { free: "Free", pro: "Pro", business: "Business", enterprise: "Enterprise" },
  focus: { security: "WAF, firewall, bots", dns: "DNS", performance: "Cache & performance", investigation: "Analytics & incident digging", reporting: "Client reporting" },
  role: { me: "I do, on my own", team: "A small team at my company", ops: "A dedicated ops person", client: "Each client manages their own" },
  anthropic: { yes: "Yes", "not yet": "Not yet, but I can get one", "what is that": "No idea what that is" },
};
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const label = (k, v) => (v || "").split(",").filter(Boolean).map((x) => LABEL[k][x] || x).join(", ");

function receiptPage(row) {
  const when = new Date(row.created).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const rows = [
    ["Name", row.name], ["Email", row.email], ["Company", row.company], ["Website", row.site],
    ["Zones", label("zones", row.zones)], ["Monthly requests", label("traffic", row.traffic)],
    ["Plans", label("plans", row.plans)], ["Time goes on", label("focus", row.focus)],
    ["Managed by", label("role", row.role)], ["Anthropic key", label("anthropic", row.anthropic)],
  ].filter(([, v]) => v);
  const dl = rows.map(([k, v]) => `<div class="rr"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("") +
    (row.today ? `<div class="rr long"><dt>What goes wrong</dt><dd>${esc(row.today)}</dd></div>` : "") +
    (row.agreed ? `<div class="rr"><dt>The beta trade</dt><dd>Agreed — monthly questions, two calls, honest feedback</dd></div>` : "");
  return new Response(
`<!doctype html><html lang="en"><meta charset="utf-8"><title>You’re on the list — Zonesteward</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&family=Geist:wght@300;400;500&family=Geist+Mono:wght@400&display=swap" rel="stylesheet">
<style>
:root{--paper:#faf9f6;--paper-2:#f3f1ec;--ink:#16150f;--ink-2:#3d3b33;--muted:#6f6c60;--rule:#ddd9cf;--accent:#c2410c}
*{box-sizing:border-box;margin:0}body{background:var(--paper);color:var(--ink);font:300 16px/1.6 Geist,system-ui,sans-serif;padding:48px 24px 80px}
main{max-width:640px;margin:0 auto}.sc{font:400 11px/1 "Geist Mono",monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
h1{font:300 clamp(2.2rem,6vw,3.4rem)/1.02 Newsreader,Georgia,serif;letter-spacing:-.025em;margin-top:14px}
h1::after{content:"";display:block;width:56px;height:2px;background:var(--accent);margin-top:22px}
.lede{margin-top:20px;color:var(--ink-2);max-width:52ch}dl{margin-top:34px;border-top:1px solid var(--ink)}
.rr{display:grid;grid-template-columns:150px 1fr;gap:18px;padding:13px 0;border-bottom:1px solid var(--rule)}
@media(max-width:560px){.rr{grid-template-columns:1fr;gap:4px}}
dt{font:400 10.5px/1 "Geist Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-top:4px}
dd{font-size:15.5px;overflow-wrap:anywhere}.long dd{font:300 1.12rem/1.55 Newsreader,serif;color:var(--ink-2);white-space:pre-line}
.next{margin-top:36px;background:var(--paper-2);border-left:2px solid var(--accent);padding:18px 22px 20px}
.next ol{margin:10px 0 0 1.2em;display:grid;gap:8px;font-size:15px;color:var(--ink-2)}.next b{color:var(--ink);font-weight:500}
.foot{margin-top:26px;font-size:14px;color:var(--muted)}a{color:var(--accent)}
.btn{display:inline-block;margin-top:26px;padding:10px 18px;background:var(--ink);color:var(--paper);text-decoration:none;font-weight:500;font-size:14px;border-radius:2px}
</style><body><main>
<span class="sc">Application received · ${esc(when)}</span>
<h1>You’re on the list.</h1>
<p class="lede">Here’s what you told us. We read every one of these ourselves, usually within a few days.</p>
<dl>${dl}</dl>
<div class="next"><span class="sc">What happens next</span><ol>
<li>We read it. A person, not a filter.</li>
<li>If it’s a fit, an invitation lands at <b>${esc(row.email)}</b> with your workspace ready.</li>
<li>If it isn’t yet, we’ll say so, and why.</li></ol></div>
<p class="foot">Need to change something? Write to <a href="mailto:hello@zonesteward.com">hello@zonesteward.com</a>.</p>
<a class="btn" href="/">Back to zonesteward.com</a>
</main></html>`, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

/* checkbox groups arrive as repeated keys; keep only known values, joined */
const multi = (form, key, allowed) =>
  [...new Set(form.getAll(key).map((v) => clean(v, 30)).filter((v) => allowed.has(v)))].join(",");
const oneOf = (v, allowed) => (allowed.has(v) ? v : "");

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
/* Deliberately loose. Rejecting odd-but-valid addresses loses real applicants,
   and the address gets verified by us actually emailing it. */
const emailish = (v) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v);

function page(title, body, status) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<body style="font:300 17px/1.6 ui-sans-serif,system-ui;background:#faf9f6;color:#16150f;` +
      `display:grid;place-items:center;min-height:100vh;margin:0;padding:24px">` +
      `<main style="max-width:44ch"><h1 style="font:300 2rem/1.1 Georgia,serif">${title}</h1>` +
      `<p>${body}</p><p><a href="/" style="color:#c2410c">Back to zonesteward.com</a></p></main>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const fail = (msg, code) =>
    wantsJson
      ? Response.json({ ok: false, error: msg }, { status: code })
      : page("That didn't go through", msg, code);

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("We couldn't read that submission.", 400);
  }

  // Honeypot: a real person never fills a field they cannot see. Answer 200 so
  // a bot has no signal that it was caught.
  if (clean(form.get("company_url"), 200)) {
    return wantsJson ? Response.json({ ok: true }) : page("Thanks", "We'll be in touch.", 200);
  }

  const name = clean(form.get("name"), 120);
  const email = clean(form.get("email"), 200).toLowerCase();
  const zones = clean(form.get("zones"), 20);

  if (!name) return fail("Please give us a name to use.", 400);
  if (!emailish(email)) return fail("That email address doesn't look right.", 400);
  if (!ZONES.has(zones)) return fail("Please tell us roughly how many zones you run.", 400);
  const traffic = clean(form.get("traffic"), 20);
  if (!TRAFFIC.has(traffic)) return fail("Please give us a rough sense of traffic — 'not sure' is fine.", 400);

  const anthropic = clean(form.get("anthropic"), 20);
  if (clean(form.get("agreed"), 5) !== "yes") {
    return fail("Please confirm you've read what the beta involves — the checkbox at the end.", 400);
  }
  const row = {
    email,
    created: Date.now(),
    name,
    company: clean(form.get("company"), 160),
    site: clean(form.get("site"), 200),
    zones,
    traffic,
    plans: multi(form, "plans", PLANS),
    focus: multi(form, "focus", FOCUS),
    role: oneOf(clean(form.get("role"), 20), ROLE),
    today: clean(form.get("today"), 1200),
    anthropic: KEY.has(anthropic) ? anthropic : "",
    agreed: 1,
    colo: (request.cf && request.cf.colo) || "",
    country: (request.cf && request.cf.country) || "",
  };

  if (!env.DB) return fail("Applications aren't open yet. Try again shortly.", 503);

  try {
    await env.DB.prepare(
      "INSERT INTO beta_applications " +
        "(email, created, name, company, site, zones, traffic, plans, focus, role, today, anthropic, colo, country, agreed) " +
        "VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15) " +
        "ON CONFLICT (email) DO UPDATE SET created=?2, name=?3, company=?4, site=?5, zones=?6, " +
        "traffic=?7, plans=?8, focus=?9, role=?10, today=?11, anthropic=?12, agreed=?15"
    ).bind(row.email, row.created, row.name, row.company, row.site, row.zones, row.traffic, row.plans,
           row.focus, row.role, row.today, row.anthropic, row.colo, row.country, row.agreed).run();
  } catch {
    return fail("Something broke on our side. Try again, or email us.", 500);
  }

  // Notify after responding: the applicant never waits on Resend, and a mail
  // failure never turns a saved application into an error.
  waitUntil(notify(env, row).catch(() => {}));

  return wantsJson ? Response.json({ ok: true }) : receiptPage(row);
}

async function notify(env, row) {
  const site = env.SITE_URL || "https://zonesteward.com";
  const pairs = [
    ["Name", row.name], ["Email", row.email], ["Company", row.company], ["Website", row.site],
    ["Zones", label("zones", row.zones)], ["Monthly requests", label("traffic", row.traffic)],
    ["Plans", label("plans", row.plans)], ["Time goes on", label("focus", row.focus)],
    ["Managed by", label("role", row.role)], ["Anthropic key", label("anthropic", row.anthropic)],
    ["Beta trade", row.agreed ? "Agreed" : "NOT agreed"],
    ["What goes wrong", row.today], ["From", [row.colo, row.country].filter(Boolean).join(" · ")],
  ];
  const jobs = [];

  if (env.NOTIFY_TO && env.DECISION_SECRET) {
    const [ok, no] = await Promise.all([sign(env.DECISION_SECRET, row.email, "approve"), sign(env.DECISION_SECRET, row.email, "reject")]);
    const link = (d, s) => `${site}/api/decide?e=${encodeURIComponent(row.email)}&d=${d}&s=${s}`;
    jobs.push(sendMail(env, {
      to: env.NOTIFY_TO, replyTo: row.email,
      subject: `Beta application: ${row.name} · ${row.company || row.email} · ${label("zones", row.zones)} zones`,
      html: shell({
        eyebrow: "New beta application", title: `${esc(row.name)}${row.company ? `, ${esc(row.company)}` : ""}`,
        body: rows(pairs) +
          `<p style="margin:26px 0 0">${button(link("approve", ok), "Approve →")} &nbsp; ${button(link("reject", no), "Reject", false)}</p>
<p style="margin-top:14px;font-size:13px;color:#6f6c60">Approve emails them that a workspace is coming and sends you the provisioning command. Reject sends a kind no. Either link works once.</p>`,
      }),
      text: pairs.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nApprove: ${link("approve", ok)}\nReject: ${link("reject", no)}`,
    }));
  }

  jobs.push(sendMail(env, {
    to: row.email, replyTo: env.NOTIFY_TO,
    subject: "We have your Zonesteward beta application",
    html: shell({
      eyebrow: "Application received", title: "You're on the list.",
      body: `<p>Here's what you told us. We read every one of these ourselves, usually within a few days, and you'll hear back either way at this address.</p>` + rows(pairs.slice(0, 11)),
      foot: `Need to change something? Just reply to this email.`,
    }),
    text: "We have your Zonesteward beta application. We read every one ourselves and you'll hear back either way.\n\n" + pairs.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n"),
  }));

  await Promise.all(jobs);
}
