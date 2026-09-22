# Zonesteward

Marketing site for Zonesteward — Cloudflare fleet operations for agencies.
Astro, static output, deployed to Cloudflare Pages at
**zonesteward.com**, with the live globe served by a Pages Function.

```bash
nvm use && npm install
npm run dev     # astro, :4321
npm run build   # -> dist/
npm test        # the Pages Functions, no network, no wrangler
```

## Layout

```
src/            the site
  layouts/Base.astro     head, fonts, both stylesheets
  components/            one per section of the page
  styles/ledger.css      the foundation: tokens, type, components
  styles/site.css        the B1R layout on top of it
public/g/       globe.js, land.js, globe-live.js, colo-cities.js
functions/      Cloudflare Pages Functions (see "The live globe")
schema.sql      D1
styleframes/    the design exploration that got here, kept whole
```

Styleframes open straight off disk — no server, no build, Google Fonts the only
network dependency.

Both stylesheets are **global, not scoped per component**. Every selector was
written against the approved styleframe, and Astro's default scoping would
quietly change which ones still match.

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

### Why it does not use the Analytics API

The obvious route — query `httpRequestsAdaptiveGroups` for the zone — is shut
on a free plan. Cloudflare denies `coloCode` to free zones and denies it as a
*top-level* error that fails the whole query, so there is no partial answer to
fall back on. That would have forced a paid plan just to draw the hero.

`request.cf.colo` costs nothing. It is the three-letter IATA code of the data
centre that served the request, documented under **"All plans"**, and it
arrives on every request as edge metadata rather than as analytics. So the site
records what is happening as it happens instead of asking afterwards:

- `functions/_middleware.js` reads `request.cf.colo` on each page view and
  bumps a per-colo, per-hour counter in D1.
- `functions/api/globe.js` returns the last 24 hours normalised against the
  busiest colo.
- `src/components/Stage.astro` renders a baked snapshot immediately and swaps
  in live numbers if the fetch succeeds.

Better than the analytics route on every axis: no API token, no plan upgrade,
real-time rather than five minutes stale, and the operator is not involved.

### Rules this holds to

- **Counters only.** Colo and an hour bucket. No IP, no user agent, nothing
  identifying. Cloudflare resolved the request to a colo at the edge, so there
  is nothing left to geolocate and nothing worth storing.
- **Relative intensity, never raw counts.** The hero should not publish exact
  traffic volume to anyone who opens dev tools.
- **The globe cannot break.** Baked fallback, edge-cached endpoint, and
  instrumentation that swallows its own failures. This is the reason it is not
  an iframe of the operator, which is behind auth and would tie this page to
  app uptime.
- **A rolling 24-hour window**, so it survives quiet hours.

## Setting up D1

Already done: database `zonesteward-globe`, id in `wrangler.toml`, schema
applied to both remote and local.

```bash
npm run db:local    # after changing schema.sql
npm run db:remote
npm run preview     # build + wrangler pages dev, Functions and D1 for real
```

**Do not pass `--d1` to `wrangler pages dev`.** The binding already comes from
`wrangler.toml`; passing the flag as well resolves to a *different* local
database, so the schema lands in one and the Function writes to the other. It
fails silently, because the middleware swallows its own errors by design.

The binding is picked up from `wrangler.toml` on deploy — nothing to add in the
dashboard.

## Deploying

The Pages project was created from the CLI, because the dashboard no longer
offers Pages under "Create application" — that flow now only makes Workers.
So there is **no git integration**: pushing to `main` does not deploy.

```bash
npm run deploy
```

Live at https://zonesteward.com (and zonesteward.pages.dev). To get deploy-on-push, connect the repo
from the project's Settings once Cloudflare exposes it again.

## Still open

- The real OVH region for the origin marker — it is a Beauharnois placeholder
  in `src/components/Stage.astro`.
- The beta form posts nowhere yet.
`request.cf` is populated under `wrangler pages dev` too, with real values —
verified locally as `colo: MSP`, ASN 209, so the pipeline can be exercised
end to end without deploying.
