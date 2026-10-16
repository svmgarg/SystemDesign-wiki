# Scaling & Caching

## The situation

**Scaling** changes a system's **capacity**, the amount of work it can complete
in a given time while meeting response-time and error targets. A **bottleneck**
is the resource or dependency that currently limits that capacity. **Caching**
lets a service reuse a saved result instead of repeating an expensive operation.
The service sends less work to the source; the source itself does not become faster.

An **application instance** is one running copy of the application. Adding
instances helps when the existing instances cannot process requests fast enough.
If the instances are waiting for an overloaded database, adding instances may
just send more requests to that database.

Test the service with a representative **workload**: the mix of reads, writes,
data sizes, and popular items that the service must support. Measure completed
requests per second, errors, and **p95 latency**, the response time within which
95% of requests finish. Compare these measurements with CPU, memory, disk and
network use, database query time, and the number of requests waiting for work
to finish. A slow response alone does not reveal which resource needs more capacity.

Increase request rates gradually in a controlled test. Record the highest rate
the service can sustain while meeting its targets, not a brief maximum before
errors rise. Remove unnecessary database work using [queries and indexes](03-storage.md),
then add capacity to the resource that still limits the service. Repeat the test
after each change because another resource may become the bottleneck.

## Scale the constrained component

| Approach | Meaning | Benefit | Cost |
| --- | --- | --- | --- |
| Vertical scaling | Give a machine more CPU, memory, or faster storage | The application can often use the extra resources without major changes | Larger machines cost more, have size limits, and may need a restart |
| Horizontal scaling | Add instances and distribute requests among them | The remaining instances can serve requests if one fails, provided they have enough capacity | Requests must reach healthy instances, and shared storage must handle their combined work |

A **load balancer** routes requests among healthy application instances. A
**stateless application instance** does not keep the only copy of information
needed to handle later requests in its own memory. The load balancer can therefore
send the next request to any healthy instance.

```text
                    +--> App A --+
Client --> Balancer +           +--> Database
                    +--> App B --+
```

The service stores durable records and login session information in shared storage
that another instance can access. An instance may keep local copies for speed,
but losing the instance must not lose a saved order or force the user to reach
that same instance again.

The load balancer uses **readiness checks** to determine whether an instance can
accept requests. A process may be running but still loading data it needs to serve
requests. Before a planned shutdown, the load balancer stops sending new requests
to the instance and the instance lets active requests finish. If an instance
crashes, some active requests may fail before the load balancer detects the failure
and redirects traffic. Adding application instances does not protect the service
from a failure of its only database or load balancer.

## Calculate failure capacity

Assume each tested application instance sustains **100 requests/second** at the
target response time for the representative workload. Peak demand is **230/second**,
and the load balancer distributes requests evenly. The database and other shared
dependencies must also support this workload.

| Instances | Healthy capacity | After one failure | Enough for 230/sec? |
| --- | --- | --- | --- |
| 3 | 300/sec | 200/sec | No |
| 4 | 400/sec | 300/sec | Yes, if the database and other shared dependencies support this rate |

To serve the peak after one instance fails, choose an instance count `n` such that
`(n - 1) × 100 >= 230`: at least four instances. After one fails, each remaining
instance handles about `230 / 3 = 76.7` requests/second. Together, those instances
can handle 70 requests/second more than the expected peak. A larger burst can
still exceed their capacity.

If every request needs one database operation and the database safely sustains
only 150 operations/second, neither configuration serves 230/second. Each instance
uses a **connection pool**, a set of reusable connections to the database. Configure
the service to limit both the pool size per instance and the total connections
across instances, so new instances do not overwhelm the database. Also limit how
many requests can wait for a connection and how long they wait.

Test the service while an instance is unavailable or being replaced, not just
while all instances are running. Creating new instances takes time, so the service
needs enough existing capacity to handle requests immediately after a failure.

## Cache repeated reads

A **cache** stores copies that the service can retrieve more cheaply than the
original result. The **authoritative source**, such as the database that accepts
updates, holds the record the service relies on for correctness.

The service may return a briefly outdated product description if the application
allows it. To approve a purchase, however, the service checks and reserves stock
through the authoritative source. The stock check and reservation must be
**atomic**: the source performs them as one operation that other purchases cannot
interrupt. If enough stock remains, the source records the reservation; otherwise,
it rejects the reservation. Concurrent purchases cannot both reserve the same
remaining stock. A cached availability value cannot enforce this rule.
Likewise, a cached permission check can continue
allowing access after permission is removed. The service must follow an explicit
rule for how quickly permission changes take effect, not choose an arbitrary expiry.

With **cache-aside**, the service first looks up the requested item in the cache.
If the cache contains a usable copy, the lookup is a **hit** and the service
returns that copy. If no usable copy is present, the lookup is a **miss**.
The service then reads the source, saves a copy in the cache, and returns the result.

```text
Read --> cache hit --> return copy
     --> miss --> database --> fill cache --> return result
```

The service identifies each cached item with a **cache key**.
**TTL (time to live)** sets how long the cache may use an entry before it expires.
**Eviction** removes an entry, often to free memory, even if its TTL has not expired.
**Invalidation** deliberately removes a copy because the source has changed.
A common update sequence is for the service to save the database update, then
invalidate the cache key. If invalidation fails, the service retries it; otherwise
the cache may return the old copy until it expires.

Invalidation alone does not prevent stale data, meaning data older than the source:

1. A service request misses the cache and reads database value `v1`.
2. Another request saves `v2` in the database and invalidates the cache key.
3. The first request, delayed after its database read, saves `v1` in the cache.
   Later requests can now receive the old value.

A short TTL limits an entry's lifetime after insertion, not its age relative to
the latest source update. The service can also cache old data if it reads an
out-of-date database copy. If a request requires current data, the service can
read the authoritative source instead of the cache. Another option is to attach
version numbers to data and coordinate updates with cache fills so an old request
cannot insert an obsolete version. Simply including a version in the value does
not prevent the race. Define how old a returned value may be and test concurrent
reads and updates; TTL alone does not establish that limit.

### Estimate relief and plan for misses

The **hit ratio** is cache hits divided by cache lookups. Assume the service checks
the cache for 1,000 reads/second, finds a usable copy for 90% of those reads, and
makes exactly one database read for each miss:

```text
Normal database reads = 1,000 x (1 - 0.90) = 100/sec
Cold cache / outage   = potentially 1,000/sec
```

The service avoids 900 database reads/second, but it does not necessarily remove
90% of all database work. The database still processes writes, reads that do not
use the cache, and requests from other applications. Some queries also cost more
than others, so measure both hit ratio and query costs for the expected workload.

A **cold cache** contains few useful entries, for example after startup or many
evictions. If the cache is cold or unavailable, the service may send all 1,000
reads/second to the database. The cache must also have enough capacity to serve
its own requests, even when most requests find a copy.

| Failure | Why it happens | Defense and limitation |
| --- | --- | --- |
| Cache stampede: many requests refill the same entry | Requests arrive before the first database read has filled the cache | The service lets one request fetch the item and shares that result with waiting requests. It can also vary TTLs so different entries do not all expire together. |
| Hot key: one item receives unusually many requests | Requests for one key exceed the cache server's capacity | The service can keep additional read-only copies if old values are acceptable. It must then update or invalidate those copies too. |
| Memory pressure | The cache cannot hold all frequently requested data | The service limits entry sizes and configures which entries the cache removes to free space. More removals can cause more database reads. |
| Cache outage | The service reads the database when the cache is unavailable | The service limits simultaneous database requests and waiting time, then rejects excess requests so it does not overload the database. It must not return stale data when the request requires current data. |

The service includes any context that changes the result in the cache key,
such as the account, user, or language. Before returning private data, the service
checks that the user has permission to read it. Finding a cache entry does not
grant permission.

## Replicate or shard?

**Replication** maintains copies of the same data on multiple database instances.
**Sharding** divides records among separately served partitions called **shards**.
The service uses replication to keep additional copies and distribute suitable
reads. The service uses sharding to distribute data and its associated work.

| Technique | What the service can gain | What it must account for |
| --- | --- | --- |
| Replication | The service can read from multiple copies or use another copy after a failure | Copies must receive updates, and a copy may not yet contain the latest write |
| Sharding | The service can spread storage, reads, and writes across shards | The service must route each request to the right shard and coordinate operations that need multiple shards |

In a common replicated database, a **primary** accepts writes and **replicas**
receive the primary's changes. **Replication lag** is the delay before a replica
reflects a write. If the service reads a replica immediately after an update,
the replica may return the old value. When a request needs to see a completed
update, the service reads from the primary or uses a supported
**read-your-writes guarantee**, which ensures a client sees its completed updates.
That guarantee does not necessarily include other clients' latest updates.
Adding read replicas does not automatically let the primary accept more writes;
it still processes those writes.

**Failover** replaces a failed primary with another database instance. Before the
replacement accepts writes, the database system must prevent the old primary from
accepting conflicting writes. If the replacement did not receive all completed
writes, failover may lose those writes. Replicas also copy accidental deletes,
so the service still needs backups from which it can restore data.

For sharding, the service chooses a **shard key**, a field that determines which
shard stores a record. A router uses the key to send the request to that shard:

```text
customer key --> router --> shard 1: some customers
                       --> shard 2: other customers
```

Choose the key based on which records requests read and update, not just how many
rows each shard stores. A **hot shard** receives much more work than other shards.
For example, if the service routes records by country, requests for one country
may overload its shard while other shards have spare capacity.

The service can apply a **hash function**, which turns a customer identifier into
a number used to select a shard, to spread many customers across shards. However,
one high-traffic customer's identifier still selects one shard. Adding shards
does not divide that customer's requests unless the service changes how it
partitions that customer's data or serves those requests.

If a query or transaction needs records from multiple shards, the service must
contact those shards and coordinate their results or updates. Adding shards may
also require moving records while the service continues handling requests.
Each shard can have replicas: sharding divides records, while replication copies
them. Improve queries, cache data where correctness allows, and consider simpler
capacity changes before sharding. Adopt sharding when measured storage or request
rates exceed those options and justify the additional routing and coordination.

## Exercise

The service receives 500 reads/second and checks the cache for every read.
The cache serves 80% of those reads. Each miss needs one database read, and there
is no other database work. The database safely handles 150 reads/second.
Can the database handle normal demand? What happens when the cache is unavailable,
and what should the service do?

??? success "Answer guidance"
    Normally, the service sends `500 × 0.20 = 100` reads/second to the database,
    which is below its 150/second limit. If the cache fails, the service could
    send 500 reads/second, over three times the database's capacity.
    The database can sustainably serve at most 150/second under these assumptions.
    The service must reject or defer at least `500 - 150 = 350` reads/second.
    It limits simultaneous database requests and the time requests can wait so
    waiting work does not grow without limit. Deferral only helps temporarily;
    a sustained excess requires rejection or more capacity. Test cache failure
    and recovery, because a recovered cache may still be cold. A higher normal
    hit ratio does not increase the database's capacity during an outage.

[Next: Messaging →](05-async.md) ·
[Apply this: Distributed Cache](designs/distributed-cache.md)
