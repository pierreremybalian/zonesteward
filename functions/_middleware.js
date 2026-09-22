/**
 * Record which Cloudflare colo served this page view.
 *
 * `request.cf.colo` is the three-letter IATA code of the data centre that
 * handled the request, and the Workers docs list it under "All plans" — which
 * is the whole reason the globe does not need the Analytics API. Free zones are
 * refused `coloCode` on httpRequestsAdaptiveGroups, and refused it as a
 * top-level error that fails the entire query, so the analytics route would
 * have forced a paid plan. This does not.
 *
 * Counting happens after the response is handed back, and a failure here is
 * swallowed: a marketing page must never fall over because a counter did.
 */
const BOT = /bot|crawl|spider|slurp|curl|wget|headless|preview|monitor|probe|scan|fetch|python-requests|okhttp|axios/i;

export async function onRequest(context) {
  const { request, env, next, waitUntil } = context;
  const response = await next();

  try {
    if (!env.DB) return response;
    if (request.method !== "GET") return response;

    // Page views only. Assets and the globe's own polling are not visits.
    const dest = request.headers.get("sec-fetch-dest");
    const accept = request.headers.get("accept") || "";
    const isDocument = dest ? dest === "document" : accept.includes("text/html");
    if (!isDocument) return response;

    if (BOT.test(request.headers.get("user-agent") || "")) return response;

    const colo = request.cf && request.cf.colo;
    if (!colo || !/^[A-Z]{3}$/.test(colo)) return response;

    const bucket = Math.floor(Date.now() / 3600000);
    waitUntil(
      env.DB.prepare(
        "INSERT INTO hits (colo, bucket, n) VALUES (?1, ?2, 1) " +
          "ON CONFLICT (colo, bucket) DO UPDATE SET n = n + 1"
      ).bind(colo, bucket).run().catch(() => {})
    );
  } catch {
    /* never let instrumentation break the page */
  }

  return response;
}
