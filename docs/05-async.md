# Messaging

**Asynchronous processing** lets an application accept work and finish it later.
The application saves the work, returns a response, and lets a worker process it.
With **synchronous processing**, the application waits for the operation's outcome
before responding. Use asynchronous processing when the caller can wait for the
result, but should not have to keep the original request open.

## The situation

The application saves an order in its database and records a task to send the
confirmation email. It then returns the order result. A worker reads the task
and calls the email provider. If the provider takes five seconds, the customer
does not need to wait those five seconds for the order response.

The application must distinguish **accepted** work from **completed** work.
Accepted means the application has durably recorded the work; completed means
the promised operation succeeded. For an asynchronous HTTP operation, the
application can return `202 Accepted`, an operation ID, and a status URL.
When the customer checks that URL, the application reads the stored status and
returns pending, succeeded, or failed. Provider acceptance is not proof that an
email reached the inbox. Moving work to a queue does not guarantee its success
or make it finish sooner. Use synchronous processing when the response needs the result.

## Define the moving parts

| Term | Meaning |
| --- | --- |
| Producer | Application or process that sends a message describing work |
| Queue | Holds messages until workers can process them |
| Broker | Service that stores messages and delivers them to workers |
| Consumer / worker | Receives a message and performs the work |
| Acknowledgment | Worker tells the broker it has handled a message |
| Publish/subscribe | Broker sends an event to each independent subscription |

The application sends a message to the broker's queue. The broker stores it
until a worker receives it. After the worker finishes the required operation,
it sends an acknowledgment so the broker can stop delivering that message.

```text
Producer --> Broker queue --> Worker --> Email provider
                ^                |
                +--- acknowledge-+
```

Several workers can share one queue; each message goes to one worker at a time
under normal operation. If billing and analytics each need the same event, the
broker sends a copy to each subscription instead of making them compete for it.

A broker may reserve a message for a worker for a limited time, called a **lease**.
If the worker crashes without acknowledging, the broker makes the message available
again after the lease expires. A slow worker can still be running when this happens.
The worker must renew the lease for long jobs, and handle possible duplicate delivery.

## Close the database/publish gap

The application cannot usually save an order and send a message in one database
transaction. If it saves the order first and crashes before sending the message,
no worker learns that it should send the email. If it sends the message first,
a worker may act on an order that the database never saves.

The application closes this gap with an **outbox**, a database table of messages
waiting to be sent. It saves the order and an outbox row in the **same local
database transaction**. The database commits both writes or neither write.
A separate process, the **relay**, reads committed outbox rows and sends their
messages to the broker. The transaction does not include the broker or provider.

| Sequence | Crash gap |
| --- | --- |
| Commit order → publish | Order exists, event can be missing |
| Publish → commit order | Event exists for an order that may fail |
| Order + outbox transaction → relay | Publication can repeat; work is still discoverable |

The outbox keeps the instruction to send a message even if the application crashes.
The relay can find that instruction after the application restarts.

```text
Application --> Database [order + outbox row: one transaction]
                                  |
                                Relay --> Broker queue --> Worker --> Provider
```

The broker confirms that it accepted the message with a **publisher acknowledgment**.
The relay waits for this confirmation, then marks the outbox row sent.
This confirmation follows the broker's configured storage guarantees; it does
not mean a worker finished the task. If the relay crashes after sending but before
marking the row, it sends the message again. Keep the same event ID on each send
so workers can recognize the duplicate. Monitor how long rows remain unsent:
the outbox preserves work but cannot make a stopped relay publish it.

## Name delivery guarantees precisely

The worker may complete an operation and crash before acknowledging the message.
If the broker delivers it again, the worker may repeat the operation. If the broker
does not deliver it again, a worker that crashed before completing it leaves work
unfinished. These choices explain the delivery guarantees below.

| Model | Meaning | Remaining risk |
| --- | --- | --- |
| At-most-once | A delivery is not retried after an uncertain outcome | Work can be lost |
| At-least-once | Unacknowledged deliveries are retried within the configured policy | Repeated processing can duplicate effects |
| Exactly-once in a scope | A system coordinates processing and output within a defined boundary | External effects can remain outside that boundary |

The broker's guarantee does not cover database changes or provider calls.
At-most-once delivery cannot remove copies the producer already sent.
At-least-once delivery still depends on message retention and retry limits; it
does not promise eventual business success. For “exactly-once,” identify the
protected effect, the failures covered, and how long the protection lasts.

## Make repeated work safe

**Idempotency** means repeating an operation has the same intended effect as
performing it once. For a database-only update, the worker first inserts a
`processed_event(consumer_id, event_id)` row. A database uniqueness constraint
allows only one row for that worker role and event. In the **same transaction**,
the worker applies the business update. If either write fails, it rolls back both.

After the database commits, the worker acknowledges the message. If the broker
delivers it again, the worker finds the committed marker, skips the update, and
acknowledges. Concurrent workers rely on the uniqueness constraint, not a separate
“does this row exist?” check. This is **deduplication**: recognizing work already
done. Keep markers for the supported redelivery and replay period; deleting a
marker lets an old message apply again.

For a payment provider, the worker saves a payment attempt and a stable
**idempotency key** before calling. If the provider supports idempotency, it uses
that key to recognize repeated requests for the same payment. The worker reuses
the key on retries rather than creating another payment attempt.

!!! warning "A local marker cannot make a remote effect atomic"
    If the worker records “sent” before calling, a crash can prevent the call.
    If it records “sent” afterward, a crash can cause it to call again.
    A provider timeout does not prove failure: the provider may have charged
    successfully without returning a response. The worker reuses a supported
    provider key or looks up the payment to resolve the outcome. Provider keys
    have scope and retention limits. Without either capability, the worker
    records the outcome as uncertain; blind retries can charge again.

## Make request retries safe

A client can lose the response after the application accepts its request.
The client sends the same idempotency key when trying again. The application
stores the key, scoped to the customer and operation, with the status and an
input **fingerprint**, a representation used to detect changed inputs.

The application uses a unique key constraint and one database transaction to
save the key, business change, and work record. When another request uses the
same key and input, the application returns the stored result or pending status.
If the input changed, it returns a conflict instead of creating more work.
Document how long keys remain stored. Request deduplication does not replace
worker deduplication: the broker can still deliver an accepted task more than once.

## Retry with a budget

If the provider reports a temporary failure, the worker schedules another attempt.
If it reports an invalid address, repeating the same request will not fix it.
After a timeout, the worker must first account for the uncertain outcome described above.

The worker doubles the wait between attempts up to a limit, called **exponential backoff**,
so it does not keep calling a failing provider at full speed. It adds a random
variation, called **jitter**, so many workers do not retry at the same instant.
For example, three retries wait roughly 1, 2, and 4 seconds, plus jitter.
That makes four total attempts: 100 jobs failing every attempt cause 400 calls.
Set maximum attempts, maximum delay, and a total deadline. Count retries in
clients and provider SDKs too; nested retry loops can multiply the calls.

After the retry limit, the worker or broker moves the message to a **dead-letter
queue**, where it waits for inspection rather than more automatic attempts.
Alert the responsible team. After fixing the cause, an operator can **replay**
the message by submitting it again with its original stable identity.
Bound retention, especially for sensitive payloads; expired messages cannot be replayed.

If messages arrive faster than workers can finish them, the queue grows.
The application can reject or defer new work, and workers can limit concurrent
provider calls. These controls apply **backpressure**: they slow intake or calls
to keep the system within capacity. More workers do not help if the provider
is already overloaded. An unbounded queue only delays the overload.

## Size the backlog

Assume an initially empty queue, arrivals of 120 jobs/sec, and sustained successful
completion of 100 jobs/sec for 60 seconds. Ignore startup and in-flight variation.

```text
Backlog growth = (120 - 100) x 60 = 1,200 jobs
Later arrivals = 80/sec
Spare capacity = 100 - 80        = 20/sec
Drain time     = 1,200 / 20      = 60 sec
```

The queue drains because workers finish jobs faster than new jobs arrive.
Retries consume worker and provider capacity, so count successful completions,
not attempts. Monitor the oldest job's age as well as queue length to see
whether customers are waiting longer than promised.

Workers can finish messages out of order even if they received them in order.
For per-order sequencing, the producer sends an order's messages to the same
**ordered partition**, a queue lane that keeps their sequence. The worker processes
one at a time and holds later messages while an earlier message retries.
A failing message can therefore block later work for that order.

Alternatively, the worker checks the expected order version in the same database
update that changes its state. If the version does not match, it rejects or defers
the change. This detects stale or premature work; it does not put messages back
in order. Neither approach guarantees ordering across all customers.

## Exercise

- Provider charges successfully; worker crashes before acknowledging the queue.
- What happens on redelivery?

??? success "Answer guidance"
    - Reuse the persisted attempt and supported provider key, or reconcile by lookup.
    - Do not generate a new charge key.
    - A local processed marker does not deduplicate a remote charge.
    - With neither provider lookup nor idempotency, preserve uncertainty and reconcile.
    - Acknowledge only after durably recording the resolved outcome.
    - Report accepted or pending separately from completed; offer durable status lookup.

[Next: Reliability →](06-reliability.md)
