---
title: 'What Cloudflare''s "Invalid zone access" error actually means, and how to fix it'
description: "It isn't your token. Well, it is — but not the way the message implies. What the GraphQL API is really telling you, why it fails your whole query, and how to work around it."
date: 2026-09-22
minutes: 6
---

You have a Cloudflare API token. It lists zones fine. You ask the GraphQL
analytics API a perfectly reasonable question about one of them and get:

```
Invalid zone access
```

No zone named. No permission named. The REST API is happy with the same token
a second earlier. If you've landed here from a search, you've probably already
tried regenerating the token. It didn't help. Here is what's going on.

## The permission to list a zone is not the permission to read its analytics

A token can carry `Zone → Zone → Read`, which lets it *enumerate* zones, without
carrying `Zone → Analytics → Read` on each of those zones. Listing succeeds.
Analytics fails. The error message doesn't distinguish, so it reads as if the
zone doesn't exist or the token is broken. Neither is true. The token can see
the door; it can't open it.

This happens constantly with agency tokens, because you create one token for
"all zones in the account" and then a client's zone lives in a *different*
Cloudflare account that token has never heard of — or the token was scoped to
specific zones when it was minted and somebody added a zone since.

**Fix:** edit the token. Under Zone Resources, either include the specific zone
or widen the scope to "all zones from an account", and make sure
`Analytics: Read` is in the permissions list, not just `Zone: Read`. Cloudflare
doesn't tell you which zone failed, so check every zone the query touches.

## One bad zone fails the whole query

This is the part that costs people afternoons. The GraphQL API lets you alias
several zones into one request:

```graphql
{
  viewer {
    a: zones(filter: { zoneTag: "..." }) { httpRequests1dGroups(...) { ... } }
    b: zones(filter: { zoneTag: "..." }) { httpRequests1dGroups(...) { ... } }
    c: zones(filter: { zoneTag: "..." }) { httpRequests1dGroups(...) { ... } }
  }
}
```

If the token can't read analytics for **any one** of those zones, the error is
returned at the top level and **you get nothing for the other zones either.**
Not partial data with an error for `b`. Nothing. So a fleet query over forty
zones with one stale client account in it fails forty zones.

**Fix:** when a multi-zone query fails with this error, bisect. Split the zone
list in half and retry each half; keep splitting until you've isolated the zone
the token can't read. Then either fix the token or deny-list that zone from
fleet queries until it's fixed. Doing this by hand once is fine. Doing it every
time is why we automated it — Zonesteward's fleet poller bisects failing
batches and remembers per zone.

## Fields are plan-gated, and that fails the same way

A related failure with a different message. Some fields on
`httpRequestsAdaptiveGroups` are only returned for paid plans. On a Free zone,
asking for `coloCode` (which data centre served the request) or
`clientASNDescription` is refused — and, again, refused as a *top-level* error
that fails the whole query rather than returning null for that field.

Free zones will give you `clientCountryName` and `clientIP`. They will not give
you the colo. If you're building anything that shows traffic per data centre,
know that it will silently be Pro-and-above only unless you handle the denial.

**Fix:** drop the denied field and retry, per zone. In practice that means
keeping a per-zone record of which fields it can answer. Plans change; keep
the record stale-able so an upgrade takes effect.

## Retention is plan-gated too

Free zones keep roughly eight days of daily rollups, and firewall events can
only be queried a day at a time. Ask for thirty days and you'll get a
"cannot request data older than" refusal. That's a retention floor, not a
span cap — probing older windows will always fail, so don't retry it.

## The short version

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid zone access` on a zone the token lists | Zone Read without Analytics Read, or zone in another account | Edit token scope and permissions |
| Multi-zone query fails entirely | One zone in the batch is unreadable | Bisect, isolate, deny-list |
| `coloCode` / ASN refused | Free plan | Drop field, retry, remember per zone |
| "Cannot request data older than…" | Free-plan retention | Shorten the window; don't retry |

None of this is documented in one place, which is why the error costs so much
time. The token isn't broken. Cloudflare is telling you, badly, that it's
scoped narrower than you think.
