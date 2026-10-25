# Storage

For a distributed-database deep dive, see
[Apache Cassandra](storage/cassandra.md). It covers partitioning, replica
consistency, the write and read paths, compaction, and crash recovery.

For large files stored outside the database, see
[Multipart Uploads: AWS S3 and Azure](storage/multipart-uploads.md). It explains
direct chunk uploads, signed URLs, block IDs, and explicit completion.

<a id="the-situation"></a>
## What storage provides

**Data storage** means recording information so a service can read or change it later, including after an application restart. A **database** organizes that information and checks rules when the service saves changes. A **query** asks the database to find data, such as the items in an order.

For a product order, the service reads the product and its price, reserves stock, and saves the order and its items. If there is not enough stock, the service rejects the order. If saving the order fails, the service must undo the reservation. These rules must hold even when requests arrive at the same time.

An **invariant** is a rule that must remain true. Here, available stock must never become negative, and each accepted order must have a matching stock reservation.

## Model the questions first

Before choosing a database, identify what the service reads, what it writes, and which changes must succeed together. For this order service, three operations shape the design:

- When a user opens a product, the service uses its identifier to find its name, current price, and currency.
- When a user requests recent orders, the service finds orders for that customer and returns the newest first. It must also choose a fixed order for records with the same time.
- When a user places an order, the service reduces available stock and saves the order and purchased items. It must save all these changes or none of them.

A **relational database** stores related data in tables. A **table** holds records of one kind; a **row** is one record, and a **column** is a named field with a data type. A **schema** defines the tables, columns, types, and constraints. A **constraint** is a rule the database checks while saving a change. If the change breaks the rule, the database rejects it.

A **key** identifies data. A **primary key** identifies exactly one row and cannot be null, meaning missing. A **foreign key** checks that a supplied reference points to an existing row. For example, the database rejects an order item if its order does not exist.

A **unique constraint** prevents duplicate values or combinations. If two requests try to save the same unique key, the database allows at most one to commit that value. `NOT NULL` rejects missing values; a unique constraint alone does not generally do that.

**SQL** is a language for defining, reading, and changing relational data. The PostgreSQL schema below uses `CHECK` constraints to reject invalid numbers and `REFERENCES` to define foreign keys. The service supplies the IDs. The two-column primary key on `order_items` allows each product to appear only once per order; `quantity` records how many units were purchased.

```sql
CREATE TABLE customers (
    id bigint PRIMARY KEY, email text NOT NULL
);
CREATE TABLE products (
    id text PRIMARY KEY, name text NOT NULL,
    price_minor bigint NOT NULL CHECK (price_minor >= 0),
    currency char(3) NOT NULL
);
CREATE TABLE inventory (
    product_id text PRIMARY KEY REFERENCES products(id),
    available integer NOT NULL CHECK (available >= 0)
);
CREATE TABLE orders (
    id bigint PRIMARY KEY, customer_id bigint NOT NULL REFERENCES customers(id),
    status text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE order_items (
    order_id bigint REFERENCES orders(id),
    product_id text REFERENCES products(id),
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
    currency char(3) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
```

The service stores money in integer **minor units**, the subdivisions defined for a currency, rather than approximate floating-point values. For USD, `price_minor = 2500` means USD 25.00. The service must apply the scale for the recorded currency because not all currencies use two decimal places. The three-character column limits the code's length but does not check that it names a valid currency.

**Normalization** means storing a fact in one place rather than maintaining several copies that could disagree. The service stores the current product name in `products`, while `inventory` stores only its product reference and available quantity. To read both together, a query can use a **join**, which matches rows using columns such as `product_id`.

**Denormalization** means deliberately copying data to support a particular read or write. The service copies the agreed price and currency into each order item so it can show what the customer purchased. Once saved, those values describe the purchase, not the current catalog. If the product price changes, the service must leave earlier order prices unchanged.

## Use transactions for related changes

A **transaction** groups database operations so the database can save or discard their changes together. The service begins a transaction, reserves stock, and inserts the order and items. If all required steps succeed, it asks the database to **commit**, or accept the changes. If a step fails, it asks the database to **roll back**, or discard the changes that have not committed.

The usual transaction guarantees are called **ACID**:

- **Atomicity:** the database commits all changes in the transaction or none of them. Rolling back an order also undoes its stock decrement. This does not undo an email or payment sent through an external API.
- **Consistency:** the transaction leaves the data within its defined rules. The database checks declared constraints, but the service must implement rules that the schema does not express. The database does not infer that every accepted order needs a reservation.
- **Isolation:** the database controls how transactions affect each other when they run at the same time. Its **isolation level** specifies the guarantees. A default level may allow two transactions to read the same stock value before either changes it.
- **Durability:** after the database acknowledges a commit, it preserves the changes through the failures its configuration covers. The service must check which failures are covered by the database's recovery log, storage, and replication settings.

ACID consistency concerns whether stored data follows its rules. **Distributed read consistency** concerns which version a read can return when data has **replicas**, or copies on other nodes. If a replica has not yet received a committed order, a service reading that replica may not find it. The order can satisfy every database rule while that read is still out of date. See [Reliability](06-reliability.md).

## Prevent the last-item race

If two requests read `available = 1`, each may decide to accept an order and then write `available = 0`. Both orders would claim the same unit. Putting those reads and writes in transactions does not prevent this at every isolation level.

Instead, the service uses a **conditional update**: it asks the database to reduce stock only if enough stock remains. The database checks that condition while updating the row. If one transaction reserves the last unit and commits, a competing transaction cannot also reserve it from the old value. PostgreSQL may make the competing transaction wait, return no matching row, or fail with an error that requires a retry, depending on the isolation level.

The SQL below is a template for the service to control, **not an unattended script**. Customer `42`, product `p123`, and its inventory row must already exist. The service has assigned order ID `9001` and validated the agreed price of USD 25.00. `RETURNING` gives the service the rows that the update changed.

```sql
BEGIN;
UPDATE inventory
SET available = available - 1
WHERE product_id = 'p123' AND available >= 1
RETURNING product_id;
-- Application must inspect the result before executing more statements:
-- zero rows: ROLLBACK, report unavailable, and stop this path.
-- exactly one row: continue below.
INSERT INTO orders (id, customer_id, status)
VALUES (9001, 42, 'confirmed');
INSERT INTO order_items
    (order_id, product_id, quantity, unit_price_minor, currency)
VALUES (9001, 'p123', 1, 2500, 'USD');
COMMIT;
```

If the update returns no rows, the service rolls back and reports that stock is unavailable; it must not run the inserts. If it returns one row, the service inserts the order and item. If an insert or another required step fails, the service rolls back, and the database restores the stock too. The service reports success only after commit succeeds.

The `CHECK (available >= 0)` constraint rejects negative stock as a second defense; it does not replace the conditional update. For an order with several products, the service reserves every requested quantity in the same transaction. If any reservation fails, it rolls back all of them.

A **lock** makes a transaction wait before performing an operation that conflicts with another transaction's work. A **deadlock** occurs when transactions form a cycle waiting for each other's locks. The service should update inventory rows in a fixed product-key order to reduce that risk.

Other methods can protect more complex decisions. With a **version check**, the service reads a version number and updates the row only if that number still matches, increasing it on success. If another request changed the version, the service reads again before deciding whether to retry. With **explicit row locking**, the service asks the database to lock rows before it reads the values used for a decision; other conflicting operations must wait.

At **serializable isolation**, the database allows committed transactions to produce results equivalent to running them one at a time. It may reject a transaction to preserve that guarantee. This does not by itself promise real-time ordering. If the database reports a documented retryable failure, the service retries the **whole transaction**, not just its last statement, and limits the number of attempts.

**Idempotency** means that repeating a request has no additional effect. To recognize a repeated order request, the service can add a unique, non-null request key to `orders` and reuse it on every attempt. The small schema above omits that field. If the connection fails during commit, the service may not know whether the order committed. It must check using the same key and keep that key if it retries; generating a fresh order ID and request key could create a second order.

## Index the access pattern

An **index** is a separate lookup structure that the database maintains when table data changes. Instead of checking every order, the database can use an index to find one customer's orders and read them in the requested order. The service's recent-order query and a candidate index are:

```sql
SELECT id, status, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC, id DESC
LIMIT 20;

CREATE INDEX orders_customer_recent
ON orders (customer_id, created_at DESC, id DESC);
```

This is a **composite index**, meaning it covers several columns. It groups entries by customer, then by decreasing creation time and ID. The database can find customer `42` and read the first 20 matching entries. If two orders have the same time, their unique IDs give them a fixed order. This column order does not provide the same benefit for listing all customers' orders by time.

The database's **query planner** chooses how to run a query. Its **execution plan** describes which tables and indexes it will read and whether it must sort the results. PostgreSQL's `EXPLAIN` shows the plan and estimates; `EXPLAIN ANALYZE` runs the statement and reports measurements. Use representative data and safe workloads: analyzing a write actually performs that write.

Compare estimated and actual row counts, check whether the database sorts, and measure how much data it reads. **Selectivity** describes how narrowly a condition filters rows. If most rows match, the planner may read the table directly because following index entries would cost more. One million 200-byte rows contain about 200 MB of raw data before storage overhead; avoiding a full read can help, but does not guarantee a response time.

Each index takes storage space. When the service inserts an order or changes an indexed value, the database must update the index as well as the table. Add indexes for queries that need them, then measure both read speed and write cost rather than indexing every column.

## Choose by workload

For this order service, a relational database is a reasonable starting point because it can check references between products and orders and save stock reservations with order records in one transaction. Before choosing a particular database, test its queries and check how much time requests spend waiting for locks under the expected load.

A **document database** stores records that can contain nested fields and lists. The service could store an order and its items in one document and read them together. Stock may still live in separate documents, so the service must check whether the database can save those changes together and how it handles competing updates.

A **key-value store** retrieves a value using its key. The service could use a product ID to fetch a product summary. If it also needs to find products by another field, it must check what additional queries the store supports. It must also check which changes can be saved together and whether reads can return older values.

**Object storage** holds files or other large byte sequences under object keys. The service can save product images there and keep their keys and ownership in the database. These stores normally do not share a transaction. If an upload succeeds but saving its database record fails, the service must retry safely or remove the unreferenced object. It must also set access rules and decide when to delete old images.

“NoSQL” groups different non-relational systems; it does not specify their guarantees. Some support transactions, and relational databases can store JSON and serve large workloads. Choose by the required reads, writes, failure behavior, capacity, and operating cost, not by the category alone.

## Evolve the schema safely

During deployment, old and new service versions may use the same database. If a new column immediately requires a value, old versions may fail to insert rows because they do not supply it.

First, add a column that allows missing values, checking whether that operation locks or rewrites a large table. Deploy service code that accepts missing values when reading and supplies the new value when writing. Once old writers have stopped, **backfill** the column by filling existing rows in small batches. Verify that every required row has a value, including rows written during the change, before adding the final constraint. Remove old columns only after no deployed code uses them.

## Exercise

1. The service reduces stock, but inserting the order item fails. What must the service do, and what happens to stock?
2. Two workers, service processes that handle background tasks, receive the same order confirmation. How can they avoid saving duplicate notification records? Does that also guarantee that the customer receives exactly one external email?

??? success "Answer guidance"
    The service must roll back the transaction. The database then undoes the stock decrement and any uncommitted inserts, so no reservation remains for the failed order. If the service had committed the stock change separately, rolling back the order would not restore it.

    Give notification records a unique `(order_id, notification_type)` constraint and require both values with `NOT NULL`. When workers try to save the same notification, the database allows at most one record to commit. A worker that finds a duplicate treats the notification as already recorded rather than creating another one.

    The constraint does not control the email provider. If a worker sends an email and crashes before recording success, a retry may send it again. If it records completion before sending and then crashes, the email may never be sent. The service can save a pending notification in the order transaction and let workers retry delivery. If the provider supports an idempotency key, workers reuse the same key so the provider can recognize retries, within its documented limits. Without that guarantee, the design must account for possible duplicates or loss; see [Messaging](05-async.md).

[Next: Scaling & Caching →](04-scaling.md)
