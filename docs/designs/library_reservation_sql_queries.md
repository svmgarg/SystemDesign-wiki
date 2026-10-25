# Library Reservation: SQL Transaction Queries

This example uses PostgreSQL-style SQL and the schema:

- `BookAvailability(book_id, date, total_count, avail_count)`
- `Bookings(booking_id, request_id, user_id, book_id, start_date, end_date, status)`

Assumptions:
- The reservation start date is inclusive.
- The reservation end date is exclusive. A booking from October 15 to October 21 occupies October 15–20.
- Each reservation consumes one copy.
- `request_id` is an idempotency key, with a unique constraint such as `UNIQUE (user_id, request_id)`.

## 1. Start a transaction and lock the date rows

```sql
BEGIN;

SELECT book_id, date, avail_count
FROM BookAvailability
WHERE book_id = 101
  AND date >= DATE '2026-10-15'
  AND date <  DATE '2026-10-21'
ORDER BY date
FOR UPDATE;
```

`FOR UPDATE` locks the rows returned until the transaction commits or rolls back. Concurrent transactions trying to lock the same rows must wait.

**Important:** this locks existing rows only. The application must verify that all six expected date rows exist. Missing date rows must be treated as an error, not as available capacity.

## 2. Verify all dates have capacity

After the locking query, the application or a stored procedure must verify:

- Exactly six rows were returned.
- Every row has `avail_count > 0`.

If either condition fails, run:

```sql
ROLLBACK;
```

Return an unavailable result. No availability counters or booking records have been changed.

## 3. Decrement every date

If the check succeeds, decrement the counters:

```sql
UPDATE BookAvailability
SET avail_count = avail_count - 1
WHERE book_id = 101
  AND date >= DATE '2026-10-15'
  AND date <  DATE '2026-10-21'
  AND avail_count > 0;
```

The application must verify that exactly six rows were updated. If fewer than six rows were updated, roll back the transaction.

The row locks protect the check/update sequence for overlapping reservations that follow the same locking protocol. The `avail_count > 0` predicate is an additional safeguard.

## 4. Insert the booking

```sql
INSERT INTO Bookings
    (request_id, user_id, book_id, start_date, end_date, status)
VALUES
    ('req-abc-123', 2001, 101,
     DATE '2026-10-15', DATE '2026-10-21', 'CONFIRMED');
```

## 5. Commit everything together

```sql
COMMIT;
```

The availability decrements and booking insert commit as one transaction. If any step fails, issue `ROLLBACK`; the database undoes all changes made in that transaction.

## 6. Full flow in pseudocode

```text
BEGIN

Lock all existing availability rows for the requested dates.

IF number of rows != number of requested dates
   OR any avail_count <= 0:
    ROLLBACK
    return UNAVAILABLE

Decrement avail_count for all requested dates.

IF number of updated rows != number of requested dates:
    ROLLBACK
    return UNAVAILABLE

Insert booking using a unique idempotency/request ID.

COMMIT
return CONFIRMED
```

In production, put this logic in one well-defined service transaction or stored procedure. Ensure every reservation path uses the same locking protocol.

## 7. Why this prevents partial reservations

Suppose availability is:

| Date | `avail_count` |
|---|---:|
| Oct 15 | 2 |
| Oct 16 | 2 |
| Oct 17 | 1 |
| Oct 18 | 1 |
| Oct 19 | 1 |
| Oct 20 | 0 |

The check fails because October 20 has no available copy. The transaction rolls back, so none of the dates are decremented and no booking is inserted.

## 8. Important production details

- Add a primary key or unique constraint on `(book_id, date)`.
- Add a constraint such as `CHECK (avail_count >= 0 AND avail_count <= total_count)`.
- Make `request_id` unique for the appropriate scope so a retry cannot create a duplicate booking.
- If a request times out, check whether its transaction committed before releasing Redis capacity.
- Redis and SQL cannot commit atomically together. Treat Redis rollback as a compensating action and reconcile cache state when the SQL outcome is uncertain.
- For very high contention, consider a stored procedure, fixed time slots, or another reservation strategy after load testing.
