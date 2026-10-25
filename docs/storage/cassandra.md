# Apache Cassandra — Detailed System Design Notes

Apache Cassandra is a **distributed, highly available, horizontally scalable NoSQL database** designed to handle large volumes of data across multiple machines and data centers without relying on a single master node.

Its architecture is optimized for high write throughput, fault tolerance, and predictable access patterns at scale.

## 1. High-level architecture

- **Peer-to-peer:** Nodes have equal roles; there is no permanent master for all database operations.
- **Distributed partitioning:** Data is distributed across nodes using partition-key tokens.
- **Replication:** Multiple nodes store copies of data.
- **Tunable consistency:** Applications choose consistency levels for reads and writes.
- **Local storage engine:** Each replica processes its portion of the data locally.

A client can connect to any Cassandra node. That node becomes the **coordinator for that request**, identifies the relevant replicas, forwards the operation, and gathers the responses required by the chosen consistency level.

## 2. Data model: keyspaces, tables and partitions

Cassandra uses CQL (Cassandra Query Language), which resembles SQL but has different execution and data-modeling constraints.

| Concept | Meaning |
|---|---|
| Keyspace | Namespace that defines replication settings |
| Table | Collection of rows organized by a schema |
| Partition key | Determines the token and partition placement |
| Clustering columns | Order rows within a partition |
| Primary key | Partition key plus any clustering columns |

Example:

```sql
CREATE TABLE orders_by_customer (
    customer_id UUID,
    order_time TIMESTAMP,
    order_id UUID,
    amount DECIMAL,
    PRIMARY KEY (customer_id, order_time, order_id)
) WITH CLUSTERING ORDER BY (order_time DESC);
```

Here:
- `customer_id` is the partition key.
- `order_time` and `order_id` are clustering columns.
- Orders belonging to one customer are grouped into a partition.
- Rows inside that partition are ordered by the clustering columns.

**Important:** Cassandra tables are designed around query patterns. If an application needs to retrieve orders by customer and also by order ID independently, a separate table may be appropriate.

Unlike a relational database, Cassandra generally does not support arbitrary joins and ad hoc queries efficiently. Queries typically need to specify a usable partition key, unless a suitable indexing mechanism is used.

## 3. How data is distributed across nodes

Cassandra hashes each partition key into a token. The token determines which nodes are responsible for that partition, according to the cluster's partitioner and replication strategy.

For example, with replication factor (RF) = 3, a partition is stored on three replicas. Exact placement depends on the cluster topology and replication strategy.

Keep these concepts separate:
- **Partitioning** distributes data.
- **Replication** stores copies on multiple nodes.
- **Consistency level** controls how many replica responses are required for an operation.

A partition key with too few distinct values can cause hot partitions. Extremely large partitions can also cause storage, latency and compaction problems.

## 4. Cassandra write path

The main write path is:

`Client → Coordinator → Replica nodes → Commit Log + Memtable → Flush → SSTable → Compaction`

### Step 1: Coordinator receives the request

Any Cassandra node can receive a client request and act as coordinator for that request. It routes the mutation to the replicas responsible for the partition. It is not a permanent master.

### Step 2: Commit Log — the WAL

The Commit Log is an append-oriented log stored on disk. It records mutations for crash recovery.

For example:

```sql
UPDATE accounts
SET balance = 500
WHERE account_id = 101;
```

Cassandra records the mutation in the Commit Log on participating replicas before relying on the Memtable as the in-memory copy. Exact acknowledgment and durability behavior depends on Commit Log synchronization settings and consistency requirements.

The Commit Log is primarily for **crash recovery**, not the normal data lookup path.

### Step 3: Memtable

After recording the mutation in the Commit Log, Cassandra applies it to the appropriate table's Memtable.

A Memtable is an in-memory data structure that organizes recent mutations for efficient reads and eventual flushing.

Important properties:
- Memtables are associated with individual tables on a node.
- A node can have multiple active or pending Memtables.
- Writes accumulate; Cassandra does not create a new SSTable for every request.
- Reads can find recent data in a Memtable before it is flushed.

### Step 4: Flush to SSTable

A Memtable is flushed when Cassandra determines it needs to be flushed, for example because of memory thresholds, explicit flush operations, or other lifecycle conditions.

The flush writes accumulated data to immutable SSTable files on disk.

After a successful flush, Cassandra updates its Commit Log bookkeeping so that log entries already safely persisted no longer need to be retained for recovery.

### Step 5: Compaction

Over time, a table can have many SSTables. Compaction merges selected SSTables into new SSTables. It helps Cassandra:
- Reconcile multiple versions of the same data.
- Remove obsolete values when safe.
- Purge eligible tombstones when deletion and replica-consistency constraints allow.
- Manage SSTable count and read overhead.

Compaction is a background storage-management process, not part of every client write.

## 5. Commit Log, Memtable and SSTable compared

| Property | Commit Log | Memtable | SSTable |
|---|---|---|---|
| Main purpose | Crash recovery | Recent in-memory data | Persistent data |
| Location | Disk | RAM | Disk |
| Mutable? | Appended to | Updated in memory | Immutable |
| Created per write? | Mutations are appended | Mutation applied to existing Memtable | No |
| Used during reads? | Not the normal data lookup path | Yes | Yes |
| Recovery role | Replays necessary mutations | Rebuilt after restart | Supplies already-persisted data |

### How does Cassandra know where to start replaying after a crash?

Consider this sequence:
1. Mutation A is written to the Commit Log and Memtable.
2. Mutation B is written to the Commit Log and Memtable.
3. The Memtable flushes A and B into an SSTable.
4. Mutation C is written to the Commit Log and Memtable.
5. The node crashes before C is flushed.

On restart, Cassandra uses Commit Log positions and flush-related bookkeeping to determine which mutations may still be needed. It replays the necessary log entries to reconstruct unflushed data.

**Important nuance:** A Commit Log segment may contain mutations for several tables. Flushing one table does not automatically make the entire segment reusable. Cassandra can recycle a segment only when all mutations in it are no longer needed for recovery.

This avoids losing unflushed writes and unnecessarily replaying data that is already safely persisted.

## 6. Cassandra read path

Cassandra reads can involve both in-memory and on-disk data:

`Client SELECT → Coordinator → Replicas → Memtable + relevant SSTables → Reconcile results → Client`

Cassandra uses mechanisms to reduce unnecessary disk access:
- **Partition indexes and index summaries:** Help locate partition data in SSTables.
- **Bloom filters:** Help determine whether an SSTable definitely does not contain a partition, or might contain it.
- **Partition key and clustering order:** Help identify relevant data ranges.
- **Caches:** Can reduce repeated work when relevant data or metadata is cached.

A Bloom filter can produce a false positive (“might exist”), but not a false negative under normal operation. Cassandra verifies potential matches using its actual index and storage structures.

Because data can exist in multiple SSTables and replicas, Cassandra reconciles versions using timestamps and deletion markers. Exact results and guarantees depend on the query and configuration.

## 7. Replication and consistency levels

The **replication factor (RF)** is the number of replicas for each partition within the configured replication scope. For RF = 3, a partition is stored on three replicas.

Common consistency levels include `ONE`, `TWO`, `THREE`, `QUORUM`, `ALL`, `LOCAL_QUORUM`, and others depending on operation and Cassandra version.

For RF = 3:

| Consistency level | Typical response requirement |
|---|---:|
| `ONE` | 1 replica |
| `QUORUM` | 2 replicas |
| `ALL` | All 3 replicas |
| `LOCAL_QUORUM` | A majority of replicas in the local data center |

For RF = 3:

`QUORUM = floor(RF / 2) + 1 = 2`

For a simplified single-data-center example, when read and write operations use compatible replica sets and ordinary quorum consistency, the common overlap rule is:

`R + W > RF`

where `R` and `W` are the required read and write responses. With RF = 3, read quorum = 2 and write quorum = 2, the response sets overlap by at least one replica.

This helps reads observe the latest acknowledged write under the relevant assumptions. It does **not** make every Cassandra operation linearizable; concurrent writes, timestamps, failures and repair can complicate the picture.

Lower consistency levels often improve availability and latency. Higher levels require more replica responses and can increase latency or fail when enough replicas are unavailable.

## 8. What happens when a node fails?

Suppose RF = 3 and a partition is replicated on Nodes A, B and C. If Node A goes down:
1. The coordinator can route requests to available replicas B and C.
2. A write can succeed if its consistency level is satisfied.
3. Reads can continue if the required responses are available.
4. When A returns, it may need to catch up on missed mutations.

Cassandra uses several mechanisms to help replicas converge:
- **Hinted handoff:** May retain hints for an unavailable replica and replay them when it returns.
- **Read repair:** Can reconcile inconsistent replica data during eligible reads, depending on version and configuration.
- **Anti-entropy repair:** Compares replica data and repairs inconsistencies, commonly using Merkle-tree-based comparison.

Do not assume hinted handoff alone guarantees that every missed write will be delivered. Repair planning and operational monitoring remain important.

### Local crash recovery versus replica recovery

- **Commit Log replay** recovers local mutations that were not safely flushed.
- **Replication and repair mechanisms** recover or reconcile data missed while a node was unavailable.

These are different problems.

## 9. Deletes, tombstones and TTL

Cassandra commonly represents deletions using **tombstones** rather than immediately erasing data from every SSTable.

A tombstone tells Cassandra that a value has been deleted, preventing an older copy from reappearing during reconciliation. Compaction can eventually purge eligible tombstones, but only when it is safe under Cassandra's deletion and replica-consistency rules.

Example:

```sql
DELETE FROM orders_by_customer
WHERE customer_id = ?
  AND order_time = ?
  AND order_id = ?;
```

Cassandra also supports time-to-live (TTL):

```sql
INSERT INTO sessions (session_id, user_id)
VALUES (?, ?)
USING TTL 3600;
```

The inserted data expires after 3,600 seconds, subject to Cassandra's expiration semantics.

**Performance warning:** Excessive tombstones can slow reads and compaction. Large-scale deletes and TTL-heavy workloads require careful schema design, retention planning and repair operations.

## 10. Compaction strategies

Compaction combines selected SSTables into new SSTables. Strategy determines which SSTables are selected and how data is organized.

| Strategy | General idea | Common fit |
|---|---|---|
| STCS — Size-Tiered | Merge SSTables of similar size | General workloads with many similarly sized SSTables |
| LCS — Leveled | Organize SSTables into levels with controlled overlap | Read-heavy workloads needing predictable read amplification |
| TWCS — Time-Window | Group SSTables into time windows | Time-series data with TTL or time-based retention |
| UCS — Unified | Flexible compaction behavior | Available in newer Cassandra versions; evaluate against workload needs |

These are starting points, not universal rules. The best strategy depends on Cassandra version, data distribution, read/write mix, retention pattern and operational requirements.

Compaction consumes disk I/O, CPU and temporary disk space. Capacity planning must account for old and newly generated SSTables coexisting during compaction.

## 11. Horizontal scaling

When a cluster adds nodes, data ownership can be redistributed across a larger set of nodes. With appropriate configuration and topology, this can increase storage capacity and throughput.

Adding nodes does not automatically make every workload faster. Performance still depends on:
- Partition-key distribution and hotspots.
- Replica placement and consistency level.
- Network and disk throughput.
- Memtable flush and compaction pressure.
- Query patterns and partition size.
- Data-center topology and replication settings.

A single extremely hot partition can remain a bottleneck even in a large cluster because requests for that partition are concentrated on its replica set.

## 12. When should you use Cassandra?

### Good candidates
- High write throughput across many nodes.
- Large datasets requiring horizontal scale.
- Workloads with known, stable query patterns.
- Multi-node and multi-data-center availability requirements.
- Time-series events, activity feeds, device telemetry and similar distributed workloads.

### Less suitable without additional design
- Complex joins and arbitrary relational queries.
- Frequent cross-partition transactions.
- Workloads requiring general-purpose relational constraints.
- Strict serializable transactions across arbitrary data.
- Access patterns that cannot be modeled efficiently with partition keys.

Cassandra supports lightweight transactions for specific conditional operations, but they have different performance and coordination costs from ordinary writes. They should not be treated as free global transactions.

## 13. Cassandra versus PostgreSQL and Redis

| Feature | Cassandra | PostgreSQL | Redis |
|---|---|---|---|
| Primary purpose | Distributed database at scale | Relational database | In-memory data store |
| Storage model | Wide-column | Relational tables | Data structures |
| Horizontal scaling | Core design feature | Often needs additional architecture | Available with Redis Cluster |
| Write path | Commit Log + Memtable + SSTables | WAL + buffer/cache + data files | Primarily memory, with configurable persistence |
| Joins | Not designed for arbitrary joins | Strong support | Not a relational join engine |
| Consistency | Tunable replica consistency | Strong transactional guarantees within its model | Depends on deployment and operation |
| Best fit | Distributed, high-throughput workloads | Relational data and complex queries | Caching, counters, queues and low-latency operations |

Cassandra and PostgreSQL both use a write-ahead log, but their storage engines and query-processing models are different.

## 14. Common interview questions

### Q1. Why does Cassandra use both a Commit Log and a Memtable?
The Commit Log provides crash recovery, while the Memtable provides an in-memory structure for recent data. They serve different purposes.

### Q2. Why are SSTables immutable?
Immutable files simplify sequential writes and storage management. Updates create new versions, and compaction reconciles them later.

### Q3. Why can Cassandra writes be fast?
Writes are appended to the Commit Log and applied to memory; Cassandra can defer SSTable creation and compaction to later background work.

### Q4. How does Cassandra avoid replaying all old Commit Log data?
It tracks Commit Log positions and flush-related bookkeeping to identify mutations that may still be needed to reconstruct unflushed data.

### Q5. Why is partition-key selection important?
The partition key determines data distribution and is central to efficient queries. Poor selection can create hot or oversized partitions.

### Q6. Does RF = 3 mean every write must reach all three replicas?
No. The required responses depend on the write consistency level. RF determines replica count; consistency level determines the response requirement.

### Q7. Why does Cassandra need compaction?
Multiple SSTables can contain different versions of the same data. Compaction merges them, reconciles versions, and removes obsolete data when safe.

### Q8. What is the difference between Commit Log replay and repair?
Commit Log replay reconstructs local mutations that were not safely flushed. Repair reconciles data between replicas that may have diverged.

### Q9. Does Cassandra guarantee linearizable reads and writes by default?
No. Ordinary consistency levels do not automatically provide linearizability. Cassandra offers lightweight transactions for certain conditional operations when stronger coordination is needed.

### Q10. What are common Cassandra operational risks?
Poor partition design, hot partitions, excessive tombstones, compaction pressure, and inadequate repair or capacity planning are common sources of trouble.

## 15. Final mental model

Memorize these five flows:

### Write path
`Client → Coordinator → Replicas → Commit Log + Memtable`

### Persistence
`Memtable → Flush → SSTable`

### Storage maintenance
`SSTables → Compaction → New SSTables`

### Local crash recovery
`Existing SSTables + Necessary Commit Log replay → Reconstructed state`

### Replica recovery
`Hints / eligible read repair / anti-entropy repair → Replica convergence`

## Key takeaways

1. **Commit Log:** Protects local unflushed writes through recovery.
2. **Memtable:** Holds recent data in memory.
3. **SSTable:** Stores persisted data in immutable files.
4. **Compaction:** Reconciles SSTables and removes obsolete data when safe.
5. **Partition key:** Determines partition placement and strongly affects performance.
6. **Replication factor:** Determines how many replicas store a partition.
7. **Consistency level:** Determines how many replica responses an operation requires.
8. **Commit Log replay and replica repair solve different problems.**

For system design interviews, understand how these components interact during normal writes, node failures, recovery, compaction and inconsistent replicas.
