# Requirements

Requirements describe what the service must do, what must remain correct, and
how much work the service must handle. Define these requirements before choosing
a database or drawing a system diagram. Each design choice should help the
service meet a requirement.

This chapter uses an online shop to explain how to write requirements, estimate
traffic and storage, and choose an initial design. Clear requirements make a
design easier to review; they do not prove that the design is ready for production.

<a id="the-situation"></a>
## Define the problem

Start by listing what the user needs to do. In an online shop, the user reads
product details and submits an order. For each operation, describe what the
service returns when the request succeeds and what the service does when it fails.

The two operations do not need the same rules. The service may return a product
description that is a few seconds old. The service must not accept two orders
for the final unit of stock. Write down which information may be old and which
decisions must use current data.

## Define scope and rules

| Type | Definition | Shop example |
| --- | --- | --- |
| Functional requirement | What the service must do | The service accepts an order and returns its identifier. |
| Quality requirement | How well the service must perform an operation | The p95 latency for successful product reads must be below 300 ms, as explained below. |
| Constraint | A limit on the design choices | The service must run in one region and be operated by a two-person team. |
| Invariant | A rule that must always hold | Available stock must never become negative. |
| Exclusion | Work the current design will not cover | The service will not provide recommendations or support multiple currencies. |

For each operation, specify what the user sends, who may perform the operation,
and what the service returns. For an order, define when the service accepts the
order and what happens if there is not enough stock. Also define what happens if
the user retries the same request. If payment is outside scope, accepting an order
must not imply that the user has paid.

An invariant must hold even when requests arrive at the same time or the user
retries a request. For stock reservation, the service must use the database state
that determines whether stock is still available, not an old stock count from a
cache. A cache stores a copy of data for reuse. The service may use a cached
product description if the copy is no more than 30 seconds old, but it must check
stock again before accepting an order. If the scope or an assumption changes,
check whether the design still meets these rules.

## Measure the right thing

For each quality requirement, state what you will measure, where you will measure
it, and over what period. Also state the request rate and request types the
service must handle while meeting the target. A service-level objective (SLO) is
a target for one of these measurements. Product reads and order submissions
usually need separate targets.

| Term | Meaning | Example |
| --- | --- | --- |
| Latency | How long an operation takes | The p95 latency for successful product reads is below 300 ms at the public API. |
| Throughput | How many operations the service completes per unit of time | The service completes 230 product reads/sec while meeting its latency and availability targets. |
| Availability | The fraction of eligible requests the service serves successfully | At least 99.9% of eligible product reads succeed each calendar month. |
| Durability | Whether saved data survives specified failures after the service confirms success | A saved order survives the loss of one storage device. |
| Consistency | Which saved changes a read must return | After the service confirms an order submission, a read for that order returns the order. |

To measure latency, choose where the timer starts and stops. A timer at the public
API may start when the service receives a request and stop when it finishes sending
the response. That timer does not include the request's full trip across the
user's network. Use the same boundary for measurements you compare.

**p95 latency** is the 95th percentile of the measured durations. Roughly 95% of
requests take no longer than the p95 value; roughly 5% may take longer. A p95 of
300 ms is not a maximum and does not tell you how slow the remaining requests are.
Calculate the overall p95 from the combined request measurements. Do not average
the p95 values reported by separate application instances.

For availability, define which requests are eligible. In this example, a request
must be well-formed, use a valid product identifier, and be authenticated if
authentication is required. Count timeouts and failures in services the shop
depends on against the target. State whether each retry counts as another request.
The 99.9% target allows 0.1% of eligible requests to fail. This allowance is the
error budget; it is not a fixed number of downtime minutes. Report failed requests
as well as successful-request latency, so fast errors cannot make the service
appear to perform well.

For durability, specify which failures the saved data must survive. Surviving one
device failure does not mean surviving the loss of a region. For consistency,
specify how old a read may be for each operation. A product description may be
30 seconds old, but a user may need to read an order immediately after submitting
it. A service can be reachable and still return old data. A backup can preserve
data without keeping the service available. See [Reliability](06-reliability.md).

## Estimate traffic

Estimate traffic so you can choose a request rate for load tests. Assume the shop
has 100,000 active customers each day, and each customer makes 20 product reads.
Assume the peak request rate is 10 times the daily average, and each response
contains an average of 10 KB of product data. Use decimal units:
1 KB = 1,000 bytes; 1 MB = 1,000,000 bytes; 1 GB = 1,000,000,000 bytes.

```text
Daily reads       = 100,000 x 20              = 2,000,000 reads/day
Average read rate = 2,000,000 / 86,400         = about 23.15 reads/sec
Peak read rate    = (2,000,000 / 86,400) x 10  = about 231 reads/sec
Peak payload rate = (2,000,000 / 86,400) x 10 x 10 KB
                  = about 2.31 MB/sec (18.5 megabits/sec)
```

Divide daily reads by the 86,400 seconds in a day to find the average rate. Then
apply the assumed peak multiplier. Multiply the peak rate by the average response
size to estimate how many bytes the service sends per second.

This calculation includes only the response payload: the product data in each
response. It excludes images, headers, connection setup, and retries. Images may
account for most of the bytes even if product reads account for most requests.
If a server-side cache answers a request, the database does not need to handle that
read. Estimate the fraction of requests the cache answers separately.

Before testing, decide how long the peak lasts and how many requests are reads
or writes. The calculation above covers product reads, not checkout. You could
round the peak estimate up to a test target of 250 reads/sec, but explain that the
extra capacity is a rounding margin, not a measured need. Test with representative
data, simultaneous requests, and responses from the services the shop depends on.
The estimate alone does not tell you how many requests one machine can handle.

## Estimate retained data

Estimate storage from the number of records the service keeps and the size of
each record. Assume the service saves 2,000 orders/day and keeps each order for
365 days. Each order, including its items, occupies an average of 2 KB before
database overhead. If the order rate stays constant, one year of orders requires:

```text
Retained orders = 2,000 orders/day x 365 days = 730,000 orders
Raw storage     = 730,000 x 2,000 bytes      = 1.46 GB
Two total copies of raw data                = 2.92 GB
```

Two copies means one primary copy and one additional copy, not a primary plus two
additional copies. The 2.92 GB estimate covers only those copies of the order data.
The database also needs space for indexes, metadata stored with each row,
transaction logs, and temporary work. Add backups and expected growth separately,
and explain what each extra storage allowance covers. Check the assumed order
size against sample records before using the estimate to choose disk capacity.

Keeping a second copy does not replace backups: the database may copy an unwanted
deletion or corrupted data to both copies. Also check how long the service needs
order history and how long privacy rules permit the service to keep it.

## Choose a baseline

Start with a design that can meet the requirements without unnecessary parts.
For a small shop, the browser can send requests to one application, and the
application can read and write data in a relational database:

```text
Browser --> One application --> Relational database
```

| Decision | Why start here? | When to reconsider |
| --- | --- | --- |
| Keep the application in one deployment unit. | A small team has fewer parts to deploy and operate. | Separate parts if they need independent deployments or different capacity. |
| Use database transactions for orders and stock. | The database can save the order and reserve its stock together. | Check whether requests for popular products wait too long for other updates to finish. |
| Do not initially shard the data, meaning split it across databases. | Related updates can stay in one database transaction. | Reconsider if measurements show that one database cannot handle the stored data or write rate. |

When the user submits an order, the application asks the database to reduce
available stock only if enough stock remains. The database must check and reduce
stock as one indivisible operation, called an atomic conditional update. If there
is not enough stock, the application rejects the order. If stock is available,
the application creates the order in the same transaction. The transaction saves
both changes or neither change. If the database cancels the transaction, it leaves
neither the new order nor its stock reservation. If the response is lost after the
transaction succeeds, the order still exists even though the user has not received
confirmation.

The application must also make repeated submissions idempotent: processing the
same submission again must not create another order or reserve more stock. For
example, the client can send a request identifier, and the database can enforce
that the identifier is stored only once with an order. The application returns the
existing result when the client retries the same submission.

The diagram does not show how the service keeps running when a component fails.
One application deployment can have multiple running instances. If there is only
one application instance or one database instance, its failure can stop the
service. Check whether recovery takes too long for the availability target and
whether additional instances or database copies are needed. Protect saved orders
against the specified storage failures before confirming success to the user.
Add a cache only after deciding how old its data may be. Add capacity after
measuring which component limits the service.

## Record one decision

Record why you made a design choice, how you will check it, and when you should
reconsider it. This lets another reader review the choice against the requirement
rather than treating the chosen technology as the requirement.

| Field | Example |
| --- | --- |
| Need | The service must not sell more stock than is available, even when orders arrive together. |
| Choice | The application reserves stock with an atomic conditional update and saves the order in the same transaction. |
| Check | Submit competing orders for the last unit and verify that only one succeeds. Retry the successful submission and verify that it does not reserve stock again. |
| Cost | Requests for the same product may wait while the database finishes another stock update. |
| Revisit | Reconsider the approach if measured waiting times prevent checkout from meeting its latency target. |

## Exercise

Assume a service has 50,000 active users/day. Each user makes 12 reads/day, the
peak rate is eight times the daily average, and each response contains an average
of 5 KB of data. Estimate the peak requests/sec and the response-payload bandwidth
using decimal units. Then name one invariant for a lending library and one fact
that the service may return from an old copy. State how old that copy may be.

??? success "Answer guidance"
    Daily reads are 50,000 × 12 = 600,000. Dividing by 86,400 seconds/day gives
    about 6.94 reads/sec; multiplying by eight gives about 55.56 reads/sec,
    conventionally rounded to 56. Payload bandwidth is approximately
    55.56 × 5 KB = 277.8 KB/sec, or about 280 KB/sec.

    One physical copy of a book must have at most one active loan. The service
    could return a book description that is up to 30 seconds old if the product
    requirement permits that delay. The service must not approve another loan
    just because an old copy of the availability data says the book is available.
    Even with low average traffic, the service may receive a burst of requests,
    many requests for one item, or slow responses from another service.

[Next: Networking & APIs →](02-requests.md)
