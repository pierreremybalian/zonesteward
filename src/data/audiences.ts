// Who Zonesteward is for, one entry per role page under /for. Every feature
// named here is shipped and verified against the operator (see the plan's
// verified list); pains are the role's, features are the product's answer.
export type Audience = {
  slug: string;
  label: string;        // chip text
  roles: string;        // who, literally
  title: string;        // <title>, role-keyworded
  description: string;  // meta description
  h1: string;
  lede: string;
  pains: string[];
  features: { b: string; p: string; href: string }[];
  cases: string[];      // ids on /use-cases
  shot: "tour-see" | "tour-security" | "tour-alerts" | "tour-ask" | "gate-card" | "role-dev" | "uc-graph";
  alt: string;
};

export const AUDIENCES: Audience[] = [
  {
    slug: "agencies", label: "Agencies & MSPs", roles: "Web agencies, managed service providers, freelancers running client zones",
    title: "Cloudflare management for agencies and MSPs — Zonesteward",
    description: "One place for every client’s Cloudflare zone: ask in plain language, approve changes with a blast-radius preview, send clients a share link or a seven-day report. Priced by zones, on your own keys.",
    h1: "Forty client zones, one steward.",
    lede: "Built by an agency, for agencies: every zone you’re responsible for in one workspace, answers in a sentence, and no change without a card you approved.",
    pains: ["Six client accounts, forty dashboard tabs, and a support queue that expects answers in minutes", "A WAF change on a live client site at five o’clock, with no way back", "The Friday report, assembled by hand, for every client"],
    features: [
      { b: "Zone groups and bulk cards", p: "Group zones by client. A purge, a WAF rule or a rate limit goes to the whole group on one approval card, read back per zone.", href: "/#tour-clients" },
      { b: "Share links and reports", p: "A link per client — viewer or admin, scoped, revocable — and a seven-day digest with CSV for every table.", href: "/#tour-clients" },
      { b: "Priced by zones, on your keys", p: "Studio, Agency, Fleet — every tier includes everything. Your Cloudflare token and model key; usage billed to you at cost, never marked up.", href: "/pricing" },
    ],
    cases: ["down", "purge"], shot: "tour-see", alt: "The dashboard across a fleet of client zones",
  },
  {
    slug: "security", label: "Security & SOC", roles: "Security engineers, SecOps, SOC analysts, IAM specialists",
    title: "Cloudflare WAF and attack triage for security teams — Zonesteward",
    description: "See who is attacking every zone you protect, scored and categorised with country and network, and challenge or block through an approval card with the blast radius counted. Nothing writes without a human.",
    h1: "Every attacker, ranked. Every block, approved.",
    lede: "The security tab reads Cloudflare’s firewall and request analytics for all your zones and turns them into a ranked list of sources with a verdict each — then every response is a proposal you approve, not a script that fires.",
    pains: ["Firewall events across many zones, one zone at a time, with no idea whether the same source is hitting the others", "Blocking that might catch customers, with no count in front of you", "Automation you can’t audit"],
    features: [
      { b: "Attackers scored and categorised", p: "Nine categories, a composite severity, country and network, the paths probed against the paths that exist — and the sources that look hostile but aren’t, with the reason they were cleared.", href: "/#tour-security" },
      { b: "Blast radius before the rule exists", p: "A proposed WAF or access rule is run against the last 24 hours of real traffic, broken down by country, ASN, path and user agent, so you see what it would have blocked.", href: "/#gate" },
      { b: "Structural gate, full audit", p: "The model has no write tool. Every change goes through the execution core after a human decision, is read back from Cloudflare, and lands in the audit trail with its revert.", href: "/how-it-works" },
    ],
    cases: ["attack", "block"], shot: "tour-security", alt: "The security tab with ranked attackers, countries and networks",
  },
  {
    slug: "ops", label: "Ops & Reliability", roles: "DevOps engineers, site reliability engineers, platform engineers",
    title: "Cloudflare alerting and incident reports for DevOps and SRE — Zonesteward",
    description: "Describe the condition in English, get a dry-run Cloudflare alert rule with threshold, window and minimum volume, and route it to Slack, PagerDuty, email, SMS or a webhook. Incident reports with the evidence.",
    h1: "Alerts written from a sentence. Incidents with the evidence.",
    lede: "Every number Cloudflare exposes about a zone can watch itself: you describe what would worry you, the composer writes the rule and dry-runs it, and when it fires you get an incident with the investigation attached.",
    pains: ["Threshold maths and GraphQL for every alert, per zone", "Pages with no context — what changed, who changed it, was it the origin", "No printable incident record for the post-mortem"],
    features: [
      { b: "Alert rules in English", p: "Query, threshold, window and minimum volume written from your sentence, explained back to you, dry-run against live traffic before it’s armed.", href: "/#tour-alerts" },
      { b: "Your channels", p: "Email through Resend, SendGrid, Mailgun or SMTP; Slack; Microsoft Teams; PagerDuty; SMS via Twilio; signed JSON webhooks.", href: "/#details" },
      { b: "Incident reports and audit", p: "Each incident carries what fired, what the investigator found, and every change made in the window — printable, with CSV.", href: "/#tour-clients" },
    ],
    cases: ["down", "next"], shot: "tour-alerts", alt: "Alert rules, each explained in plain words",
  },
  {
    slug: "network", label: "Network & Edge", roles: "Network engineers, cloud and infrastructure engineers",
    title: "Cloudflare edge, cache and origin analytics for network engineers — Zonesteward",
    description: "Cache hit ratio, origin response time, points of presence and countries — by zone or across the fleet — as charts you ask for in a sentence. Cache rules and origin settings proposed with the request count they affect.",
    h1: "Edge to origin, in one chart.",
    lede: "Cache status by path, origin latency by hour, which data centre served which region — asked for in plain language and answered from Cloudflare’s own analytics, with the query in the open beside the chart.",
    pains: ["Cache misses you can see in the bill but not on a chart", "“Slow in Germany” with no way to say which PoP or which path", "Edge settings eleven clicks deep, one zone at a time"],
    features: [
      { b: "Cache and origin, charted", p: "Fourteen chart kinds; cache status, origin response time and status, edge TTFB, by path, by hour, by country or PoP.", href: "/#tour-ask" },
      { b: "The live globe", p: "Requests by point of presence in real time, arcs for cache misses reaching the origin, one zone or the fleet.", href: "/#tour-see" },
      { b: "Edge settings, read and changed", p: "Tiered Cache, Cache Reserve, Argo, DNSSEC, certificates — read in a sentence; changed only through an approval card with read-back.", href: "/#details" },
    ],
    cases: ["slow", "region"], shot: "uc-graph", alt: "Cache status by hour over seven days, charted from a question",
  },
  {
    slug: "developers", label: "Developers", roles: "Backend and full-stack developers, web developers",
    title: "Cloudflare analytics and GraphQL, from a question — Zonesteward for developers",
    description: "Ask about status codes, paths, cache and errors in plain language; get the answer, the chart, and the exact GraphQL query and JSON beside it. Save views, purge by URL, propose rules — nothing applied without your approval.",
    h1: "The query you’d have written, written for you — and shown.",
    lede: "Every answer comes with its GraphQL and its JSON. Take the query, change it, run it again. Saved views keep the conversation that produced them, so you know why a chart exists.",
    pains: ["Cloudflare’s GraphQL schema, its retention windows and field names, learned by trial", "A purge or a header rule that needs a ticket to someone with the dashboard", "Charts with no query behind them"],
    features: [
      { b: "Viz, Table, GraphQL, JSON", p: "Four tabs beside every answer. The query is real, editable, re-runnable.", href: "/#tour-ask" },
      { b: "Purge and rules as proposals", p: "Purge by URL, cache rules, transform and header rules, redirects — proposed from a sentence, approved on a card, read back.", href: "/#gate" },
      { b: "Saved views and the library", p: "Save a chart, pin it, put it on the dashboard; a library of questions worth asking again.", href: "/#tour-see" },
    ],
    cases: ["graph", "undo"], shot: "role-dev", alt: "The GraphQL tab beside a chat answer",
  },
  {
    slug: "dns-it", label: "DNS & IT admin", roles: "DNS administrators, IT administrators",
    title: "Cloudflare DNS and zone administration with read-back and revert — Zonesteward",
    description: "Every DNS record, zone setting and certificate across your zones, readable in a sentence and changed only through an approval card that is read back from Cloudflare and revertable in one click. Admin-only DNS.",
    h1: "DNS changes you can prove, and undo.",
    lede: "Records and zone settings across every zone in one place. A change is proposed, classified — an apex deletion is high impact and needs an acknowledgement — executed, read back from Cloudflare, and stored with its revert.",
    pains: ["Which zone has which record, across dozens of accounts", "A DNS edit with no record of who made it or what it replaced", "Certificates and DNSSEC state checked by hand"],
    features: [
      { b: "DNS across the fleet", p: "Records by zone, changes admin-only, apex and bulk changes classified high with an explicit acknowledgement.", href: "/#details" },
      { b: "Read-back and revert", p: "“Applied” means Cloudflare was asked what the record is now. Every change stores its before-state and a one-click revert.", href: "/how-it-works" },
      { b: "Certificates, DNSSEC, settings", p: "Edge certificates and expiry, DNSSEC down to the DS record, Universal SSL, zone status and nameservers — a sentence away.", href: "/#details" },
    ],
    cases: ["undo", "down"], shot: "gate-card", alt: "An approval card: the change, its impact, what it would have matched, Approve or Reject",
  },
  {
    slug: "leadership", label: "Leadership", roles: "CTOs, VPs of Engineering, solutions architects",
    title: "Governed Cloudflare operations — approvals, audit, cost transparency — Zonesteward",
    description: "An AI operator that structurally cannot change Cloudflare without a human approval, with a full audit trail, per-client access, and model usage itemised on your own keys with no markup.",
    h1: "AI that proposes. People who decide. A record of both.",
    lede: "The model has no write tool. Every change to Cloudflare goes through an approval card and the execution core, is read back, and is logged with who approved it and how to undo it. Costs are your provider’s, itemised.",
    pains: ["Handing an AI tool the keys to production DNS and WAF", "No answer to “who changed this, and why”", "Opaque per-seat AI pricing on top of the model bill"],
    features: [
      { b: "The gate", p: "Nothing writes without a human; impact classified on the server; high-impact changes need an acknowledgement; viewers can’t approve; DNS and bulk changes are admin-only.", href: "/#gate" },
      { b: "Audit and access", p: "Every attempt recorded with actor, payload, response and revert. Roles enforced at three layers. Share links scoped per client.", href: "/security" },
      { b: "Cost you can see", p: "Your Cloudflare token, your model key. Every call itemised by feature and model; billed to you by the provider at cost, never marked up.", href: "/#tour-keys" },
    ],
    cases: ["block", "undo"], shot: "gate-card", alt: "An approval card with impact class and blast radius",
  },
  {
    slug: "support", label: "Support", roles: "Support engineers, account managers",
    title: "Answer “is the site down?” in a sentence — Zonesteward for support teams",
    description: "Ask whether a client site is down, slow, or under attack and get a plain answer with the evidence — without the Cloudflare dashboard or an engineer. Share a live view with the client.",
    h1: "The client asked. You can answer.",
    lede: "“Is client.com down?”, “Why is it slow?”, “Did that change go through?” — typed as asked, answered in prose with the numbers, and safe: a viewer can see everything and change nothing.",
    pains: ["Escalating every “is it down?” to an engineer", "Reading a Cloudflare dashboard you weren’t trained on", "Nothing to show the client while you wait"],
    features: [
      { b: "Plain answers with evidence", p: "Edge or origin, cached or not, one region or everywhere — with the chart. Proposals go to someone who can approve them.", href: "/#tour-ask" },
      { b: "Viewer role", p: "See every zone, every answer, every incident; change nothing. Safe to hand to a whole team.", href: "/security" },
      { b: "Share links", p: "A live, scoped, revocable link to the client’s own sites, so the answer can be shown rather than described.", href: "/#tour-clients" },
    ],
    cases: ["down", "region"], shot: "tour-ask", alt: "A chat answer with its chart",
  },
];
