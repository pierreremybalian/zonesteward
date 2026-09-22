# Zonesteward

Marketing site for Zonesteward — Cloudflare fleet operations for agencies.

## Layout

```
styleframes/    design exploration, self-contained HTML, no build step
  index.html      launcher with notes on every direction
  b1r-stage.html  THE CHOSEN DIRECTION
  shared/         the foundation the real build starts from
```

Open any styleframe straight off disk; there is no server and no build. The
only network dependency is Google Fonts.

## The chosen direction: B1R "Stage"

Two rounds got here. Round one offered Instrument (dark, product-forward),
Ledger (light, editorial) and Console (light shell, dark terminals). Ledger won
on typography and palette, Instrument on layout. Round two put Ledger's voice
on three different sets of bones — Anchored, Broadsheet and Plates — and B1R is
Anchored with the globe pulled out of the hero and given a stage of its own.

Rules the design holds to, and the build should keep holding to:

- **No invented metrics.** No "trusted by 10,000 teams", no fake customer logos,
  no uptime figure nobody measured. The product is pre-beta and the site reads
  as pre-beta on purpose.
- **No stock photography, no generic AI illustration.** Every visual is either
  real product UI or typography.
- **One dark band in the document**, at the gate. An earlier variant alternated
  light and dark all the way down and read as zebra stripes.
- **AA contrast throughout**, one `<h1>`, real focus states, and everything that
  moves respects `prefers-reduced-motion`.

## shared/

| file | what it is |
|---|---|
| `ledger.css` | tokens, type scale and components. Every variant links it, so choosing a variant chose a stylesheet. |
| `globe.js` | 157 real Cloudflare PoP coordinates and a static orthographic projection, lifted from the launch film. |
| `globe-live.js` | the rotating canvas globe: stippled land, the PoP mesh, live colos, and arcs running colo to origin. |
| `land.js` | Natural Earth 110m coastline plus a 144×72 land bitmask, baked in. |

### Two traps in here, both already paid for

**`globe.js` and `globe-live.js` share a global namespace.** Both wanted
`project` and `d2r` at the top level. Two classic scripts re-declaring the same
`const` is a `SyntaxError` that silently kills the whole second file, so
`globe-live.js` is wrapped in an IIFE and publishes one name on `window`. Keep
that in mind when a bundler starts touching these.

**Do not simplify the coastline with Ramer–Douglas–Peucker.** RDP measures each
point against the chord between the first and last point of the run; on a
closed ring those are the same point, the chord has zero length, every distance
measures zero and the entire ring collapses to two points. 124 of the 130 arcs
in this dataset are closed rings. The first attempt deleted the Americas and
left Eurasia intact, which reads as flickering rather than as a bug.
`land.js` is decimated by distance along the ring instead.

## The live globe

The stage globe is fed by a snapshot of **one zone — the product's own domain**.
Not the client fleet, not aggregate Rocket55 traffic. Visitors to this site are
themselves traffic on that zone, so the globe gets busier the more people are
looking at it.

Not built yet. The shape:

- A Cloudflare Worker with a token scoped to Zone Analytics Read on that one
  zone queries GraphQL and caches the result. Deliberately **not** an endpoint
  on the operator, which fails closed without a bound tenant and should not
  grow a public carve-out for this.
- The page ships with a baked-in snapshot as the fallback, so the globe cannot
  break when the Worker or the origin is down. Never iframe the operator: it is
  behind auth and would couple this page to app uptime.
- Rolling 24-hour window, not instantaneous, so it survives quiet hours.
- Relative intensity only, never raw request counts, so the page does not
  publish exact traffic volume.

**The zone must be on a paid Cloudflare plan.** Free zones are denied
`coloCode` on `httpRequestsAdaptiveGroups`, and the denial fails the whole
query rather than just that field, so the globe would fall back to country
resolution and could not light points of presence at all.

## Open before build

- Which domain, and get its zone onto a paid plan.
- The real OVH region for the origin marker; it is a Beauharnois placeholder.
- Mint the Worker's Analytics Read token — no existing token reaches this zone.
