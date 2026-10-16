# Scaling & Failures

The basic [request flows](request-flows.md) work with an application and database.
This page explains when to add a cache, how that affects disabling links, and
what the service should do when a dependency fails.

## Estimate the workload

Assume users create 100,000 links and open short URLs 10 million times per day.
Both generated keys and custom aliases count toward the same creation total.
Assume peak traffic is ten times the average and each mapping uses 300 bytes.
These are planning inputs, not measured capacity.

| Estimate | Calculation | Result |
| --- | --- | --- |
| Average creations | 100,000 / 86,400 seconds | 1.16/s |
| Average redirects | 10,000,000 / 86,400 | 115.7/s |
| Peak redirects | 115.7 x 10 | About 1,157/s |
| Links after one year | 100,000 x 365 | 36.5 million |
| Raw yearly storage | 36.5 million x 300 bytes | 10.95 GB |

Use decimal GB here. Actual URL sizes, indexes, database copies, and backups
need separate allowances. A popular link can account for much of the traffic,
so test both evenly spread requests and requests concentrated on one key.

For this example, target about 1,200 peak redirects/s and server-side p95 latency
below 100 ms: at least 95% of measured redirect requests should finish within
that time. Check failed requests separately. These targets do not determine a
machine count until the implementation has been measured.

## Cache repeated lookups

The service first checks the cache for an active mapping. If a usable copy is
present, this is a **cache hit**. Otherwise, it reads the database, checks the
mapping, and can save a temporary copy for later requests. This is a **cache miss**.

A cached copy has a **time to live (TTL)**, the period for which it may be kept
before expiry. Its lifetime is different from the link's expiration time.
A link may remain active for months while each copy lasts only seconds.

Cache only active mappings. Never use a copy beyond its reuse deadline or the
link's own expiration, whichever comes first. Do not add a new mapping to the
cache before its database save succeeds.

## Keep revocation bounded

The chosen target allows new lookups to return the old destination for at most
30 seconds after the service confirms revocation. The service saves `revoked_at`
and removes the cached copy, but removal can fail. An earlier database read can
also put an old value back after the removal.

To keep reuse bounded, start a copy's 30-second deadline when its database lookup
begins, not when the copy eventually enters the cache. A lookup taking five
seconds leaves at most 25 seconds of reuse. Skip the fill if its deadline
already passed, and check that deadline on every cache hit.

This bound assumes fresh reads from the primary database, no extension of old
deadlines during copying or retries, and an allowance for clock differences
between servers sharing timestamps. An indefinitely delayed read followed by
a new 30-second TTL would not provide the same guarantee.

If new lookups must stop returning redirects immediately after confirmation,
do not rely on these temporary copies; check authoritative state for each lookup.
Requests already in progress still require an explicit coordination policy.

## Choose the redirect policy

This design uses `302` because owners can disable links. A browser that retains
a permanent `301` redirect may bypass later checks at the shortener.
Send `Cache-Control: no-store` so compliant browsers and intermediate caches
do not store the redirect response.

This HTTP response policy is separate from the service's internal mapping cache.
Neither status can recall a redirect already followed. A different API that
must preserve the caller's HTTP method on a temporary redirect can consider `307`;
the public operation here accepts only GET.

## Handle failures

| Failure | What the service does |
| --- | --- |
| Cache unavailable | Limit database fallback rate, concurrent reads, and waiting time; return `503` for excess work. Choose limits from measured database headroom. |
| Many requests miss the same key | Let one in-progress lookup serve waiting requests for that key. Limit waiters too. Vary TTLs downward to spread expiration without extending deadlines. |
| Database unavailable | Use only still-valid active cached copies; otherwise return `503`, not an invented `404`. |
| Cache invalidation fails | Record and retry the invalidation; retain the original reuse deadlines. |
| Database saved a new link, but the creation response was lost | A retry may create a second generated link or receive `409` for the custom alias. Do not assume the original save failed. |

If creation retries must return the original result, extend the API with an
**idempotency key** identifying one request. Save the caller, key, input, and result
in the same database transaction as the mapping. The transaction saves all
these changes together or none of them.

A retry with the same caller, key, and input returns the saved result; changed
input is rejected. Define the retention period and pending-request behavior.
This is an extension to the basic contract, not something a custom alias
automatically provides.

## Check generated-key collisions

Eight base62 characters provide `62^8 = 218,340,105,584,896` possible keys.
If 36.5 million keys in that space are occupied, the next candidate's chance
of already being used is approximately:

```text
36,500,000 / 218,340,105,584,896 = 0.000000167
```

The probability is small for one attempt, but many creations still produce
collisions. Custom aliases matching the same eight-character format consume
candidates too. The database uniqueness rule remains necessary.

## Observe the targets

Measure redirect latency at p95/p99, service failures, cache hit ratio, and
database fallback rate and concurrency. Count expected `404` and `410` results
separately from service failures.

Track generated-key retries separately from custom-alias conflicts: an occupied
alias is often normal user contention, not a random-generator fault.
Monitor invalidation failures and measure how long disabled links still redirect.
Test cache loss and recovery against the measured fallback budget before
claiming that the service can handle an outage.

For background concepts, see [Scaling & Caching](../../04-scaling.md).
For a different retry problem, continue to [Notifications](../notification-service.md).

[Return to the conceptual exercise](request-flows.md#conceptual-exercise)
