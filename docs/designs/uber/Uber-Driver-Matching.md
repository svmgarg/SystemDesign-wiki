# Uber Driver Matching - Consolidated Design

This document captures detailed matching mechanics. The current architecture,
quote flow, and booking design are in [Uber-System-Design.md](Uber-System-Design.md).

Temporarily reserve a driver before sending an offer, then confirm the durable
assignment on acceptance. The current baseline uses WebSocket offer responses,
one atomic Redis status-check-and-reservation call, and a fresh candidate search
after each failed offer instead of a persisted candidate cursor.

## 1. Goal and scope

Find a nearby eligible driver, send a ride offer, and safely retry when the driver declines, does not respond, or cannot receive the offer.

The initial design uses:

- One active offer per ride.
- One active offer per driver during normal dispatch, coordinated using a short Redis reservation lease.
- A 10-second response window per offer.
- Bounded matching: stop after 2 minutes or 10 offers, whichever comes first.
- Durable database safeguards against double assignment, even if Redis leases expire or are lost.

These timings and limits are initial policy choices, not fixed platform requirements.

## 2. High-level architecture

```text
Rider App                          Driver App
    |                                  |
    +------ Load Balancer / API Gateway-+
                   |
         +---------+----------+
         |                    |
    REST Services      WebSocket Gateways
         |                    |
         +---------+----------+
                   |
       Ride / Matching / Offer Delivery Services
                   |
         +---------+----------+
         |                    |
       Redis            Primary Database
  Locations, search,    Rides, offers, assignments,
  leases, routing       matching progress, outbox
                   |
         Durable Task / Event Infrastructure
         Matching attempts, delivery, deadlines
```

The WebSocket gateway owns connections and message routing, not matching business logic. Rider and driver apps connect to gateways; they do not need a direct WebSocket connection to each other.

| Component | Responsibility |
|---|---|
| Rider App | Request estimates, book, cancel, and track rides |
| Driver App | Send GPS updates, receive offers, and submit responses |
| Load Balancer / API Gateway | Route REST traffic and WebSocket handshakes |
| Ride Service | Own durable ride state, cancellation, and recovery APIs |
| Matching Service | Discover candidates, coordinate reservations, and advance offer attempts |
| Location Ingestion | Validate GPS updates and update driver location and freshness |
| Offer Delivery | Route offer messages to the driver's current gateway |
| WebSocket Gateway Cluster | Maintain connections and deliver real-time messages |
| Redis | Serve live locations, geographic queries, leases, and ephemeral routing |
| Primary Database | Persist rides, offers, and confirmed assignments |

## 3. Interfaces

| Operation | Interface |
|---|---|
| Fare estimate | REST |
| Book a ride | REST |
| Ride details and history | REST |
| Cancel a ride | REST |
| Driver GPS updates, initially every 5 seconds | WebSocket |
| Receive ride offers | WebSocket |
| Accept or decline an offer | WebSocket commands referencing offerId, forwarded to the authoritative handler |
| Assignment notifications and live tracking | WebSocket |
| Recover ride and pending-offer state after reconnect | REST |

WebSockets provide real-time delivery. They do not replace durable state, command validation, or recovery.

REST is appropriate for explicit resource operations and state recovery. WebSockets support persistent bidirectional traffic and server-initiated updates. Whichever offer-command transport is chosen must invoke the same authoritative validation and assignment logic.

## 4. Durable data model

Keep the booking and individual offers separate.

### Ride

```text
rideId
riderId
pickup
destination
status: MATCHING | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED | NO_DRIVER_FOUND
matchingDeadline
maxOffers
offersAttempted
activeOfferId
assignedDriverId
version
```

### RideOffer

```text
offerId
rideId
driverId
status: PENDING | ACCEPTED | DECLINED | EXPIRED | DELIVERY_FAILED | CANCELLED
createdAt
expiresAt
```

An offer is not an assignment. Persist confirmed assignments in the primary database, with constraints enforcing at most one active assignment per driver and per ride.

Persist enough matching progress to recover after a crash. Do not keep the only copy in a worker's memory.

## 5. Driver locations and availability in Redis

### Storage approaches considered

These are alternative data layouts, not a requirement for separate Redis deployments:

| Approach | Location and availability lookup |
|---|---|
| Standard Redis GEO | Store driver IDs and coordinates in a GEO index; read status separately |
| GEO plus driver hashes | Search nearby IDs, then batch-read and filter their availability and freshness |
| Available-only GEO index | Keep only eligible available drivers in the geographic index; maintain membership as availability changes |
| Redis Search | Index driver hashes or JSON documents with GEO, status, and freshness fields and query them together |

The preferred direction is a combined location-and-status query using Redis Search, with separate short-lived reservation keys. Standard GEO queries return members and optional geographic metadata, not full driver documents.

### Preferred combined-query example

Use Redis 8 with Redis Search available for combined geographic and status queries. Standard Redis GEO alone cannot filter arbitrary status fields.

Store each driver as a hash:

```text
driver:{123}:state
  location = "77.5946,12.9716"
  status = "FREE"
  lastSeen = 1792776000
```

Coordinates are longitude,latitude. The example timestamps below are illustrative.

Create the search index once:

```redis
FT.CREATE idx:drivers ON HASH PREFIX 1 driver: SCHEMA location GEO status TAG lastSeen NUMERIC
```

Store sample drivers:

```redis
HSET driver:{123}:state location "77.5946,12.9716" status "FREE" lastSeen 1792776000
HSET driver:{124}:state location "77.5950,12.9720" status "INRIDE" lastSeen 1792776000
HSET driver:{125}:state location "77.5960,12.9730" status "FREE" lastSeen 1792775900
```

Find up to 50 free drivers within 3 km whose locations are no older than 15 seconds, assuming the current time is 1792776000:

```redis
FT.SEARCH idx:drivers '@location:[77.5946 12.9716 3 km] @status:{FREE} @lastSeen:[1792775985 +inf]' RETURN 3 location status lastSeen LIMIT 0 50 DIALECT 2
```

This returns candidates, not reservations. The query does not automatically return the nearest 50 or rank drivers by road travel time. At scale, use an explicit distance-ordering strategy, geographic expansion, or sufficient candidate coverage before road-ETA ranking.

Update GPS without overwriting availability:

```redis
HSET driver:{123}:state location "77.5952,12.9723" lastSeen 1792776005
```

Update status when appropriate:

```redis
HSET driver:{123}:state status "INRIDE"
```

Redis Search updates the index automatically. Index both location and status to query both; index lastSeen for freshness filtering.

At N online drivers reporting every 5 seconds:

```text
location updates per second = N / 5
100,000 online drivers = 20,000 updates per second
```

### Geohashing intuition

Geohashing repeatedly subdivides longitude and latitude ranges and encodes the resulting cell. Longer codes represent smaller geographic cells.

Nearby searches must include neighboring cells: two nearby points can be on opposite sides of a cell boundary. Candidate retrieval is followed by actual distance checks.

Standard Redis GEO uses a 52-bit geohash-based sorted-set score. Redis Search exposes a GEO field; do not assume its internals are identical to standard Redis GEO. Applications provide coordinates rather than generating geohashes themselves.

Geographic distance shortlists candidates. Estimated road travel time is the better final ranking signal.

## 6. Temporary driver reservations

Use a separate reservation key in the same Redis deployment:

```text
driver:{123}:lease
  value = offer-501
  TTL = 10 seconds
```

The basic lease primitive is:

```redis
SET driver:{123}:lease offer-501 NX EX 10
```

- NX succeeds only if no reservation currently exists.
- EX 10 expires the reservation after 10 seconds.
- The offer ID identifies the reservation owner.

Do not use that SET alone as the full reservation operation. An old candidate
list can contain a driver who is now INRIDE, even after their old lease expires.
Check current status and acquire the lease in a single atomic script:

```lua
if redis.call("HGET", KEYS[1], "status") ~= "FREE" then
    return 0
end

local acquired = redis.call(
    "SET", KEYS[2], ARGV[1], "NX", "PX", ARGV[2]
)

if acquired then return 1 end
return 0
```

```text
KEYS[1] = driver:{123}:state
KEYS[2] = driver:{123}:lease
ARGV[1] = offer-501
ARGV[2] = 10000
```

The server chooses a positive TTL no longer than the remaining matching time.
This is one network invocation per reservation attempt, not a status-read call
followed by a lease-write call. Both keys share the {123} hash tag for Redis
Cluster. Two matching requests may discover the same driver, but only one
acquires the current lease. Missing driver state or a non-FREE status fails closed.

The location document can remain FREE while this lease exists. Here, FREE means not assigned or otherwise unavailable; the lease separately controls eligibility for a new offer.

There is no need to join reservation keys into the geographic query:

```text
Search a candidate batch
    -> try reserving the best candidate
    -> reservation fails: try the next candidate
    -> reservation succeeds: create and deliver its offer
```

This can return already-reserved candidates, especially during demand spikes. Fetch more candidates or expand the search when necessary. An available-only index is a possible later optimization, but it introduces synchronization and recovery work.

Never put the offer TTL on the location hash: that would delete the driver's location instead of only releasing their reservation.

### Safe release

Delete the reservation only if it still belongs to the relevant offer. Perform the comparison and deletion atomically:

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
return 0
```

Example:

```redis
EVAL 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end return 0' 1 driver:{123}:lease offer-501
```

An old timeout or decline must never delete a newer offer's reservation.

Redis reservations coordinate dispatch, not durable correctness. Expiry, failover, and delayed workers can invalidate assumptions about ownership. Database checks must still prevent double assignment.

## 7. End-to-end booking and matching

1. Rider requests a fare estimate and confirms booking.
2. Ride Service creates a durable MATCHING ride with its matching deadline and offer limit.
3. A matching task searches nearby FREE drivers with fresh locations.
4. Filter attempted drivers and rank suitable candidates using road ETA where available.
5. Check a candidate's location freshness and geographic eligibility.
6. Atomically check current FREE status and acquire its Redis reservation using a new offer ID.
7. If acquisition fails, immediately try another candidate. Do not wait for someone else's lease.
8. In a database transaction, recheck ride state and limits, ensure no active offer exists, create the PENDING offer, record activeOfferId, increment offersAttempted, and write outbox events.
9. If that transaction cannot create the offer, release only this attempt's reservation.
10. Deliver the offer through the WebSocket gateway and arrange durable timeout processing.
11. Acceptance confirms assignment; decline, expiry, or failed delivery advances matching safely.

Reservation acquisition and the database transaction are not one atomic operation. If a worker crashes between them, the unused lease expires. If publication fails after the database commits, the outbox enables recovery.

Set the offer deadline no later than both the lease deadline and matchingDeadline. Account for time already spent after acquiring the lease; do not grant another full 10 seconds after slow processing. Never deliver an already-expired offer.

Serialize or conditionally guard progress for each ride. Duplicate matching tasks must not create multiple active offers or increment the offer count twice.

## 8. Why use sequential offers?

There are two independent concurrency choices:

| Question | Initial choice |
|---|---|
| How many active offers can one driver receive? | One, coordinated by a reservation |
| How many drivers receive one ride's offer simultaneously? | One |

During a concert exit, sending many rides to the same nearby driver produces notification overload and repeated contention. Sending one ride to several drivers creates competing acceptances and withdrawn offers.

Sequential offers avoid these problems:

```text
Ride A -> reserves Driver 1 -> offer
Ride B -> skips Driver 1 -> reserves Driver 2 -> offer
Ride C -> skips reserved drivers -> reserves Driver 3 -> offer
```

Matching remains concurrent across rides. Only each ride's offer sequence is sequential.

The tradeoff is longer matching latency if several drivers do not respond. More sophisticated batching or limited parallel offers can be considered later if measurements justify them.

## 9. Waiting without blocking a server thread

A worker does not sleep for the offer's 10-second response window.

```text
Matching task:
    reserve driver
    persist offer and outbox events
    finish; worker is available for other work

Later:
    accept command -> acceptance handler
    decline command -> decline handler and next matching task
    deadline reached -> timeout handler and next matching task
```

Use durable delayed tasks or a worker scanning indexed pending-offer deadlines. Pending work lives in storage or a queue, not on a blocked thread.

Outbox processing or equivalent recovery must cover timeout scheduling as well as delivery. A crash between offer creation and scheduling must not leave the ride stuck.

Redis key-expiry notifications are not a reliable workflow queue. Lease expiry releases a reservation; timeout processing transitions the offer and advances the ride.

## 10. Acceptance and race handling

The driver sends a command over its authenticated WebSocket:

```json
{
  "type": "ACCEPT_OFFER",
  "offerId": "offer-501",
  "commandId": "command-789"
}
```

The gateway forwards this command to the Ride/Assignment handler. It does not
assign the ride itself. A REST endpoint could call the same handler if chosen as
an alternative transport. Authenticate the driver and verify they own the offer.
For a new acceptance, check reservation ownership as a dispatch guard and validate
the server-side deadline.

In one authoritative database transaction:

1. Check the offer is PENDING and unexpired.
2. Check the ride is MATCHING and activeOfferId matches this offer.
3. Check the driver is eligible and has no active assignment.
4. Claim the driver and ride using conditional updates, row locking, and appropriate uniqueness constraints.
5. Create the assignment, mark the offer ACCEPTED, update the ride, clear activeOfferId, and write notification outbox events.

Redis ownership checks and SQL writes are not atomic together. The database transaction and constraints are the final authority, not a prior Redis GET.

Redis owns live location and searchable availability; the database owns confirmed
assignments. A read of the Ride table followed by an unguarded write is not enough.
For example, ActiveAssignment can enforce driverId as its primary key and rideId
as a unique key. Equivalent constraints on active Ride rows are also possible.
Close active assignments transactionally at ride completion/cancellation and
retain durable history separately.

After commit, update Redis status to INRIDE before conditionally releasing the
lease. INRIDE includes the assigned driver's travel to pickup. The server owns
these writes, not the driver app. Use outbox-driven retries and reconciliation
against current database state, with per-driver ordering or versions so delayed
updates cannot overwrite newer assignments. Even if Redis temporarily reports
stale FREE state, another database assignment must fail safely.

Other rides may still have this driver in their previously fetched top-K batches.
No batch invalidation is required: their status-and-lease scripts reject INRIDE.
During the database-to-Redis synchronization gap, an extra offer may still be sent;
database constraints prevent it from becoming another confirmed assignment.

Acceptance and timeout compete to transition the same PENDING offer. Only one transition can succeed. A timeout already superseded by acceptance or decline is a no-op.

For duplicate acceptance after a successful commit, return the existing assignment to the same authorized driver, even if the original lease has since disappeared. Reject conflicting or expired acceptances explicitly.

Cancellation must similarly arbitrate against acceptance using durable conditional transitions and the defined ride-cancellation policy.

## 11. Declines, timeouts, and delivery failures

For decline or timeout:

1. Conditionally transition only the current PENDING offer to its terminal state.
2. Clear the ride's activeOfferId if it still references that offer.
3. Persist attempted-driver information and enqueue continuation through an outbox in the same transaction.
4. Conditionally release the matching reservation.

A timeout task must check the deadline before expiring the offer. Early tasks must be rescheduled; duplicate or late tasks must be harmless.

Timeout tasks do not need cancellation after acceptance. Checking durable offer
state makes them no-ops. As an optional fast path, Redis may cache a specific
offer's terminal state only after the database commits; the task can skip that
closed offer. PENDING, missing, or unavailable cache data falls back to the
database. Neither a missing lease nor cached PENDING authorizes a new offer.
Use a conditional database transition, not only a startup read, to arbitrate
acceptance against timeout without continuous polling.

WebSocket delivery acknowledgments mean the app received an offer, not that the driver accepted it. Delivery failures may trigger a bounded retry within the same deadline, or transition the offer to DELIVERY_FAILED and continue matching. Never extend the deadline merely because delivery was retried.

## 12. Simple retry baseline: search again

The initial design does not persist candidate lists or a next-candidate index.
Within one matching execution, try candidates from a freshly fetched batch:

```text
Candidates: D1, D2, D3, D4

D1 reservation fails -> try D2 immediately
D2 reservation succeeds -> persist and send its offer -> finish
D2 later declines or times out -> enqueue a new matching task
New matching task -> fetch fresh candidates, excluding attempted drivers
```

Before each offer, check eligibility and run the atomic status-and-lease script.
A candidate list is only a snapshot. A fresh search per failed offer costs
another Redis Search invocation but removes persisted cursor and stale-ranking
bookkeeping. Reusing recent batches can be an optimization later.

Task payloads contain rideId and, for timeouts, offerId. Durable activeOfferId
identifies the actual offer; candidate index minus one does not, because skipped
reservations never created offers. Reject stale task transitions when another
offer is active. Record state changes and continuation events transactionally.

### Attempted drivers

Track drivers already offered this ride:

```text
ride:501:attempted = {driver101, driver102}
```

Redis can cache this set, but durable RideOffer records are the recovery source.

- Declined or timed-out driver: exclude from subsequent offers for this ride.
- Reservation acquisition failed: skip for this batch; it does not count as an offer and the driver may become available later.
- Delivery failure: use a defined bounded retry policy; avoid repeatedly targeting an unreachable driver.
- Refreshed query: exclude already-attempted drivers in the matcher or through an appropriate query strategy.

Expire per-ride Redis caches after the matching/recovery retention period.

## 13. Bounded matching

Initial policy:

```text
matchingDeadline = booking time + 2 minutes
maxOffers = 10
offersAttempted = 0
```

Before every new offer, check:

- The ride is still MATCHING.
- There is no current active offer.
- The matching deadline has not passed.
- Fewer than maxOffers have been created.

Count committed offers, not candidates skipped because their reservations were unavailable. Deduplicate task retries so they cannot exceed the limit.

If a final allowed offer is still pending, let it resolve within its deadline; do not fail the ride simply because its creation reached maxOffers. Do not create another offer afterward.

When limits prevent further matching and no valid pending offer remains, conditionally mark the ride NO_DRIVER_FOUND and notify the rider.

An overall deadline processor must also handle rides with no active offer, such as rides waiting for a fresh candidate search. Exhausting one candidate batch alone does not mean the matching policy is exhausted.

NO_DRIVER_FOUND is an expected business outcome. Redis, broker, or database outages are infrastructure errors and must be surfaced and handled separately, not silently reported as a lack of drivers.

## 14. WebSocket connection routing

WebSocket connections pass through a supporting load balancer and remain attached to one gateway until disconnect.

```text
Driver / Rider Apps
        |
   Load Balancer
        |
   +----+----+
   |         |
Gateway A  Gateway B
   |         |
   +----+----+
        |
Connection registry / message routing
        |
Matching and Ride Services
```

If a gateway fails, affected apps reconnect and recover state. An established connection does not migrate transparently to another gateway.

The earlier notes left connection routing as the next design topic. The following registry and broker flow is a proposed baseline for answering those questions.

Maintain an ephemeral registry:

```text
driver:connection:123
  gatewayId = gateway-B
  connectionId = conn-789
  sessionVersion = 42
  TTL refreshed by heartbeats
```

The gateway stores the actual socket locally. The registry maps a driver to the gateway owning the connection.

For the initial design, permit one active driver session. Reconnection replaces the registry entry. Heartbeat refreshes and disconnect cleanup must conditionally match the current session so an old gateway cannot refresh or delete a newer session.

Delivery flow:

```text
Database outbox
    -> Offer Delivery Service
    -> resolve driverId to gateway and connection
    -> gateway-specific broker destination
    -> gateway validates current connection
    -> Driver App
```

Messages include offerId, rideId, and expiresAt. Use at-least-once processing with deduplication by offerId.

If the registry is missing or stale, retry briefly within the deadline or fail delivery according to policy. After reconnect, the app fetches current ride and pending-offer state through REST. Persisted offer state remains authoritative.

After assignment, the rider receives driver details and live location updates through their gateway. Authorize subscriptions against the active ride so location is delivered only to permitted participants. Reconnection recovers a current snapshot through REST before continuing live updates.

## 15. Scenario checklist

| Scenario | Action |
|---|---|
| No nearby eligible candidates | Expand radius within policy or retry after a delay, respecting the overall deadline |
| Reservation acquired | Persist a valid offer and arrange delivery and timeout processing |
| Reservation acquisition fails | Immediately try another candidate |
| Driver accepts | Validate identity, offer, deadline, and reservation; atomically confirm in the database |
| Driver declines | Close the offer, record attempt, release owned reservation, and continue |
| Driver does not respond | Expire the offer through durable timeout processing and continue |
| WebSocket delivery fails | Retry within the deadline or close as delivery failure and continue |
| Candidate batch exhausted or stale | Fetch a fresh batch, excluding attempted drivers |
| Duplicate matching or timeout task | Guard transitions and side effects using durable state and idempotency |
| Duplicate acceptance | Return the existing authorized assignment if already accepted |
| Acceptance after expiry or supersession | Reject explicitly |
| Rider cancels | Stop matching and close pending offers using conditional durable transitions |
| Worker crashes after lease acquisition | Lease expires; recovery resumes the ride |
| Worker crashes after offer commit | Outbox and timeout recovery resume processing |
| Redis lease is lost or expires unexpectedly | Database constraints still prevent double assignment |
| Matching limit reached with no valid pending offer | Mark NO_DRIVER_FOUND and notify rider |
| Infrastructure unavailable | Surface the failure and use bounded infrastructure recovery, not a false no-driver result |

## 16. Persistence and recovery

Redis hashes are in memory. For local disk persistence, Redis can use:

```text
appendonly yes
appendfsync everysec
```

This typically risks losing approximately the latest second of writes after a crash. Persistence is not a substitute for database assignment constraints, backups, or high availability.

Treat location indexes, routing entries, and reservation leases as ephemeral or rebuildable. Keep rides, offers, assignments, deadlines, and recovery-critical progress durable.

Recovery workers should find expired pending offers, due unmatched rides, unpublished outbox events, and assignments whose Redis availability projection needs repair. All recovery operations must tolerate duplicate execution.

## 17. Interview summary

Search nearby free drivers with fresh GPS data, rank candidates, and atomically
check current FREE status and acquire a short Redis lease in one call before
sending an offer. Persist the offer and process acceptance, decline, and timeout
asynchronously. Fetch a new batch after a failed offer within a bounded matching
policy. Use the primary database as the final authority against double assignment.

Key rules:

1. Search finds candidates; it does not reserve them.
2. A temporary reservation is not a confirmed assignment.
3. One active offer per ride requires durable per-ride coordination, not only a driver lease.
4. No worker thread waits through the driver's response window.
5. TTL expiry releases a lease but does not advance the ride workflow.
6. Redis and database operations are not one cross-store transaction.
7. Idempotent handlers, conditional transitions, outbox delivery, and recovery make retries safe.
8. Matching stops at a defined deadline or offer limit.

## 18. Remaining design choices

The original system-level discussion raised these questions; the proposed mechanisms above connect them to the later matching workflow:

| Question | Proposed direction |
|---|---|
| How does driverId map to a gateway instance? | An ephemeral Redis connection registry with session-aware refresh and cleanup |
| How does Matching Service reach that gateway? | Durable offer publication, Offer Delivery lookup, and gateway-specific broker routing |
| What if the driver disconnects just before delivery? | Bounded delivery retries, offer expiry, and REST recovery after reconnect |
| How do duplicate or conflicting acceptances stay safe? | Idempotency, conditional offer transitions, and database assignment constraints |

WebSocket offer responses and fresh searches after failed offers are the current
baseline. Concrete choices still to finalize include broker and delayed-task
technology, connection/session policy, search-radius expansion policy, candidate
freshness thresholds, and road-ETA provider or approximation.
