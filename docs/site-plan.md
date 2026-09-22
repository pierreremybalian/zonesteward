# Zonesteward marketing site: sitemap, content plan, SEO and market analysis

## Context

The product is multi-tenant, running in production, and named. What it lacks is
anywhere to send someone. Pierre has no sales team and no cold-outreach motion,
so the site's job is not to close deals: it is to convert a warm visitor who
arrived from a forum post, a Show HN thread or a peer into a **beta
application**, and to answer a security-minded buyer's questions well enough
that they'll hand over Cloudflare credentials.

Decisions taken:

- **Audience: agencies and MSPs** managing Cloudflare zones for clients. This
  is who the product was built for (fleet view, zone groups, share links) and
  the only audience Pierre can currently reach, because he is one of them.
- **Beta first, no payments.** Applications, twenty seats, free during beta,
  testers bring their own Cloudflare and Anthropic keys. Post-beta prices are
  published anyway, so the beta offer is concrete and the zero-price anchor is
  never set.
- **Pricing shown: per workspace, tiered by zones.** $49/mo to 25 zones,
  $149/mo to 100, custom beyond. Marked "from general availability".
- **A full Security page.** Asking for write access to someone's production is
  the whole objection; the substance to answer it honestly already exists.
- **Hosting: Cloudflare Pages**, separate repo, `zonesteward.com`. The app
  stays at `app.zonesteward.com` on OVH. Marketing traffic must never land on
  the box holding customers' encrypted tokens, a marketing deploy must not be
  able to break the product, and the app's origin is sealed with mTLS, which is
  the opposite of what a crawlable site needs.

---

## 1. Market analysis

Researched 2026-09-21. Prices are list, from vendor pages and comparison
sources; verify before publishing any comparison.

### Nobody is doing this

The space splits three ways and Zonesteward sits in a gap between them.

**Cloudflare's own tooling.** Organizations gives Enterprise customers a
roll-up across up to 500 accounts and 5,000 zones, with HTTP analytics. It is
Enterprise-only, so it is invisible to the agency running forty zones on Free
and Pro. The dashboard itself is one zone at a time and assumes you already
know which setting you need.

**DNS and config managers.** CFMANAGE is the closest direct competitor and
claims 2,000+ teams. It is a DNS and bulk-settings tool, priced like a utility.

| CFMANAGE tier | Price | Limits |
|---|---|---|
| Free | $0 | 2 accounts, 4 domains, 20 records |
| Starter | $4.99/mo | 50 accounts, 100 domains |
| Professional | $9.99/mo | 100 accounts, 200 domains |
| Enterprise | $19.99/mo | unlimited |

aioflare is a similar indie effort in beta. Terraform and octoDNS cover
config-as-code for teams who will write HCL or YAML, which agencies largely
will not.

**AI SRE agents.** Resolve.ai, Cleric and Traversal do agentic investigation
for large engineering orgs. All are contact-sales with no published pricing,
all are Kubernetes-and-observability shaped, none touch Cloudflare specifically.
Cleric markets a read-only safety posture, which confirms the market already
understands the "don't let the AI act" problem that the approval gate solves.

**Nobody combines** a multi-zone agency view, plain-language investigation, and
gated writes with verification. CFMANAGE edits DNS in bulk; the AI SRE tools
investigate but don't act on Cloudflare; Terraform acts but can't answer a
question.

### What the buyer already pays

| Thing | Price | Relevance |
|---|---|---|
| Cloudflare Business | $250/mo per zone | One zone costs more than a whole Zonesteward tier |
| Cloudflare Pro | ~$20-25/mo per zone | The plan most agency clients are on |
| WP Umbrella | €1.99/site/mo, all in | Closest business-model comp: agencies, per site |
| ManageWP | ~$12/site/mo at list, or $150/mo for 100 sites | Same buyer, same wallet |
| MainWP | $29/mo flat, self-hosted | Flat-rate alternative in the same market |
| AI SRE tools | contact sales | The category Zonesteward is cheaper and clearer than |

**Reading:** agencies already pay per-site monthly fees for management tooling
and treat $150/mo for a hundred sites as normal. $149/mo for a hundred zones
sits exactly in that groove. Publishing prices at all is a differentiator
against the AI-ops category.

### Positioning

Against CFMANAGE: they edit records, we answer questions and gate changes.
Against Terraform: no HCL, and it explains itself.
Against the AI SRE tools: Cloudflare-specific, priced publicly, affordable.
Against the Cloudflare dashboard: every zone at once, and a record of what
changed.

**Risk to name honestly:** Cloudflare could ship fleet analytics for non-
Enterprise accounts and erase part of the wedge. The defensible parts are the
approval pipeline, the attacker classification, and the audit trail, not the
roll-up view. Weight the messaging accordingly.

---

## 2. Sitemap and content plan

Nine pages at launch. Everything ends at **Apply for beta**.

```
/                     Homepage
/how-it-works         The propose → approve → verify → revert pipeline
/security             How your credentials are held           ← the sale
/features             Full capability list
/pricing              Post-GA prices + the beta offer
/beta                 Application form                        ← the conversion
/about                Who built it and why
/docs                 Getting started, later a real doc set
/blog                 SEO surface, ships with 3 posts
/privacy  /terms      Legal, already served by the app; mirror here
```

### Homepage

- **Hero.** "Your whole Cloudflare fleet, in one conversation." Sub: ask
  questions in plain language, see the answer on a live globe, approve changes
  that verify themselves. Nothing writes without you. CTA: Apply for beta,
  twenty seats. Secondary: watch the 22-second film (you already rendered it).
- **The problem**, in the reader's words: forty zones across six clients, one
  dashboard per zone, no way to see who is being attacked right now, and a
  genuine fear of changing a WAF rule on a client's production site.
- **Three capability blocks**, each a screenshot and two sentences: Ask, See,
  Operate.
- **The gate.** The approval card, the impact badge, Verified and Revert. This
  is the differentiator and it goes above the fold on mobile.
- **Who it's for.** Agencies, MSPs, and in-house teams with more zones than
  patience.
- **Security teaser** linking to /security.
- **Beta block.** What you get, what you give (feedback), what it costs
  (nothing, plus your own Cloudflare and Anthropic keys), how many seats remain.

### /how-it-works

The pipeline as the spine: propose, classify impact, approve, drift-check,
execute, read back, audit, revert. One screenshot per stage. Close with the
sentence that matters: *every function that can change Cloudflare is reachable
only from the execution core, so prompt injection through a request path or
user agent cannot cause a write.* That is a claim competitors cannot make and
it is true of this codebase.

### /security  (the page that closes the deal)

Written for someone who has to justify this internally. Sections:

- **No autonomous writes.** The model proposes; a human approves; the server
  executes and verifies.
- **Workspace isolation.** One database per customer, one encryption key per
  customer, wrapped under a deployment master key. A missed boundary is an
  error, not a data leak.
- **Credentials.** AES-256-GCM at rest, decrypted only server-side, never
  returned to a browser. Write permissions are never discovered by writing.
- **Access.** Email links or Google, Microsoft and GitHub, with only
  provider-verified addresses able to create an account. Roles, revocable share
  links, full audit trail.
- **Backups.** Nightly, encrypted, off-box, restore-tested, with the date.
- **Sub-processors**, named: Anthropic, Cloudflare, Resend, OVHcloud.
- **Known limitations**, honestly. Copy the posture from SECURITY.md. Publishing
  limitations is a trust signal and it is already the house style.

### /features

The FEATURES.md content, reorganised by job rather than by subsystem: Ask, See,
Investigate, Operate, Monitor, Govern. Skimmable, screenshot-led.

### /pricing

Three tiers, priced per workspace by zone count, every tier all-inclusive.

| | Studio | Agency | Fleet |
|---|---|---|---|
| Zones | to 25 | to 100 | 100+ |
| Price from GA | $49/mo | $149/mo | talk to us |
| Members | 3 | 10 | unlimited |

Every tier includes everything: chat, globe, attacker investigation, approvals,
audit, alerts, share links. No feature gating, because a security feature
withheld from the cheap tier is a bad look and agencies hate add-on stacking
(see ManageWP).

Say plainly: **free during beta**, then 50% off the first year for beta
testers, locked. State that you bring your own Cloudflare token and Anthropic
key, and that AI usage is billed by Anthropic to you, not marked up. That last
point is unusual and worth saying.

FAQ: why per zone, what counts as a zone, what happens at the end of beta, can
I export my data, what if I cancel.

### /beta

The conversion page and the market research instrument. Fields: email, company,
roughly how many zones, mostly clients' or your own, what you use today, and
what would make this worth paying for. Six fields, no more. State the cap, the
rough beta length, and what you expect in return (occasional feedback, not a
second job). Confirmation sets expectations about when they'll hear back.

### /about

Short, first person, and specific: built while running a fleet of Cloudflare
zones for an agency, because the dashboard assumes one zone and one expert.
Founder-built is an asset at this stage, not something to hide behind a fake
"team" page.

### /blog, three posts at launch

Each is a real answer to a question the ICP actually searches, not SEO filler:

1. *What "Invalid zone access" means and how to fix it* — a Cloudflare API
   error with poor documentation, high search intent, and you have fought it.
2. *Reading Cloudflare firewall events: who is actually attacking you* — turns
   the attacker classifier into an explainer and demonstrates the product.
3. *Why we let an AI propose changes but never make them* — the philosophy
   piece, and the Show HN / Hacker News post.

---

## 3. SEO analysis

**Be clear on what this is.** I cannot pull search volumes without a keyword
tool, so this is intent and structure analysis, not a volume-ranked keyword
plan. Validate volumes in Ahrefs, Semrush, or Google Keyword Planner before
committing to a content calendar.

### The strategic problem

Nobody searches for "Cloudflare fleet operator", because the category has no
name. There is no head term to win. That means:

- **Paid search is a waste** at this stage. You'd be bidding on Cloudflare's own
  brand terms against Cloudflare.
- **Long-tail problem searches are the whole opportunity.** People search the
  error message, not the product.
- **Community and direct beat organic for the first year.** Treat SEO as an
  asset that compounds while you do the outreach that actually fills the beta.

### Intent map

| Intent | Example searches | Target page |
|---|---|---|
| Problem-aware | manage multiple cloudflare zones, cloudflare dashboard multiple domains, bulk update cloudflare settings | Homepage, /features |
| Error and how-to | cloudflare invalid zone access, cloudflare firewall events explained, cloudflare graphql analytics denied | Blog posts, which then link to the product |
| Solution-aware | cloudflare management tool for agencies, cloudflare multi account dashboard | Homepage, /pricing |
| Comparison | cfmanage alternative, terraform cloudflare alternative | A comparison page, post-launch |
| Trust | is it safe to give api token, cloudflare api token permissions | /security, which is also a real SEO asset |

Note that `/security` serves double duty: it closes deals and it targets a
genuine, underserved search intent about API token safety.

### Technical requirements

Static on Pages means most of this is free, but do it deliberately:

- One `<h1>` per page, descriptive titles under 60 characters, meta
  descriptions written by hand, not generated.
- `Organization` and `SoftwareApplication` structured data on the homepage,
  `FAQPage` on pricing, `Article` on posts.
- Canonical URLs, an XML sitemap, and a `robots.txt` that allows everything
  except the app subdomain.
- **`app.zonesteward.com` must be `noindex`.** A signed-in product behind
  mTLS has nothing to offer a crawler and can only dilute the domain.
- Open Graph and Twitter cards on every page, with the brag film's poster
  as the default image. Link previews are most of the traffic from forums.
- Real image dimensions, `loading="lazy"` below the fold, and no
  render-blocking anything. Pages plus static HTML should give a near-perfect
  Lighthouse score; there is no excuse for less on a marketing site.

### Honest expectation

Organic will deliver close to nothing for six months. The blog posts are
seeds. Beta seats will be filled by The Admin Bar, Post Status, r/ProWordPress,
r/msp, r/cloudflare, the Cloudflare community forum, Show HN, and Pierre's own
network, which is full of exactly this buyer.

---

## Build plan

**Stack.** Astro, static output, Tailwind. Astro because it ships zero JS by
default, has first-class Markdown for the blog, and deploys to Pages from a git
push. Next would work but you gain nothing and carry a server you don't need.

Reuse from the app so the two feel like one product: the palette and type from
`app/globals.css` (Geist, `#0a0a0a`, Cloudflare orange `#F6821F` as the single
accent), the FEATURES.md copy, SECURITY.md for `/security`, and the rendered
film plus its poster from `brag-output/`.

**New repo**, `zonesteward-site`, not a folder in this one. Separate deploy,
separate blast radius.

**Screenshots** are the main asset gap. Needed: the live globe with PoPs, an
attacker row, the approval card mid-flow, and the fleet console. Take them
against the demo workspace, never against real client data, and check every
pixel for zone names before publishing.

**DNS.** `zonesteward.com` and `www` to Pages, `app` to the OVH box, all
proxied, on the existing Cloudflare account. The app's mTLS origin pull is
zone-level and already covers a new subdomain.

## What this plan does not cover

Stripe and self-serve signup, deliberately deferred until the beta tells you the
price. A comparison page against CFMANAGE, better written once you have
customers who chose you over it. Docs beyond getting started. Any change to the
product itself.

## Verification

- Every page passes Lighthouse at 95+ on performance, accessibility, best
  practices and SEO, on mobile.
- `curl` the sitemap and confirm every listed URL returns 200; confirm
  `app.zonesteward.com` returns `noindex`.
- Paste each page's URL into Slack and X and confirm the link preview renders
  with the right image and description.
- A stranger reading only the homepage can say what it does, who it's for, and
  what it costs. Test this on someone outside the agency world.
- The beta form writes somewhere you'll actually see it, and the confirmation
  email arrives.
- Read `/security` as if you were the person who has to approve handing over a
  Cloudflare token, and check that every claim on it is one the code actually
  supports.
