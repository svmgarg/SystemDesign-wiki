# Request Flows & Exercise

This page follows the requests handled by the [URL Shortener](index.md).
The user who creates a link is its owner. Other users can open an active link,
but only the owner can manage it.

Start with the application reading and writing the database directly. Caching
is an optional extension, covered after the basic flows.

## Create a short URL

1. The owner sends the original URL and, optionally, a custom alias.
2. The service checks the owner's identity, creation quota, and input.
3. If no alias was provided, the service generates a key.
4. The service asks the database to save the key, destination, and owner.
5. The database checks that the key is not already in use while saving it.
6. After the save succeeds, the service returns `201 Created` and the short URL.

If a generated key already exists, the service generates another and retries,
up to a configured limit. If a requested alias already exists, the service
returns `409 Conflict`. It must not substitute another alias or overwrite
the existing mapping.

Two requests can both check an alias and see that it is available. For that
reason, an earlier availability check is only a convenience. The database
must decide uniqueness when inserting the mapping.

See [API & data](api-and-data.md) for request fields and naming rules.

## Open a short URL

[![The browser opens a short URL, the service finds the mapping and returns a redirect, and the browser requests the original website.](assets/redirect.svg)](assets/redirect.svg)

1. The browser sends `GET /system-design` to the service.
2. The service extracts `system-design` and reads its mapping.
3. If the mapping is active, the service returns this response:

```http
HTTP/1.1 302 Found
Location: https://example.org/products/guide
Cache-Control: no-store
```

The browser reads `Location` and sends a new request to the original website.

The response tells the browser where to go; it does not contain the destination
page. If the key does not exist, the service returns `404 Not Found`. If the
link has expired or been disabled, it returns `410 Gone`.

If a required database lookup fails, the service returns `503 Service Unavailable`,
not `404`: failing to read a mapping does not prove that the mapping is absent.

## Disable a short URL

1. The owner sends `DELETE /v1/links/system-design`.
2. The service checks that the caller owns the mapping.
3. The database saves the disable time in `revoked_at`.
4. The service returns `204 No Content` after the save succeeds.

Disabling a link is also called **revocation**. A new database lookup finds
the disabled record and returns `410` instead of a redirect. The service keeps
the key reserved; another user cannot claim it after revocation or expiration.

This does not close a page already opened or recall a redirect already returned.
If the requirement covers requests already being processed, define how those
requests coordinate with revocation before promising immediate enforcement.

## What changes when a cache is added?

A cache keeps temporary copies of mappings. Before reading the database, the
service can use a cached copy whose reuse deadline has not passed.

When the owner disables a link, the service saves the database change and removes
the cached copy. If removal fails, or an earlier read puts an old copy back,
some requests can still receive a redirect until that copy's deadline.

For this example, cached copies may be reused for at most 30 seconds from the
start of their database lookup, and never beyond the link's expiration.
The [scaling page](scaling-and-failures.md#keep-revocation-bounded) explains
the conditions needed to maintain that bound.

## Conceptual exercise

**Required material:** this page and the [API contract](api-and-data.md).
You need only a written answer or diagram, not code or a running service.

Use these assumptions:

- Two different owners request the custom alias `system-design` at the same time.
- The winning mapping points to `https://example.org/products/guide`.
- The owner later disables the link. Requests discussed below start after confirmation.
- In the cached version, one old copy has 12 seconds left before its deadline.
  Invalidation fails, but the service checks the deadline on every cache hit.
- Ignore requests already in progress and assume the database is reachable.

**Tasks**

1. State what each creation request receives and explain why only one mapping is saved.
2. Write the active link's redirect response and explain what the browser does next.
3. Explain whether the losing owner can claim the alias after it is disabled.
4. Compare opening the disabled link with no cache and with the old cached copy.

**Completion criteria:** your answer identifies `201` versus `409`, the database
uniqueness check, `302` and `Location`, the no-reuse policy, and the difference
between the direct database result and the remaining 12-second cache window.

??? success "Check your answer"
    The database accepts one insert. That owner receives `201` and the short URL.
    The competing request receives `409`; the service does not overwrite the first row.

    While active, the link returns `302`, `Location: https://example.org/products/guide`,
    and `Cache-Control: no-store`. The browser then requests that destination.

    Revocation does not release the alias. The losing owner still receives `409`
    if they request it again.

    Without a cache, a new authoritative lookup finds the disabled record and
    returns `410`. With the old copy, the service may return redirects for the
    remaining 12 seconds. It must stop using the copy at its deadline and then
    return `410` from the database. A redirect already followed cannot be recalled.

[Next: API & data](api-and-data.md)
