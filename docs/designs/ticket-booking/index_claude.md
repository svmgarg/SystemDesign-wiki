# Ticket booking system

## The idea in one minute

A customer finds an event, holds seats, pays, and gets a ticket. One rule matters above all:

> Two confirmed bookings must never own the same seat for the same event.

Four choices keep that rule safe:

1. **PostgreSQL owns every seat.** Each hold and each booking is saved there.
2. **Redis is a fast helper.** It shows seat maps and turns away obvious clashes, but it never decides.
3. **Holds expire on their own.** After a set time (10 minutes in this example), unpaid seats go back on sale, judged by database time.
4. **If PostgreSQL is down, we stop.** We never sell from the cache.

A seat shown as available is not a promise. Another customer may take it before your request arrives. A **hold** is a temporary reservation that gives a customer time to pay. A **confirmed booking** is a permanent allocation saved in PostgreSQL after verified payment.

## Golden rules

Every other section follows from these six rules.

1. PostgreSQL decides ownership. Redis never does.
2. A hold takes all requested seats or none.
3. Deadlines use database time. A retry never extends a deadline.
4. Paying is not the same as getting a ticket. A ticket exists only after the database confirms the seats.
5. If payment arrives too late, issue no ticket. Record a refund task instead.
6. If PostgreSQL is unreachable, accept no new holds or confirmations.

## Scope and assumptions

**Included:** searching events, opening an event and its seat map, holding seats, paying, and confirming a booking.

**Not included:** event creation, booking-window policies, cancellations, resale, and multi-region writes.

- A **movie** is reusable descriptive information. An **event** is one showing at a venue and time. Two screenings of the same movie have different `event_id` values and separate seats.
- Each event has an optional `movie_id`, start and end times, a venue, and a `seat_count`. Seats are integers from `1` to `seat_count`.
- Customers sign in before holding seats.
- The server calculates price and currency and saves them with the booking. The client cannot choose the amount.
- Before sales open, an initialization step creates the seat rows in PostgreSQL. It can also preload Redis. A missing cache is never read as "all seats available".

## Architecture

```text
                      +--------------------+
   Search  ---------> | Elasticsearch      |   (search summaries only)
                      +--------------------+
                               ^
                               | indexing pipeline (may lag)
                      +--------------------+
   Open event ------> | MongoDB            |   (full event details)
                      +--------------------+

   Client --> Gateway --> Booking Service --> Redis       (quick check, never final)
                                  |
                                  +---------> PostgreSQL  (final say on seats)
                                  |
                                  +---------> Payment Service <--> Payment provider
```

| Component | Job |
| --- | --- |
| Client | Searches, shows a possibly out-of-date seat map, requests holds, and pays the provider. |
| Load balancer and gateway | Authenticate callers, limit request rates, and admit only the work the system can handle. |
| Search Service and Elasticsearch | Find event IDs and basic details. They never decide seat ownership. |
| Open Event API and MongoDB | Return full event details and combine them with a seat map. |
| Booking Service | Asks Redis for a quick check, runs the PostgreSQL hold transaction, and confirms bookings. |
| Redis | Caches seat state and rejects obvious competing requests. It is not the authority. |
| PostgreSQL | Owns seats, reservations, bookings, payments, and refund tasks. |
| Payment Service and provider | Create payment sessions, process verified results, and reconcile payments and refunds. |

These are logical roles. They do not need to be separate deployments. For example, the Open Event API can run inside the Search Service.

Metadata flows one way: MongoDB, then the indexing pipeline, then Elasticsearch. The index can lag behind. Seat holds never update Elasticsearch.

Normal traffic and Redis-outage traffic use the same database hold transaction. There is no "save to PostgreSQL later" step.

## How a booking works

Two IDs are used throughout. A **reservation ID** identifies one attempt to hold a set of seats. A **booking ID** identifies the purchase and stays the same through payment and confirmation.

### 1. Search

1. The client sends a title, location, or date filter.
2. The Search Service queries Elasticsearch and returns event IDs and basic details, not seat maps.

Results can be out of date. The Booking Service checks the current sales policy before accepting a hold.

### 2. Open an event

1. The client sends an `event_id`.
2. The Open Event API reads event details from MongoDB (or a bounded metadata cache) and the seat map from Redis.
3. If Redis is down or not ready, it reads PostgreSQL instead, under read limits.
4. Seats whose hold has expired are shown as available, using database time, even if no cleanup has run. See [What if a customer just leaves?](#what-if-a-customer-just-leaves) for the exact rule and query.

The map can be stale by the time the customer picks a seat. Only a successful hold reserves it.

### 3. Hold seats

1. The client sends `event_id`, the seat IDs, and an **idempotency key**. This key means a retry returns the saved result instead of creating a new hold.
2. If this operation already exists, return its saved result. The deadline does not change.
3. Otherwise, the Booking Service checks the seat IDs and policy, then asks Redis for a provisional hold on all seats or none.
4. If Redis reports a clash, reject the request cheaply. If Redis is down, skip this step under stricter limits.
5. The service then **always** runs the PostgreSQL hold transaction (see [Hold transaction](#hold-transaction)).
6. Only after a successful commit does the service answer "held". It copies the database expiry into Redis as the *remaining* time, not a fresh 10 minutes.

If PostgreSQL reports a seat conflict, release only the Redis keys that belong to this reservation ID. Never delete another customer's hold.

If the database call times out, the outcome is unknown. Look up the reservation ID or retry with the same idempotency key before telling the client anything.

### 4. Pay

1. Do not create a payment until the database hold succeeds.
2. The Payment Service saves a payment attempt, with a stable idempotency identity, before calling the provider. This prevents a second charge after a timeout or restart.
3. The client receives a payment session and pays the provider directly.

### 5. Confirm

1. The provider sends a signed server-to-server callback. The Payment Service checks the signature and payment status, checks the booking, amount, and currency, and ignores duplicates. The browser's "success" page is not proof.
2. If the booking is already confirmed, return it. This must work even after its holds were removed.
3. Otherwise, in one transaction: lock the booking and every seat row, check the hold is still valid, mark the booking confirmed, and allocate all seats. A unique `(event_id, seat_id)` allocation rule blocks any second owner.
4. After the commit, try to mark the seats `BOOKED` in Redis and remove the hold keys. If Redis fails, log it, leave evidence for repair, and still return the ticket. The database commit is what counts.

The client can check booking status while waiting for the callback. A pending callback is not a failed payment.

### 6. Expiry

Redis removes a hold key when its time runs out. PostgreSQL may still hold a row marked `HELD` with an expired deadline. Reads treat it as available, and a new transaction can replace it after checking database time. A cleanup job can tidy old rows, but correctness does not depend on it. Starting a payment or retrying a request never extends the deadline.

### What if a customer just leaves?

**The case:** a customer holds seats, then closes the app, loses connection, or walks away without paying.

**How it is handled:** nothing has to happen at that moment. The hold already carries its own deadline (`reserved_until`) in PostgreSQL, and every later read or write checks it against database time. There is no timer to fire, no message to deliver, and no job whose failure could leave seats stuck.

- **Before the deadline:** other customers see the seats as `HELD`, and any hold request for them is rejected.
- **After the deadline:** the hold is ignored. The seats show as available, and the next hold transaction replaces the old hold with the new reservation. The old reservation's history is kept separately.

#### If the customer comes back

| Situation | What happens |
| --- | --- |
| Back before the deadline, retries the same hold request | The saved result is returned with the same deadline. A retry never extends it. |
| Back before the deadline, continues to pay | A payment session is created or recovered for the live hold. Payment and confirmation continue as normal. |
| Back after the deadline, seats are still free | The old hold is not revived or extended. The customer makes a new hold request, which gets a new deadline. |
| Back after the deadline, someone else now holds or owns a seat | The new hold request gets `409 Conflict`. The customer picks other seats. |

#### If they left in the middle of payment

The payment may still complete after the customer leaves. When the provider's signed callback arrives, the Payment Service resolves it in this order:

1. If the booking is already confirmed, return it. This also covers repeated callbacks.
2. If the hold is still live, confirm all seats in one transaction.
3. If the hold has expired, issue no ticket and save a refund task for the captured money. This applies even if another reservation now owns the seats.

Before deciding that a payment needs a refund, check the booking by its ID, because a timeout may have hidden a successful confirmation.

The confirmation step checks for a live matching reservation using database time. The wiki does not define a grace period for a payment that lands just after expiry while the seats are still free. Add one only as an explicit product decision.

If the customer never pays, no money moves and nothing needs refunding.

#### How each part cleans up

| Part | Cleanup |
| --- | --- |
| PostgreSQL | Nothing at expiry. Expired `HELD` rows are ignored when reading and replaced by the next hold. An optional cleanup job can tidy old rows, but correctness does not depend on it. |
| Redis | Hold keys expire on their own. If Redis is stale or missing, PostgreSQL still decides, and the reconciliation job repairs the cache. Expiry notifications are not durable, so they never drive booking correctness. |
| Payment | A session for an expired hold can't lead to a ticket. A late success becomes a refund task. |

#### How seat state is worked out

To build the seat map, PostgreSQL applies three rules in order:

1. If the seat has a confirmed booking, it is `BOOKED`.
2. Otherwise, if it is `HELD` and `reserved_until` is still in the future, it is `HELD`.
3. Otherwise it is `AVAILABLE`. This covers seats never held and seats whose hold expired.

Illustrative query (exact column names depend on your schema):

```sql
SELECT seat_id,
  CASE
    WHEN booking_id IS NOT NULL                    THEN 'BOOKED'
    WHEN status = 'HELD' AND reserved_until > now() THEN 'HELD'
    ELSE 'AVAILABLE'
  END AS state
FROM seat_inventory
WHERE event_id = 'E1';
```

This query only builds the seat map, which is a display. It can be a moment out of date. When a customer clicks "hold", the [hold transaction](#hold-transaction) repeats the same check on those seats while they are locked, using the database time at that moment. That check decides who gets the seat. Two people can both click the same seat on the map, but only one transaction succeeds.

### Late payment

Payment at the provider and confirmation in PostgreSQL are separate steps, so money can arrive after a hold expires. If another reservation now owns a seat, do not take it back. Issue no ticket, and save refund work for the captured money.

## When things go wrong

| Situation | What happens |
| --- | --- |
| Search index is behind | Allow stale results. Recheck policy and seats on the booking path. |
| MongoDB can't be read | Use a permitted metadata cache, or report unavailable. Never invent event details. |
| Redis is down, empty, or rebuilding | Skip the Redis check and read PostgreSQL under limits. |
| PostgreSQL is unreachable | Accept no holds or confirmations. Never let Redis act as a second authority. |
| Database reports a seat conflict | Acquire none. Remove only this reservation's Redis keys. |
| Database call times out | Look up the reservation or booking ID, or retry with the same key. Do not assume failure. |
| Provider order creation times out | Retry or query using the saved attempt and its provider idempotency identity. |
| Payment succeeds after expiry, or another owner won | No ticket. Save a refund task. |
| Redis update fails after a database commit | Return the ticket, log the error, repair Redis. |
| Callback is repeated | Return the committed booking. Never charge or allocate twice. |

### Redis repair and rebuild

The default is **commit to the database first, then update Redis on a best-effort basis**. A Redis error must show up in logs and metrics.

A repeatable **reconciliation** job compares Redis with PostgreSQL and fixes missing or stale entries. It must find problems even if the app crashed between the commit and the cache update, so an in-memory retry list is not enough. An optional **transactional outbox** saves a cache-refresh task in PostgreSQL in the same transaction as the booking, and a worker retries it until done.

A stale Redis can show a sold seat as free or grant a misleading provisional hold. The database rejects the real hold, and no payment session is created for it.

To rebuild a cache:

1. Mark the event's cache not ready. Serve reads from PostgreSQL under limits.
2. Load confirmed allocations **and** unexpired holds. Loading only sold seats would hide customers who are still paying.
3. Restore hold keys using the remaining time from the database.
4. Apply concurrent changes with a tested version or conditional-write protocol, or keep serving from the database until the rebuild catches up.
5. Mark the cache ready only when it is safe to serve. Keep reconciling.

A snapshot alone does not solve writes that race with a rebuild.

### Payments and refunds

- Save each payment attempt before relying on provider results. Store provider IDs, booking identity, expected amount and currency, and verified results.
- Deduplicate both provider payment IDs and callback event IDs.
- Callbacks can be late, repeated, out of order, or missing. Acknowledge a callback only after its result or required work is saved. A periodic job should query the provider to find payments whose callback never arrived.
- For captured money without a valid booking, save a refund task. A worker retries it using a stable refund idempotency key, and checks unknown outcomes before retrying. Track failed or slow refunds for a person to review. "Refund pending" is not "refund completed".
- Before deciding a payment needs a refund, resolve any unknown commit by booking ID. A timeout may have hidden a successful booking.

## API

These contracts are examples, not a runnable application. Customer endpoints require sign-in and ownership checks. Provider callbacks use provider authentication.

| Request | Purpose |
| --- | --- |
| `GET /v1/events?query=...&date=...` | Search event summaries, with pagination. No seat maps. |
| `GET /v1/events/E1` | Event details and a possibly stale seat map, with the time it was read and hold deadlines. |
| `POST /v1/reservations` | Hold all selected seats once the database transaction commits. |
| `POST /v1/bookings/B1/payment-sessions` | Create or recover a provider session for this customer's live hold. |
| `GET /v1/bookings/B1` | Booking status, seat IDs, and separate payment and refund status. |
| `POST /v1/payments/provider-callback` | Verify a provider result, then save and process it once. |

Example hold request:

```http
POST /v1/reservations
Authorization: Bearer <access-token>
Idempotency-Key: reserve-E1-attempt-42
Content-Type: application/json

{"event_id": "E1", "seat_ids": [2, 3]}
```

Example `201 Created` response:

```json
{
  "reservation_id": "R1",
  "booking_id": "B1",
  "event_id": "E1",
  "seat_ids": [2, 3],
  "status": "HELD",
  "reserved_until": "2026-10-18T12:10:00Z",
  "amount_minor": 5000,
  "currency": "INR"
}
```

`amount_minor` is in the currency's smallest unit, so 5000 means INR 50.00. It is not a suggested price. The server calculates it. Use UTC in responses and show local venue time in the UI.

**Status codes**

- `400` (or a policy error): empty list, duplicate or out-of-range seat IDs, or an event that can't be booked.
- `409`: a seat can't be acquired, or an idempotency key was reused with different contents.
- `429`: admission limits reached.
- `503`: the authority can't serve the request.

Do not report a database timeout as a seat conflict. Return a pending, retryable outcome and let the client look up the operation.

Save the idempotency key, caller, a fingerprint of the request, stable IDs, and the result in durable storage. Concurrent retries must lead to a single operation.

## Data

| Store or record | Key fields and rules |
| --- | --- |
| MongoDB movie and event | Movie details; event ID, optional movie ID, times, venue, `seat_count`. |
| Elasticsearch event document | Event ID and searchable summaries. Not seat availability. |
| PostgreSQL event inventory | Event ID, seat count, and sale-policy facts used to validate holds. |
| PostgreSQL seat inventory | One row per `(event_id, seat_id)` with `status`, `version`, `reservation_id`, `reserved_until`, and `booking_id` once sold. |
| Reservation and selected seats | Reservation ID, booking ID, customer, event, exact seats, deadline, and history. |
| Booking and allocations | Booking ID, customer, server-calculated amount and currency, state. A unique `(event_id, seat_id)` allocation prevents two confirmed owners. |
| Payment attempt | Attempt ID, booking ID, provider IDs, idempotency key, expected amount and currency, verified status, history. |
| Refund task | Refund ID, payment ID, reason, amount, retry state, provider reference, completion evidence. |

Use primary keys, foreign keys, and unique rules. A primary key alone does not stop code from overwriting a sold seat, so enforce legal state changes and allocation uniqueness inside transactions. Keep reservation and payment history separate when an expired seat row is reused.

Booking states (`HELD`, `CONFIRMED`, `EXPIRED`) describe ticket ownership. Payment states (`PENDING`, `SUCCEEDED`, `FAILED`) describe money. Refund work is `PENDING` or `COMPLETED`. A succeeded payment with an expired booking and a pending refund is a valid state that operations must be able to find.

### Hold transaction

This describes database behavior, not SQL to paste into an application.

```text
begin transaction
  find or create this caller's idempotent operation and stable IDs
  validate sale policy and the distinct, normalized seat set
  lock every selected seat row in increasing seat_id order
  read one database timestamp after the locks are held
  require all requested rows to exist
  require each seat is AVAILABLE, or HELD with reserved_until <= timestamp
  require no seat has a confirmed allocation
  if any check fails: roll back everything
  otherwise:
    save reservation, booking, price, and selected seats
    set every selected row to HELD with this reservation_id
    set one reserved_until = timestamp + hold duration
    increase each row's version and save the operation result
commit
```

- For an existing operation, return its recorded outcome. Do not create a new deadline.
- Reading the time after locks are held avoids deciding expiry with an old request timestamp.
- A fixed lock order reduces deadlocks. Retries must use the same idempotency identity.
- Conditional writes can replace explicit locks. Write only when status, owner, version, and expiry all match, check that every row changed, and roll back otherwise. "Read, compare in app code, then write" is unsafe.

**Confirmation** is a second transaction: return an existing confirmed booking first. Otherwise lock the booking and its seat rows, check the verified payment and the live matching reservation using database time, insert the unique allocations, and mark the seats and booking confirmed. If any seat fails, commit no partial ticket.

### Redis seat data

Redis holds a copy, not the only record:

```text
Hash key:      event:{E1}:seats
  field "2" -> AVAILABLE
  field "3" -> BOOKED

Expiring key:  hold:{E1}:2
  {"reservationId":"R1", "userId":"U1", "bookingId":"B1"}
  TTL = remaining PostgreSQL hold time after the database accepts the hold
```

- `BOOKED` wins over a hold. Otherwise an active hold shows `HELD`. Otherwise the seat counts as `AVAILABLE`, but only if the event's cache is initialized and ready. A missing cache triggers a database read or rebuild, never an empty map.
- Read the hash with `HGETALL` (small venues) or `HMGET`, and hold keys with batched `MGET`. Avoid one network call per seat.
- A Redis **Lua script** checks sold seats and competing holds, then creates all provisional keys or none. The `{E1}` hash tag keeps an event's keys in one cluster slot so the script can use them together. Retries and cleanup must compare `reservationId` and never delete a key owned by someone else.
- Before database acceptance, use a short provisional TTL. After acceptance, match the remaining database time. Redis and database clocks can differ, so the database deadline always wins. Expiry notifications are not durable and must not drive booking correctness.
- Cache refreshes and rebuilds need a version or epoch check, so an old snapshot cannot overwrite a newer sold marker, erase a newer hold, or bring back an expired owner. Design and test this. A blind `SET` does not solve it.

## Handling load

A popular event creates two kinds of load: many people reading the seat map, and many people competing for the same few seats. Competing writes cause **contention**, where requests wait for the same protected data.

More app instances help with independent requests. They do not let one seat be sold twice, and they do not remove the database lock on that seat.

- Use gateway rate limits, bounded concurrent work, and a **waiting room** that lets customers in gradually during extreme bursts.
- Redis absorbs repeated seat reads and rejects many competing holds. **Every accepted hold still reaches PostgreSQL**, and so does every confirmation. Size the database for holds and payment work, not just final sales.
- Cache event details and short-lived map snapshots. Snapshots must never extend a hold. **Request coalescing** lets one refresh serve many identical waiting requests, so a cache miss does not flood the database.
- Cache seats only for events that are open for sale. Keep them through sales and payment reconciliation. Use pagination or sections for very large venues.
- Limit seats per request and transaction time. Watch lock waits, conflict rate, query time, and connection-pool use.
- Caps must cover fallback map reads as well as hold writes. During a full Redis outage, lower admissions so PostgreSQL stays usable. Some requests may wait or fail with retry guidance. Speed and availability can drop, but ownership stays correct.
- All of one event's Redis keys share a cluster slot, so adding Redis shards does not split one hot event.

Measure search, map reads, holds, and confirmations separately. This design makes no requests-per-second or latency claim without a workload test.

## Operations checklist

- **Alert on:** database errors, hold lock waits, fallback load, cache repair lag, failed cache updates, callback verification failures, and old pending payments or refunds.
- **Keep an audit trail** from reservation to booking to provider payment to refund, without logging credentials or payment secrets.
- **Test:** duplicate callbacks, overlapping seat requests, partial multi-seat conflicts, expiry while waiting for locks, and crashes around each commit.
- **Practice** Redis loss and rebuild during live traffic. Check that unexpired holds stay protected in PostgreSQL.
- **Test backups and recovery.** After a restore, reconcile payments with the provider before reopening admissions. Lost local history does not mean a customer was never charged.

The trade-off is deliberate: when the database is unavailable, stop accepting ownership changes rather than sell from an independent cache.

## Exercise: two requests and one delayed callback

Event `E1` has seats `1` to `5`. The hold lasts ten minutes. PostgreSQL enforces the rules above, and all deadlines use database time.

1. At 12:00, reservation `R1` holds seats `2` and `3`. Its database deadline is 12:10. Its Redis copy disappears at 12:02.
2. At 12:03, reservation `R2` requests seats `3` and `4` while Redis is down.
3. At 12:11, reservation `R3` acquires seats `2` and `3`.
4. At 12:12, a verified callback says `R1`'s payment succeeded.
5. `R3` pays. PostgreSQL confirms it, but the Redis update fails. The provider repeats `R3`'s callback.

For each step, write who owns seats `2`, `3`, and `4` in the database, whether a ticket can be issued, and what repair or refund work is needed.

<details>
<summary>Answer</summary>

| Step | Seat 2 | Seat 3 | Seat 4 | Ticket? | Repair or refund work |
| --- | --- | --- | --- | --- | --- |
| 1. 12:00 and 12:02 | `R1` (held) | `R1` (held) | Nobody | Not yet | Rebuild `R1`'s Redis copy from PostgreSQL. |
| 2. 12:03 | `R1` | `R1` | Nobody | None for `R2` | None. `R2` gets neither seat 3 nor seat 4, because the database rejects the whole request. |
| 3. 12:11 | `R3` (held) | `R3` (held) | Nobody | Not yet | None. `R1` expired at 12:10, so the database replaces it with `R3`. |
| 4. 12:12 | `R3` | `R3` | Nobody | None for `R1` | Save a refund task for `R1`'s captured money. |
| 5. `R3` pays, then the callback repeats | `R3` (confirmed) | `R3` (confirmed) | Nobody | Yes, for `R3` | Repair Redis from PostgreSQL. The repeated callback returns `R3`'s existing booking before it looks at the removed holds. |

A good answer explains three things without relying on Redis for ownership: all-or-none acquisition (step 2), deadline enforcement (steps 3 and 4), and callback replay (step 5).

</details>
