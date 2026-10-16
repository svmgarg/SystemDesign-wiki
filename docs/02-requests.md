# Networking & APIs

Networking carries requests and responses between a client and a service. An
**API (application programming interface)** defines what the client can ask the
service to do, what input it must send, and what the service returns. Clients need
this agreement to handle successful requests, errors, and missing responses.

Previous: [define the shop's requirements](01-thinking.md).

## Trace the journey

A browser uses **HTTP (Hypertext Transfer Protocol)** to request a resource and
receive a response. HTTP defines request methods, headers, response status codes,
and message bodies. **HTTPS** protects HTTP traffic with encryption and a check
of the server's identity.

To request `https://shop.example/products/p123`, the browser first finds the
network address for `shop.example`. It uses **DNS (Domain Name System)** to look
up that address. If it has a saved, unexpired answer, it can reuse it. DNS finds
the address, not the product. If the address changes, a saved answer may still
point to the old address until it expires.

```text
Client -- DNS lookup --> DNS server --> address
Client == secure connection ==> Reverse proxy --> App --> Database
Client <--- response ----------- Reverse proxy <-- App <-- result
```

For HTTPS using HTTP/1.1 or HTTP/2, the browser opens a **TCP (Transmission Control
Protocol)** connection. TCP delivers bytes reliably and in order. The browser and
server then set up **TLS (Transport Layer Security)** to encrypt the connection.
The browser checks that the server's certificate covers the requested hostname
and comes from a trusted issuer. This checks the server's identity; it does not
give the user permission to read an order.

The browser sends the HTTP request over the protected connection. In this design,
a **reverse proxy** receives it before the application. The proxy is a server
that forwards requests to the appropriate application instance. It can also reject
oversized requests and handle TLS for the application. If the proxy decrypts the
request, the proxy-to-application connection needs its own encryption configuration.

The application checks who the caller is (**authentication**) and what the caller
may access (**authorization**). It checks the input, asks the database for the
product, and returns the result through the proxy. If the application or database
fails, the request can fail even when the proxy is running.

**HTTP/3** uses a different connection setup. It uses QUIC, a secure transport
protocol built on **UDP (User Datagram Protocol)**, instead of TCP. QUIC includes
the TLS handshake as part of its setup rather than adding a separate TLS
connection after TCP.

If an existing connection is still usable, the client can send another request
without repeating DNS lookup and connection setup. HTTP/2 and HTTP/3 also let
several requests share a connection at the same time.

## Budget latency

**Latency** is the time an operation takes between a stated start and finish.
Here, the client measures from starting the DNS lookup to receiving the complete
response, excluding drawing the page. Assume no saved DNS answer or existing
connection, sequential stages, and no retries. The table assigns each part of the
elapsed time to one stage so that no time is counted twice.

| Stage | Time |
| --- | --- |
| DNS | 20 ms |
| TCP and TLS setup | 60 ms |
| Request transit and proxy/app work, excluding database | 20 ms |
| Database | 40 ms |
| Response transfer | 10 ms |
| **Total** | **150 ms** |

The client waits `20 + 60 + 20 + 40 + 10 = 150 ms`. With a saved DNS answer and
an open connection, the same model gives `20 + 40 + 10 = 70 ms`. These are example
times, not fixed costs; network distance, congestion, and response size change them.

To describe many requests, measure the complete request's **p95 latency**: 95% of
the measured requests finish at or below that time. Do not add stage p95 values
to calculate it. The slowest DNS lookups and the slowest database calls may belong
to different requests. Record timings for each request to find where it waits.
If an application timing already includes a database call, do not add that
database time again.

## Define the API contract

An **API contract** states which paths and methods clients can use, who may call
them, which fields to send, and what the service returns. The examples use
**JSON (JavaScript Object Notation)**, a text format for objects, lists, and values.
The contract must explain what those fields mean and which values are allowed.

The client sends `GET` to read product `p123`. The service finds it and returns
`200 OK` with its data. `Accept` states the response format the client wants;
`Content-Type` states a body's format. These HTTP/1.1 excerpts omit some headers,
including authentication and body-length headers:

```http
GET /products/p123 HTTP/1.1
Host: shop.example
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{"id":"p123","name":"Notebook","price_minor":500,"currency":"USD"}
```

Here, `price_minor: 500` means USD 5.00. The service stores money as an integer
number of minor units to avoid binary floating-point rounding. The currency
determines the size of a minor unit. A `GET` request must not create an order or
charge a card; HTTP defines it as a safe read operation.

To create an order, the client sends `POST /orders` with the product and quantity.
The service checks the request, calculates the total from its own prices, and
saves the order. If it succeeds, it returns `201 Created`. The `Location` header
gives the path of the new order:

```http
POST /orders HTTP/1.1
Host: shop.example
Content-Type: application/json
Idempotency-Key: order-attempt-7f82

{"items":[{"product_id":"p123","quantity":2}]}

HTTP/1.1 201 Created
Location: /orders/o456
Content-Type: application/json

{"id":"o456","status":"created","total_minor":1000,"currency":"USD"}
```

Assume the user is signed in, stock is available, and no tax or shipping applies.
The service checks permissions, limits the item count and request size, and checks
that quantities are positive integers. If a check fails, it rejects the request
instead of saving the order. Valid JSON can still contain an invalid quantity.

The client sends `Idempotency-Key` so the service can recognize another attempt at
the same order. The service must implement the duplicate-request checks described
below; adding this header alone does not prevent duplicate orders.

The contract tells the client how to handle each error:

| Status | Meaning | Client response |
| --- | --- | --- |
| `400` | The input is invalid | Fix the input before sending it again |
| `401` | The request lacks valid authentication | Sign in or refresh credentials |
| `403` | The caller lacks permission | Do not repeat the same request unchanged |
| `404` | The resource was not found | Check the path and resource ID |
| `409` | The request conflicts with current state | Read the current state and resolve the conflict |
| `429` | The client has sent too many requests | Wait before trying again |
| `503` | The service is temporarily unavailable | Retry only if safe and enough time remains |

The service returns a stable error code for the client to check and a request ID
for finding the matching service logs. For example:
`{"error":{"code":"INVALID_QUANTITY","message":"quantity must be positive"},"request_id":"r123"}`.
The service should not return stack traces or database details. If revealing that
a resource exists would expose private information, it may return `404` instead
of `403`; the API contract should explain that policy.

## Handle timeouts

A client sets a **timeout** to limit how long it waits for an operation or phase.
It sets a **deadline** for the latest acceptable finish of the whole operation.
The service gives database and service calls only part of the remaining time,
leaving time to send its response. Giving every call a fresh full timeout can
exceed the client's deadline: three sequential 2-second waits can consume
6 seconds before retry delays.

!!! warning "Timeout ≠ rollback"
    If the client stops waiting, it does not know whether the service saved the
    order. The request may not have arrived, the service may still be working,
    or the service may have saved the order before the response was lost.
    A cancellation request may not stop the work and cannot undo a completed
    order or payment.

The client retries only failures that may clear and operations it can safely
repeat. It limits the number of attempts and stops when there is not enough time
left before the deadline. **Exponential backoff** increases the wait between
attempts; **jitter** adds a random variation so clients do not all retry together.
If the service sends `Retry-After`, the client waits as directed or stops if the
wait would exceed its deadline. Even a read retry adds work, so the client and
service should not both make independent chains of retries.

For writes, [idempotency](05-async.md) means repeated attempts produce no extra
business effect. The client uses the same key and input when it retries an order.
The service associates the key with that user and operation, records the input,
and allows only one attempt to create the order. For a local database change, it
saves the key, result, and order in one transaction, which saves all of them or
none of them. If the same request arrives again, the service returns the saved
result. If the client reuses the key with different input, the service rejects it.

The contract must say what the service returns while the first attempt is still
running and how long it keeps keys. If a key expires, another attempt may create
another order. A payment through another service needs that service's duplicate
checks too; a local database transaction cannot cover the remote payment.
The contract should provide a status lookup for uncertain outcomes. The client
checks status instead of sending a new key and risking a duplicate.

## Bound lists and evolve contracts

The client requests a small page of orders instead of the entire list:
`GET /orders?limit=20&after=opaque-cursor`. The service enforces a maximum page
size and returns a **cursor**, a value that identifies where the next page should
start. The client sends that value unchanged to get the next page.

The service sorts the orders consistently, for example by `(created_at, id)`,
using the ID to order entries with the same creation time. It checks that the
cursor matches the filters and user scope, and checks the user's permission on
every request. Possessing a cursor does not grant access to another user's orders.
If orders change between requests, later pages may change too. A cursor alone
does not provide a snapshot, which is a fixed view of the list at one point in time.

Old and new clients may use the service during the same deployment. If the service
adds an optional response field, old clients can keep working if they ignore
unknown fields. If it renames a field or changes its units or meaning, it can
break those clients. The contract must explain how clients should handle additions
and when they need to move to a new version.

## Exercise

1. The client has a saved DNS answer and an open connection. Using the table,
   how long does the request take? Can you add stage p95 values to find request p95?
2. The client sends `POST /orders` and stops waiting after one second. What are
   three possible outcomes? What must the client keep unchanged if it retries?
3. A user sends a cursor from another user's order list. What should the service
   check before it returns any orders?

??? success "Answer guidance"
    1. The request takes `20 + 40 + 10 = 70 ms` under the stated assumptions.
       Measure complete requests to find their p95; the stage p95 values may
       describe different requests.
    2. The request never arrived, the service is still working, or the service
       saved the order but the response was lost. The client keeps the same key
       and input and retries only within the key's lifetime and remaining time.
       If necessary, it checks status instead. It does not assume the order failed.
    3. The service checks that the cursor matches the user's scope and that the
       user may read the returned orders. TLS protects the connection; it does
       not give the user permission to read another user's data.

[Next: Storage →](03-storage.md)
