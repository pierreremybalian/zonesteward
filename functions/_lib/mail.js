/**
 * Send through Resend. Returns { sent, id?, error? } and never throws: a
 * notification failing must not fail the request that triggered it.
 * With no RESEND_API_KEY bound (local dev, tests) it reports sent:false.
 */
export async function sendMail(env, { to, subject, html, text, replyTo }) {
  if (!env.RESEND_API_KEY) return { sent: false, error: "no RESEND_API_KEY" };
  const from = env.MAIL_FROM || "Zonesteward <beta@zonesteward.com>";
  try {
    const r = await (env.__fetch || fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html, text, reply_to: replyTo }),
    });
    const body = await r.json().catch(() => ({}));
    return r.ok ? { sent: true, id: body.id } : { sent: false, error: body.message || `resend ${r.status}` };
  } catch (e) {
    return { sent: false, error: String(e && e.message || e) };
  }
}

export const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* One shell for every email: paper background, Newsreader heading, mono
   eyebrow. Inline styles because that is what mail clients honour. */
export function shell({ eyebrow, title, body, foot }) {
  return `<!doctype html><html><body style="margin:0;background:#faf9f6;padding:32px 16px;font:300 16px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16150f">
<div style="max-width:600px;margin:0 auto">
  <div style="padding-bottom:16px;margin-bottom:28px;border-bottom:1px solid #16150f">
    <a href="https://zonesteward.com" style="text-decoration:none;display:inline-block"><img src="https://zonesteward.com/brand/zonesteward-wordmark@2x.png" width="180" height="35" alt="Zonesteward" style="display:block;width:180px;height:35px;border:0"></a>
  </div>
  <div style="font:400 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#6f6c60">${esc(eyebrow)}</div>
  <h1 style="font:300 30px/1.1 Georgia,'Times New Roman',serif;letter-spacing:-.02em;margin:14px 0 0">${title}</h1>
  <div style="width:48px;height:2px;background:#c2410c;margin:20px 0 24px"></div>
  ${body}
  ${foot ? `<p style="margin-top:32px;font-size:13px;color:#6f6c60">${foot}</p>` : ""}
  <p style="margin-top:28px;font:400 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#a39f92">Zonesteward · zonesteward.com</p>
</div></body></html>`;
}

export function rows(pairs) {
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;border-top:1px solid #16150f">${pairs
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:11px 14px 11px 0;border-bottom:1px solid #ddd9cf;font:400 10.5px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#6f6c60;vertical-align:top;width:150px">${esc(k)}</td><td style="padding:11px 0;border-bottom:1px solid #ddd9cf;font-size:15px;vertical-align:top;white-space:pre-line">${esc(v)}</td></tr>`)
    .join("")}</table>`;
}

export function button(href, label, solid = true) {
  return `<a href="${esc(href)}" style="display:inline-block;padding:11px 18px;border-radius:2px;font-weight:500;font-size:14px;text-decoration:none;${solid ? "background:#16150f;color:#faf9f6" : "border:1px solid #c7c2b4;color:#16150f"}">${esc(label)}</a>`;
}
