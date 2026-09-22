/**
 * The last 24 hours of this zone's traffic, by colo, as relative intensity.
 *
 * Deliberately never returns absolute request counts: the hero would otherwise
 * publish exact traffic volume to anyone who opens dev tools. Weights are
 * normalised against the busiest colo in the window, which is all the globe
 * needs to size a dot.
 */
export async function onRequestGet({ env }) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    // Cache hard at the edge: every visitor hits this, the underlying numbers
    // move slowly, and D1 has a daily read budget worth respecting.
    "cache-control": "public, max-age=30, s-maxage=120",
  };

  try {
    if (!env.DB) return new Response(JSON.stringify({ colos: {} }), { headers });

    const since = Math.floor(Date.now() / 3600000) - 24;
    const { results } = await env.DB.prepare(
      "SELECT colo, SUM(n) AS n FROM hits WHERE bucket >= ?1 " +
        "GROUP BY colo ORDER BY n DESC LIMIT 40"
    ).bind(since).all();

    const rows = results || [];
    const peak = rows.reduce((m, r) => Math.max(m, r.n), 0);
    const colos = {};
    for (const r of rows) colos[r.colo] = Math.max(0.06, r.n / peak);

    return new Response(
      JSON.stringify({ window: "24h", updated: "just now", colos }),
      { headers }
    );
  } catch {
    // An empty object means "no live data"; the page keeps its baked snapshot.
    return new Response(JSON.stringify({ colos: {} }), { headers });
  }
}
