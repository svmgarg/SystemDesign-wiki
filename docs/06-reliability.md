# Reliability

Reliability means the system continues to perform its intended function correctly,
including when components fail. The service must complete the operations it
promises, preserve the data it confirms, and recover within its stated targets.

## The situation

The user submits a request to save a setting. The service writes the setting to
its database and returns success. When the user requests the setting later, the
service looks it up and returns the saved value.

If the database becomes unreachable, the service may still answer health checks
but cannot save the setting. Some components still work while another fails or
cannot be reached. This is a **partial failure**. A **distributed system** has
components that communicate over a network, so it must handle these failures.

## Separate the guarantees

| What the service promises | Name | If a component fails |
| --- | --- | --- |
| The service completes requests successfully under stated timing requirements | Availability | If the database is unreachable, requests may fail even though the data is safe |
| The database preserves writes it has confirmed across specified failures | Durability | If a disk fails, another durable copy must preserve the confirmed setting |
| Reads follow stated rules about which writes they can return | Consistency | If the service reads a database copy that has not received the update, it may return the old setting |

These promises answer different questions. The service can return old data quickly,
or it can preserve data that users cannot currently reach. Define which failures
each promise covers; a success response must not imply more than the system provides.

When measuring availability, define which requests count, what success means, and
how long a request may take. A quick error is not a successful save. State whether
the target measures successful requests or time during which the service is usable.

### Define the read contract

The service confirms a setting change. If any client then starts a read, the
database returns that change or a later change, not an older value. This illustrates
**linearizability**: each operation appears to happen at one instant between its
request and response, and the order respects operations that already completed.

The service may instead read a copy that has not received the change yet. The
database sends updates between copies and repairs differences. If updates stop
and communication and repair succeed, the copies eventually agree. This is
**eventual consistency**; it does not specify how long an old value may remain.

The service can also promise that a client sees its own completed writes or later
changes, while other clients may still see old values. This is **read-your-writes**.
The service can wait for a copy to catch up or route the read to an up-to-date copy.
A session token can tell the service which write the client's read must include.

Name the guarantee instead of saying “strong consistency.” State its scope:
linearizable operations on individual records do not make a multi-record update
atomic, meaning that all its changes succeed together or none take effect.

When the database runs transactions concurrently but produces the same effect as
some one-at-a-time execution, it provides **serializability**. That order need not
follow real time. When transactions preserve declared data rules, such as valid
references between records, that is **ACID consistency**, not a rule about fresh
reads from copies. See [Storage](03-storage.md).

## Replicate and fail over safely

The database keeps copies on multiple nodes so one failed node need not stop the
service or destroy its data. This is **replication**. In a leader-based database,
the **leader** coordinates writes and the **followers** copy them. If the leader
cannot serve requests, the database selects a replacement and the service sends
requests to it. This change is **failover**.

```text
Client --write--> Leader --replication--> Follower
                  |                       |
             acknowledgment          promotion candidate
```

If the leader confirms a write before followers store it, the database uses
**asynchronous replication**. If the leader is then lost and the database promotes
a follower that lacks the write, the confirmed data may be missing. The leader can
wait for multiple durable copies before confirming, but the write takes longer
and may block if too few copies are reachable. The protection depends on the
replication protocol, storage settings, and failures the system must tolerate.

If a follower receives no response before a timeout, it knows only that the
response did not arrive in time. The leader may have crashed, may be slow, or may
be unreachable. A timeout alone cannot prove that the old leader stopped writing.

If the old and new leaders both accept writes, they can store conflicting changes.
This is **split brain**. The database must coordinate which leader may write and
reject writes from a leader that has lost permission. This rejection is **fencing**.
For example, the election protocol assigns increasing leadership numbers, and
storage rejects writes with an older number after accepting a newer one. Merely
changing request routing does not disable the old leader.

The protocol may require agreement from a **quorum**, a required subset of copies.
A majority quorum needs 2 of 3 nodes. Any two such majorities share at least one
node, which a correct election and replication protocol uses to coordinate writes.
Counting votes alone does not prevent split brain or guarantee fresh reads.
Use the database's tested election and fencing mechanisms.

## CAP during a partition

If running database nodes cannot communicate across a network break, they are
separated by a **network partition**. A client may still reach each side. If one
side confirms a write, the other side cannot learn that write while separated.
It cannot both return a guaranteed up-to-date value and always complete the read.

The **CAP theorem** describes this limit: during a partition, a replicated system
cannot guarantee both linearizability and availability. Here, **CAP availability**
requires every request received by a non-failing node to eventually complete with
a response that satisfies the operation, not simply an error. It has no fixed
latency bound and is not the same as measured monthly uptime.

| What the database does during the partition | Result |
| --- | --- |
| Both sides independently accept reads and writes | Requests can complete locally, but reads may miss completed writes and values may diverge |
| Only nodes with coordinated authority accept writes and serve fresh reads | The database can preserve linearizability, but other nodes reject requests or wait |
| The service allows old description reads but requires authority for inventory writes | Users can read descriptions, but some purchases cannot complete |

!!! warning "Not “pick any two forever”"
    This limit applies during partitions, not as a permanent choice of two features.
    The service can use different rules for different operations. Coordination
    still takes time outside partitions. CAP does not itself prevent overselling:
    the database must also check and update inventory as one atomic operation.

## Contain failure

If a database call becomes slow, each waiting request can hold a service worker.
If all workers wait, the service cannot accept other work. Replication alone does
not prevent this. The database is a **dependency**, a component the service needs
to complete its work. The service must limit waiting, retries, and resource use.

| What the service does | Mechanism and reason |
| --- | --- |
| Sets a total time limit and passes the remaining time to downstream calls | A **deadline** prevents each call from starting a new full waiting period |
| Retries temporary failures a limited number of times within the deadline | **Bounded retries** can recover a request; increasing delays and random timing, called backoff and jitter, reduce synchronized retry load |
| Temporarily stops calls after repeated failures, then allows a few test calls after a delay | A **circuit breaker** reduces pressure and resumes normal calls if the tests succeed; it does not repair the dependency |
| Gives separate workloads their own worker or concurrency limits | **Bulkheads** keep slow optional work from consuming all capacity; each queue also needs a limit |
| Rejects excess requests before spending resources on them | **Load shedding** protects work the service can still complete |
| Omits an optional feature if its dependency fails | **Graceful degradation** keeps core operations usable; the service must not invent inventory or payment success |

If the database stores a write but its response is lost, the service may time out
even though the write succeeded. Retrying can repeat its effect. The service must
retry only safe operations or send the same **idempotency key**, an identifier the
receiver uses to recognize and avoid repeating an operation. Limit total retries:
if every layer retries, one request can generate many calls and prolong an outage.
See [Messaging](05-async.md).

Place database copies on separate infrastructure to reduce shared failures.
If two copies share one machine, a hardware failure can stop both. An
**availability zone** groups infrastructure that may fail together. Separate zones
reduce some shared risks, but not shared software bugs, destructive credentials,
or every regional failure.

## Plan recovery

If the database replicates an accidental deletion, its other copies also lose
the records. The service needs a **backup**, a recoverable historical copy, to
restore earlier data. Protect backups so credentials that can destroy live data
cannot also destroy every recovery copy. Test the restore, not just the backup job.

| Recovery requirement | Name | Example |
| --- | --- | --- |
| How far back the recovered data may be relative to the disruption | **RPO**, recovery point objective: maximum acceptable data-loss interval | Recover to a point no more than one hour before disruption |
| How long the service may take to become usable after disruption | **RTO**, recovery time objective: target recovery duration | Restore usable service within one hour |

If the database takes a snapshot every hour and keeps no logs for replaying later
writes, recovery can lose nearly one hour of changes. This assumes every snapshot
succeeds and is usable. If one fails, the loss interval can be longer. If recovery
uses a follower instead, check how far behind that follower can be.

If restoring 100 GB takes 30 minutes and verification takes 15, those steps use
45 minutes. A one-hour RTO leaves 15 minutes for detection, decisions, provisioning,
and restoring traffic. Run recovery tests that include these steps, the required
dependencies, and checks that the application works correctly. RPO and RTO are
targets; the service meets them only if its recovery process can achieve them.

## Exercise

Two database copies cannot communicate. Each shows one remaining inventory unit,
and the service receives a purchase request at each side. Can both sides safely
confirm a sale? Can the service still return descriptions from either side?
Would an hourly backup make both confirmations safe?

??? success "Answer guidance"
    Both sides cannot safely confirm: they would sell the same unit twice. The
    database must check and reduce inventory atomically under a valid writer's
    authority. If a side cannot establish that authority, it must reject or wait.

    Before the partition, the database could instead assign the unit exclusively
    to one side. Only that side could sell it; storing a copy on each side does not
    give both sides permission to sell.

    The service can return old descriptions if its read rules allow them. It need
    not require the same freshness for descriptions as for inventory updates.
    A backup cannot coordinate sales or undo external effects. An hourly backup
    may also omit recent confirmations, so test its RPO and restore procedure.

[Next: Security & Operations →](07-operations.md)
