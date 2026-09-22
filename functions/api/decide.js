/**
 * Approve or reject an application from the link in the notification email.
 * GET /api/decide?e=<email>&d=approve|reject&s=<hmac>
 *
 * Records the decision, tells the applicant, and on approve emails the
 * provisioning command back to you — the workspace itself is created on the
 * operator, deliberately not from a marketing-site Function.
 */
import { verify } from "../_lib/sign.js";
import { sendMail, shell, rows, esc } from "../_lib/mail.js";

const LABEL = {
  zones: { "1-10": "1–10", "11-25": "11–25", "26-100": "26–100", "100+": "100+" },
  traffic: { "<1M": "Under 1 million", "1-10M": "1–10 million", "10-100M": "10–100 million", "100M+": "100 million or more", unsure: "Not sure" },
};

function page(title, body, status = 200) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>${esc(title)}</title>` +
      `<body style="margin:0;background:#faf9f6;color:#16150f;font:300 16px/1.6 -apple-system,Segoe UI,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px">` +
      `<main style="max-width:46ch"><h1 style="font:300 2rem/1.1 Georgia,serif">${esc(title)}</h1><div style="margin-top:14px">${body}</div></main>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const email = (u.searchParams.get("e") || "").toLowerCase();
  const d = u.searchParams.get("d");
  const s = u.searchParams.get("s") || "";
  if (!["approve", "reject"].includes(d) || !email) return page("Not a valid link", "<p>This link is missing something.</p>", 400);
  if (!(await verify(env.DECISION_SECRET, email, d, s))) return page("Not a valid link", "<p>The signature doesn't match. If you copied this from an email, copy the whole link.</p>", 403);
  if (!env.DB) return page("Not available", "<p>No database bound.</p>", 503);

  const row = await env.DB.prepare("SELECT * FROM beta_applications WHERE email = ?1").bind(email).first();
  if (!row) return page("No such application", `<p>Nothing on file for <b>${esc(email)}</b>. It may have been deleted.</p>`, 404);
  if (row.status && row.status !== "new") {
    return page(`Already ${row.status}`, `<p><b>${esc(row.name)}</b> (${esc(email)}) was ${esc(row.status)} on ${new Date(row.decided).toLocaleString("en-GB")}. Nothing changed.</p>`);
  }

  const status = d === "approve" ? "approved" : "rejected";
  await env.DB.prepare("UPDATE beta_applications SET status = ?2, decided = ?3 WHERE email = ?1").bind(email, status, Date.now()).run();

  const site = env.SITE_URL || "https://zonesteward.com";
  const notify = env.NOTIFY_TO;

  // the applicant
  const toApplicant = status === "approved"
    ? sendMail(env, {
        to: email, replyTo: notify,
        subject: "You're in — Zonesteward beta",
        html: shell({
          eyebrow: "Zonesteward · private beta", title: `You're in, ${esc(row.name.split(" ")[0])}.`,
          body: `<p>Your application is approved. Your workspace is being set up now and a sign-in invitation will follow to this address, usually within a day.</p>
<p>Two things to have ready:</p>
<ul><li>A Cloudflare API token — the connection wizard will build the exact permissions link for you, and read-only is a fine place to start.</li>
<li>An Anthropic API key, from console.anthropic.com.</li></ul>
<p>Reply to this email with anything at all. In the beta you're talking to the person who wrote it.</p>`,
          foot: `Getting started: <a href="${site}/docs" style="color:#c2410c">${site}/docs</a>`,
        }),
        text: `You're in. Your Zonesteward workspace is being set up; a sign-in invitation will follow to this address. Have a Cloudflare API token and an Anthropic API key ready. Docs: ${site}/docs`,
      })
    : sendMail(env, {
        to: email, replyTo: notify,
        subject: "Your Zonesteward beta application",
        html: shell({
          eyebrow: "Zonesteward · private beta", title: `Not this round, ${esc(row.name.split(" ")[0])}.`,
          body: `<p>Thank you for applying. We're keeping the beta very small and choosing for fit with what we can support well right now, and yours isn't a fit for this round.</p>
<p>That's about the round, not about you. We'll write again when seats open, and if your situation changes — more zones, a different setup — reply here and say so.</p>`,
        }),
        text: `Thank you for applying to the Zonesteward beta. We're keeping it very small this round and yours isn't a fit right now. We'll write again when seats open.`,
      });

  // you, with the command to run on approve
  const ident = (row.company || row.email.split("@")[1]).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "workspace";
  const toYou = notify
    ? sendMail(env, {
        to: notify,
        subject: `${status === "approved" ? "Approved" : "Rejected"}: ${row.name} · ${row.company || email}`,
        html: shell({
          eyebrow: `Application ${status}`, title: `${esc(row.name)} — ${status}`,
          body: rows([["Email", email], ["Company", row.company], ["Zones", LABEL.zones[row.zones] || row.zones], ["Monthly requests", LABEL.traffic[row.traffic] || row.traffic]]) +
            (status === "approved"
              ? `<p style="margin-top:22px">The applicant has been told a workspace and invitation are coming. Provision it on the operator:</p>
<pre style="background:#0d0d0f;color:#e8e8ea;padding:16px 18px;border-radius:3px;font:13px/1.6 ui-monospace,Menlo,monospace;overflow:auto">cfop tenant create ${esc(ident)} --name "${esc(row.company || row.name)}" --owner ${esc(email)}
cfop magic-link ${esc(ident)} ${esc(email)}</pre>`
              : `<p style="margin-top:22px">The applicant has been sent a kind no.</p>`),
        }),
        text: `${row.name} ${status}. ${status === "approved" ? `Provision: cfop tenant create ${ident} --name "${row.company || row.name}" --owner ${email}` : ""}`,
      })
    : Promise.resolve({ sent: false });

  const [a, y] = await Promise.all([toApplicant, toYou]);
  const mailNote = a.sent ? "The applicant has been emailed." : `Applicant email not sent (${esc(a.error || "mail not configured")}).`;
  return page(
    status === "approved" ? `Approved ${row.name}` : `Rejected ${row.name}`,
    `<p>${mailNote}${y.sent ? " Details and the provisioning command are in your inbox." : ""}</p>
     <p style="margin-top:18px"><a href="${site}" style="color:#c2410c">Back to zonesteward.com</a></p>`
  );
}
