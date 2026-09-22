/**
 * Beta applications.
 *
 * Works without JavaScript: a plain form post gets a real HTML confirmation
 * back. The page enhances it with fetch when JS is available, but the form is
 * not dependent on it — a signup is the one thing on this site that must never
 * be lost to a script that failed to load.
 */
const ZONES = new Set(["1-10", "11-25", "26-100", "100+"]);
const KEY = new Set(["yes", "not yet", "what is that"]);

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
  const { request, env } = context;
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

  const anthropic = clean(form.get("anthropic"), 20);
  const row = {
    email,
    created: Date.now(),
    name,
    company: clean(form.get("company"), 160),
    site: clean(form.get("site"), 200),
    zones,
    today: clean(form.get("today"), 1200),
    anthropic: KEY.has(anthropic) ? anthropic : "",
    colo: (request.cf && request.cf.colo) || "",
    country: (request.cf && request.cf.country) || "",
  };

  if (!env.DB) return fail("Applications aren't open yet. Try again shortly.", 503);

  try {
    await env.DB.prepare(
      "INSERT INTO beta_applications (email, created, name, company, site, zones, today, anthropic, colo, country) " +
        "VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10) " +
        "ON CONFLICT (email) DO UPDATE SET created=?2, name=?3, company=?4, site=?5, zones=?6, today=?7, anthropic=?8"
    ).bind(row.email, row.created, row.name, row.company, row.site, row.zones, row.today, row.anthropic, row.colo, row.country).run();
  } catch {
    return fail("Something broke on our side. Try again, or email us.", 500);
  }

  return wantsJson
    ? Response.json({ ok: true })
    : page("You're on the list", "We read every one of these. If it's a fit you'll hear from us with a workspace.", 200);
}
