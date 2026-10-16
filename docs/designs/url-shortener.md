# Design a URL Shortener

A URL shortener is a service that creates a short URL for a long URL.

The user submits a long URL to the service. The service generates a unique short
URL and stores the mapping between the short URL and the original URL in its
database for future lookups.

As an additional feature, the user can provide a custom alias along with the long
URL. For example, the alias `system-design` would create
`https://short.example/system-design`. If the alias is available, the service
saves the mapping. If it is already in use or reserved, the service rejects the
request.

When any user opens the short URL, the service looks up the original URL in its
database and returns an HTTP redirect response. The response includes a
`Location` header set to the original URL, which tells the browser where to
navigate. The service can use `301` for a permanent redirect or `302` for a
temporary redirect, depending on its redirect and caching policy.

## What are we building?

The service needs to store two main values: an identifier and the original URL.
The identifier appears after the domain in the short URL. We will call this
identifier the **key**. For example, `aB7q2X9m` is the key in
`https://short.example/aB7q2X9m`.

The service can generate the key automatically. The user can also choose the
key by providing a **custom alias**, such as `system-design`. The service stores
both types in the same way:

| Short URL | Stored destination |
| --- | --- |
| `https://short.example/aB7q2X9m` | `https://example.org/products/guide` |
| `https://short.example/system-design` | `https://example.org/products/guide` |

When the service receives either key, it looks up the corresponding original URL,
also called the **destination**. The key does not contain an encoded copy of the
destination; the service needs the database mapping to find it.

Different keys can point to the same destination. However, the service must not
assign the same key to different mappings, because it would not know which
destination to return.

## Follow one link from creation to click

The user who creates a link is its **owner**. The owner must sign in to create or
manage the link. Any user can open the link without signing in.

The service handles creation and opening as two separate requests:

1. The owner submits the original URL and, optionally, a custom alias.
2. The service checks the input and generates a key if no alias was provided.
3. The service saves the key, original URL, and owner in the database.
4. After the database confirms that it saved the mapping, the service returns the short URL.
5. When a user opens the short URL, the service extracts the key and looks it up.
6. If the link is active, the service returns `302` with `Location` set to the original URL.
7. The browser reads the response and requests the original URL.

```text
User's browser -- GET /system-design --> Service -- lookup --> Database
User's browser <-- 302 + Location ------ Service <-- mapping -- Database
User's browser -- GET /products/guide -----------------------> Original website
```

The browser opens the original website directly; the shortener does not download
the destination page. If the key does not exist, the service returns `404 Not Found`.
If the link has expired or its owner has disabled it, the service returns
`410 Gone` instead of redirecting the user.

## Build the smallest version first

The basic service needs an application and a database. The application receives
requests, checks input and permissions, and returns HTTP responses. The database
stores mappings so the service can find them after an application restart.

The database must also prevent two requests from saving the same key. Checking
this inside the database matters because multiple application instances may
receive creation requests at the same time.

```text
User --> Application --> Database
```

This version does not need a cache. A **cache** stores temporary copies of
frequently used mappings so the service can avoid repeated database reads.
We will add it later without changing the database's role as the permanent store.

## Now add realistic requirements

Once the basic flow is clear, we can define how the service should handle
management requests, expiration, and repeated reads.

| Requirement | Design consequence |
| --- | --- |
| Generated keys and custom aliases must not conflict | Store both in the same key column and reject duplicate values. |
| Owners can disable their links | Check the owner, save the disabled state, and remove any cached copy. |
| Existing links must not point to a different destination later | Keep the destination unchanged and require a new key for a new destination. |
| Links can have an expiration time | Check the time before returning a redirect, including when reading from the cache. |
| Popular links should not overload the database | Cache repeated lookups and limit database traffic if the cache fails. |

Disabling a link is called **revocation**. In this design, the service keeps the
database record after revocation or expiration but stops returning redirects.
Keeping that record prevents another user from claiming the same key and
changing where an old bookmark leads. This retained record is sometimes called
a **tombstone**.

## Scope and targets

This design includes generated keys, custom aliases, opening links, viewing link
details, expiration, and revocation. It does not cover custom domains, destination
previews, analytics, search, or accepting writes in multiple regions.

We will use the following targets to guide the design:

| Target | Meaning |
| --- | --- |
| About 1,200 redirects per second at peak | The service should handle this request rate in one region. |
| Server-side p95 latency below 100 ms | At least 95% of measured redirect requests should finish within 100 ms on the server. |
| Revocation takes effect within 30 seconds | After the service confirms revocation, new lookups must stop returning the old destination within this window. |

These are proposed targets, not measured guarantees. Revocation cannot close a
destination page that a user has already opened or recall a redirect already
returned. If the requirement also covers requests already being processed,
we must define and implement that behavior separately.

## Capacity

Before choosing server or database capacity, estimate how much work the service
will receive. Assume users create 100,000 links and open short URLs 10 million
times per day. Both creation modes count toward the same total.

There are 86,400 seconds in a day. For planning, assume peak traffic is ten times
the daily average and each stored mapping uses 300 bytes. Storage calculations
use decimal units: one GB is one billion bytes.

| Estimate | Calculation | Result |
| --- | --- | --- |
| Average creates | 100,000 / 86,400 | 1.16/s |
| Average redirects | 10,000,000 / 86,400 | 115.7/s |
| Peak redirects | 115.7 x 10 | about 1,157/s |
| Links after one year | 100,000 x 365 | 36.5 million |
| Raw yearly row storage | 36.5 million x 300 bytes | 10.95 GB |

The 300-byte estimate includes an assumed average URL length. Actual storage
depends on the fields and URLs we save. Database indexes, additional database
copies, and backups need extra space; they are not included in 10.95 GB.

These estimates give us a starting point for load testing. They do not prove
that a particular database can handle the traffic or that we need to split data
across databases. We should also test a popular link receiving a large share of
requests, not just traffic spread evenly across links.

## API

An **API** defines how a client calls the service. The client uses
`POST /v1/links` to create either type of short URL. If the request does not
include `alias`, the service generates the key. If it includes `alias`, the
service tries to save that exact value.

The client can also provide `expires_at` as a future UTC timestamp. A value of
`null` means the link has no expiration time.

```http
POST /v1/links
Authorization: Bearer example-token
Content-Type: application/json

{"destination":"https://example.org/products/guide","expires_at":null}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"key":"aB7q2X9m","short_url":"https://short.example/aB7q2X9m"}
```

To request a custom alias, the client adds `alias` to the same request:

```json
{"destination":"https://example.org/products/guide","alias":"system-design","expires_at":null}
```

If the service saves this mapping, it returns `201 Created`:

```json
{"key":"system-design","short_url":"https://short.example/system-design"}
```

If the alias is already in use, the service returns `409 Conflict`. It does not
generate a different alias because the user requested a specific name.

| Request | What the service does |
| --- | --- |
| `GET /{key}` | Finds an active mapping and returns `302` with `Location` and `Cache-Control: no-store`. Any user can call it. |
| `GET /v1/links/{key}` | Checks ownership and returns the link's details with `200 OK`. |
| `DELETE /v1/links/{key}` | Checks ownership, disables the link, and returns `204 No Content`. Repeating the request for the same owned link also returns `204`. |

The service returns an error code that matches the problem:

| Condition | Response |
| --- | --- |
| Input is invalid or the alias is reserved | `400 Bad Request` |
| Creation or management request has missing or invalid credentials | `401 Unauthorized` |
| User tries to manage another owner's link | `404 Not Found`, so the response does not disclose ownership details |
| Custom alias is already in use, including by a disabled link | `409 Conflict` |
| User exceeds the allowed request rate or quota | `429 Too Many Requests` |
| Public lookup cannot find the key | `404 Not Found` |
| Public lookup finds an expired or disabled link | `410 Gone` |
| Public redirect request uses a method other than GET | `405 Method Not Allowed` |
| Service cannot complete a required database lookup | `503 Service Unavailable` |

A failed database request does not prove that the key is missing. The service
must return `503` rather than an incorrect `404` in that case.

## Model and key generation

The database stores generated keys and custom aliases in the same table. This
lets it check uniqueness across both types rather than checking them separately.

```text
links(
  key PRIMARY KEY, owner_id, destination,
  created_at, expires_at NULL, revoked_at NULL
)
```

The fields have the following roles:

| Field | Purpose |
| --- | --- |
| `key` | Identifies the mapping. `PRIMARY KEY` tells the database to reject duplicate values and provides an index for lookups. |
| `owner_id` | Identifies the user allowed to view management details or disable the link. |
| `destination` | Stores the original URL. This design does not allow it to change after creation. |
| `created_at` | Records when the service created the mapping. |
| `expires_at` | Records when the link expires; `NULL` means no expiration was set. |
| `revoked_at` | Records when the owner disabled the link; `NULL` means it has not been disabled. |

The service keeps the key reserved after the link expires or is disabled.

**Choose and enforce a naming policy**

The service needs clear rules for valid keys. The following rules are choices for
this design, not requirements that every URL shortener must use:

- Keys contain 3-32 characters from `A-Z`, `a-z`, `0-9`, `_`, and `-`.
- Keys are case-sensitive: `Guide` and `guide` identify different mappings.
- The service rejects slashes, unclear URL encodings, and characters outside this set.
- The service reserves its own paths, such as `v1`, `health`, `metrics`, `admin`,
  and `assets`. Users cannot claim these names, even with different capitalization.

The application and database must use the same case-sensitive comparison. If
they disagree, a key could pass one check and resolve differently in another.
Apply the naming rules to generated keys as well as custom aliases, and reserve
new service paths before users can claim them.

**Generate a key and handle duplicates**

For automatically generated keys, the service selects eight random characters
from `A-Z`, `a-z`, and `0-9`. This set has 62 characters, so it is called
**base62**. Use a cryptographically secure random generator that selects each
character with equal probability.

The service then tries to save the mapping. If the database reports that the key
already exists, the service generates another key and tries again. A generated
key can conflict with another generated key or with a custom alias.

| Database result | Generated key | Custom alias |
| --- | --- | --- |
| Mapping saved | Return `201`. | Return `201`. |
| Key already exists, even if its link is disabled | Generate another key and retry, up to a configured limit. | Return `409`; ask the user to choose another alias. |
| Generated keys keep conflicting until the retry limit is reached | Return `503` and alert the operator. | Not applicable. |

The service must let the database check uniqueness while inserting the mapping.
Checking availability first is not enough: two requests could both see the same
alias as available before either saves it. The database must accept only one
insert and reject the other without overwriting the existing mapping.

??? info "Why check duplicates if there are so many possible keys?"
    Eight base62 characters provide `62^8 = 218,340,105,584,896` possible keys.
    If 36.5 million keys in this space are already occupied, the chance that the
    next generated candidate is occupied is approximately
    `36,500,000 / 218,340,105,584,896 = 0.000000167`.

    This is a small chance for one attempt, but the service makes many attempts
    over time. Random generation does not guarantee uniqueness. Custom aliases
    that match the eight-character format occupy this space too.

## Architecture and flows

When many users open the same short URL, reading the database for every request
repeats the same work. The service can store a temporary copy of the mapping in
a cache and use it for later requests.

If the cache contains a usable copy, the lookup is a **cache hit**. If it does
not, the lookup is a **cache miss**, and the service reads the database. Both
generated keys and custom aliases use this same flow.

```text
Owner -- create/disable --> Service -----------------> Database
                              |
                              +-- remove old copy --> Cache

User -- GET /key --> Service --> Cache
                       |
                       +-- if missing --> Database
                       |
                       +-- 302 + Location --> User's browser --> Original website
```

### Create a short URL

The service checks who the caller is and whether they can create another link.
It then validates the original URL and custom alias, if one was provided. The
service generates a key when needed and asks the database to save the mapping.

Only after the database confirms the save does the service return `201`. If the
service also adds the new mapping to the cache, it must do so after this
confirmation. Otherwise, the cache could expose a link whose database save failed.

### Open a short URL

The service extracts the key and checks the cache. If it finds a copy that is
still valid, it returns the redirect. Otherwise, it reads the database and checks
whether the link exists, has expired, or has been disabled.

If the database returns an active mapping, the service can cache it for later
requests. The cache's **time to live (TTL)** is how long the saved copy may be
reused. It is separate from the link's expiration: a link can remain active for
months while each cached copy lasts only seconds.

This design allows cached copies to be reused for at most 30 seconds. If the
link expires sooner, the service must stop using the copy at that earlier time.
The service checks both limits before returning a cached redirect.

### Disable a short URL

The service checks that the caller owns the link, saves the disable time in
`revoked_at`, and removes the cached copy. It then confirms the request to the owner.

Removing the copy is called **cache invalidation**. If it fails, another request
may still find the old copy. A request that started earlier may also save an old
database result back into the cache after invalidation. The 30-second reuse
limit prevents these copies from being used indefinitely.

??? info "How do we keep a delayed cache write from extending the 30-second limit?"
    Start the copy's 30-second deadline when its database lookup begins, not
    when the result is eventually written to the cache. If the lookup takes
    five seconds, the copy has at most 25 seconds left, not another 30.

    Skip the cache write if the deadline has already passed. Check the deadline
    when reading the copy, and account for differences between server clocks
    when servers share timestamps.

    Read cache misses from the primary database, the database receiving writes.
    Reading from a delayed database copy could return an older mapping and
    extend the time for which a disabled link remains usable.

## Decisions and failures

The introduction describes both `301` and `302`. This design uses `302` because
owners can disable links. A browser that saves a permanent redirect may open the
destination later without checking the shortener again.

The service also sends `Cache-Control: no-store` so compliant browsers and
intermediate caches do not store the redirect response. This header controls
HTTP response caching; it does not prevent the service from caching mappings
internally. Neither status code can recall a redirect the user has already followed.

| Choice or failure | Response and limit |
| --- | --- |
| Links must stop working immediately after being disabled | Check the primary database for each redirect instead of trusting a cached copy. This increases database traffic; requests already being processed also need a defined policy. |
| Cache is unavailable | Allow only a limited number of requests to fall back to the database. Return `503` for excess requests rather than overload the database. |
| A popular mapping expires from the cache | Share one in-progress database lookup among waiting requests for that key. Vary cache lifetimes slightly downward to avoid many keys expiring together. |
| Database is unavailable | Use only cached active mappings whose deadlines have not passed. Return `503` when no valid cached copy is available. |
| Database saved a new link, but the creation response was lost | A repeated request may create a second generated link or receive `409` for the same custom alias. |

If callers need to retry creation without creating another link, let them send
an **idempotency key**, a value identifying one creation request. The service
saves that key and the result in the same database transaction as the mapping,
so all records are saved together or none are saved. For the same caller and
request payload, a retry returns the saved result. Reusing the key with different
input must be rejected.

A custom alias alone does not provide this behavior. Its conflict response does
not establish whether the same caller previously created the same mapping.
The public redirect operation here accepts only `GET`. A different API that
must preserve the caller's HTTP method during a temporary redirect can consider
`307` instead of `302`.

## Security

The service must validate the original URL before saving it or putting it in a
`Location` header. Use a URL parsing library to require a complete `http` or
`https` URL with a hostname. Reject embedded usernames and passwords, control
characters, invalid encodings, and input exceeding the chosen length limit.
Use an HTTP library to build the response so user input cannot add response headers.

This design also rejects obvious local hostnames and private or loopback IP
addresses. These checks do not prove that a destination will always be public:
the address returned for a hostname can change.

The service does not fetch the original page itself. If we add page previews,
the service would make requests on the user's behalf. An attacker could then
try to make it contact internal services. This is called **server-side request
forgery (SSRF)**, and it needs separate controls, including checking destinations
reached through further redirects.

Opening a short URL is public, but managing it is not. The service must check
ownership before returning management details or disabling a link. Knowing or
guessing the key must not grant those permissions.

Additional controls protect the service and its users:

- Limit creation requests and attempts to guess keys, so one user cannot consume all capacity.
- Limit custom alias claims and reserve service names to reduce name squatting and impersonation.
- Provide abuse reporting and a way to disable malicious links. An HTTPS destination can still be a phishing site.
- Remove credentials and sensitive URL query values from logs. Shortening a URL does not hide its destination from users who follow it.

## Metrics and exercise

The service needs measurements that show whether it meets the targets and
whether its failure controls work.

| Measurement | What it helps us check |
| --- | --- |
| Redirect p95 and p99 latency | How quickly 95% and 99% of measured redirect requests finish. |
| Service error rate | How often the service fails to process a request. Count expected `404` and `410` responses separately. |
| Cache hit ratio | What share of lookups the cache answers without a database read. |
| Database traffic during cache failure | Whether fallback limits protect the database when the cache is unavailable. |
| Generated-key retries and custom-alias conflicts | Whether random generation is behaving normally and how often users request occupied aliases. Track these separately. |
| Failed invalidations and measured disable delay | Whether disabled links stop redirecting within the target window. |

**Exercise:** two users request `system-design` at the same time. After one user
creates the link, that owner disables it just after its mapping enters the cache.
Can the other user now claim the alias? Can an existing cached copy still redirect?

??? success "Answer guidance"
    The database accepts one insert and rejects the other with `409`. The service
    keeps the first mapping's key reserved after disabling the link, so the
    second user still cannot claim it.

    The service normally removes the cached copy when disabling the link.
    If that removal fails or an earlier read saves an old result afterward,
    requests can still use the copy until its deadline. Once the deadline passes,
    the service must stop using it. A redirect already followed cannot be recalled.

    If no new lookup may return the destination after revocation is confirmed,
    checking the database instead of the cache is necessary. Requests that
    began earlier still need a separate, explicit policy.

**Next:** [Notification service](notification-service.md) explains how a service
records work and retries requests to an external provider.

**Related:** [Distributed cache](distributed-cache.md) explains cache routing,
replicas, and how to limit database traffic when the cache fails.
