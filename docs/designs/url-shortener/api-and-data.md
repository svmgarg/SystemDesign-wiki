# API & Data

The [URL Shortener](index.md) uses one creation endpoint for generated keys and
custom aliases. The service stores both in the same table, so the database can
prevent either type from claiming a key already in use.

The examples are HTTP excerpts. Replace the access-token placeholder when
implementing a client; the wiki does not provide a running API.

## Create a link

The client sends the original URL as `destination`. If it omits `alias`, the
service generates the key. `expires_at` is a future UTC timestamp, or `null`
when no expiration is requested.

```http
POST /v1/links HTTP/1.1
Host: short.example
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "destination": "https://example.org/products/guide",
  "expires_at": null
}
```

After saving the mapping, the service returns:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "key": "aB7q2X9m",
  "short_url": "https://short.example/aB7q2X9m"
}
```

To choose an alias, the client sends this body to the same endpoint:

```json
{
  "destination": "https://example.org/products/guide",
  "alias": "system-design",
  "expires_at": null
}
```

If the alias is available, the response contains `"key": "system-design"` and
`"short_url": "https://short.example/system-design"`. If the alias is already
used, the service returns `409 Conflict` rather than choosing another name.

## Open, inspect, or disable a link

| Request | Access | Successful response |
| --- | --- | --- |
| `GET /{key}` | Public | `302` with the original URL in `Location` and `Cache-Control: no-store` |
| `GET /v1/links/{key}` | Owner only | `200` with link details |
| `DELETE /v1/links/{key}` | Owner only | `204` after disabling; repeated deletion of the same owned mapping also returns `204` |

The [request flows](request-flows.md) explain what happens before each response.

| Condition | Response |
| --- | --- |
| Invalid URL, invalid alias, or reserved alias | `400 Bad Request` |
| Missing or invalid credentials for creation or management | `401 Unauthorized` |
| Request to manage another owner's link | `404 Not Found`, to avoid disclosing its management details |
| Custom alias already used, including by an expired or disabled link | `409 Conflict` |
| Creation quota or request-rate limit exceeded | `429 Too Many Requests` |
| Public lookup finds no mapping | `404 Not Found` |
| Public lookup finds an expired or disabled mapping | `410 Gone` |
| Public redirect request uses a method other than GET | `405 Method Not Allowed` |
| Required storage operation cannot complete | `503 Service Unavailable` |

## Store the mapping

This is a conceptual data model, not executable database DDL:

```text
links(
  key PRIMARY KEY, owner_id, destination,
  created_at, expires_at NULL, revoked_at NULL
)
```

| Field | What the service saves |
| --- | --- |
| `key` | The generated identifier or custom alias; the database rejects duplicate keys |
| `owner_id` | The user permitted to manage this link |
| `destination` | The original URL; it does not change after creation in this design |
| `created_at` | The creation time |
| `expires_at` | The optional expiration time; `NULL` means none was set |
| `revoked_at` | The disable time; `NULL` means the owner has not disabled the link |

The primary key also provides an index for key lookups. Keep the record after
expiration or revocation so its key cannot point to another user's destination.

## Validate keys and aliases

The following naming policy is a choice for this example:

- Accept 3-32 characters from `A-Z`, `a-z`, `0-9`, `_`, and `-`.
- Treat `Guide` and `guide` as different keys in both the application and database.
- Reject slashes, ambiguous URL encodings, and characters outside this set.
- Reserve service paths such as `v1`, `health`, `metrics`, `admin`, and `assets`,
  including different capitalizations. A reserved name is not available to a user.

Apply the same rules to every insertion path. Reserve new operational paths
before allowing users to claim them.

For generated keys, select eight characters from the 62-character set
`A-Z`, `a-z`, and `0-9`. Use a cryptographically secure random generator with
equal selection probability. This character set is commonly called base62.

Random generation does not guarantee uniqueness. The service tries to insert
the mapping, and the database checks the key while saving:

| Insert result | Generated key | Custom alias |
| --- | --- | --- |
| Saved | Return `201`. | Return `201`. |
| Duplicate key | Generate another key and retry up to a configured limit. | Return `409`; do not rename. |
| Generated retries exhausted | Return `503` and alert the operator. | Not applicable. |

An earlier availability check cannot reserve an alias. Two callers can both
pass that check; the database must accept at most one conflicting insert.

## Validate destinations and ownership

Use a URL parser to require a complete `http` or `https` URL with a hostname.
Reject embedded credentials, control characters, invalid encodings, and values
above the selected length limit. Build `Location` with an HTTP library so input
cannot introduce extra headers.

This design rejects obvious local hostnames and private or loopback IP addresses.
Those checks cannot prove that a host remains public; hostname resolution can change.
The service does not fetch destination pages. Adding previews would require
separate protection against server-side request forgery, where an attacker
makes the service contact internal resources.

Check ownership for management requests. Neither a random key nor a custom
alias is an access-control mechanism. Limit creation, alias claims, and attempts
to guess keys; provide abuse reporting and takedowns. Keep credentials and
sensitive destination query values out of logs.

[Next: Scaling & failures](scaling-and-failures.md)
