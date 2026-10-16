# Exercises & Reference

## Put the ideas together

This page helps learners who have read the foundations practice designing a small service.
Engineers can also use the questions to review a design. The exercises ask you to explain
what the service does, where it stores information, and what happens when a request fails.

Attempt each exercise before opening its answer guidance. Write down your assumptions and
draw the steps for one successful request. State which rule the service must always enforce.
Then explain what happens if two requests arrive together, a user retries, or a dependency
is unavailable. Different designs can work if they meet the requirements and explain their limits.

Use [Requirements](01-thinking.md) to decide what the service must do, [Storage](03-storage.md)
to decide how it saves information, and [Messaging](05-async.md) to decide how it handles work later.
Use the pocket reference when a term is unfamiliar; you do not need to memorize the terms.
For longer worked examples, compare your reasoning with [URL Shortener](designs/url-shortener.md),
[Notifications](designs/notification-service.md), and [Distributed Cache](designs/distributed-cache.md).

## Run a 45-minute design session

Spend 45 minutes on a first attempt. Complete each step before adding more components,
so you have time to explain failures as well as successful requests.

| Minutes | Work | Deliverable and purpose |
| --- | --- | --- |
| 0–8 | Decide what is included | Write three requirements and two exclusions so the reader knows what you will solve. |
| 8–15 | Estimate requests and storage | Show your assumptions and calculations so the reader can check how much work the service must handle. |
| 15–25 | Draw the service and its requests | Follow one read and one write. Show which component saves each fact and which components use it. |
| 25–35 | Choose three failures | Explain how the service responds and recovers so the reader knows what a user can expect. |
| 35–45 | Review your decisions | Explain why you chose the design and what you would measure to find problems or reconsider a choice. |

If you have not measured database capacity, say so rather than claiming that it can handle
the load. Change one assumption at a time and check which decisions it affects.
Calculations help you choose what to test; they do not replace a load test.

## Exercise A: library reservations

Design a service that lets signed-in library members browse the catalog and reserve a
specific physical copy. Do not include loans, waiting lists, or payments.

**Requirements and assumptions**

- The library has 50,000 members and 100,000 physical copies.
- Members make 10,000 catalog reads/day and 1,000 reservation requests/day.
  Assume each operation's peak rate is 10× its daily average.
- A copy can have at most one active reservation. It becomes available when that reservation is released.
- Catalog descriptions may be up to one minute out of date. The service must confirm a
  reservation in its database before reporting success; a cached availability result is not enough.
- A request or response may be lost. Members may retry or request the same copy at the same time.

**Tasks**

1. Draw the simplest service and database. Show where the service saves reservations.
2. Estimate peak reads/sec and reservation requests/sec. Explain whether those numbers
   justify adding a cache or splitting data across databases.
3. Follow two requests for the same available copy. Explain how one succeeds and why
   the database prevents the other from creating a second active reservation.
4. Suppose the database saves a reservation but the response is lost. Explain how the
   service recognizes a retry, checks the member's access, and returns the saved result.
   State how long the service keeps that result and what the member should do afterward.

??? success "Answer guidance"
    Start with an API and a relational database. Peak catalog reads are
    `10,000 / 86,400 × 10 ≈ 1.16 requests/sec`. Peak reservation requests are
    `1,000 / 86,400 × 10 ≈ 0.116 requests/sec`. These rates alone do not show a need
    for a cache or multiple databases. Measure bursts, query cost, and response times before adding them.

    When a member requests a copy, the service asks the database to change it from
    available to reserved only if it is still available. If the update changes one row,
    the reservation succeeds. If another request has already reserved it, the update changes
    no rows and the service reports a conflict. Checking availability and then saving in a
    separate step is not enough: both requests could pass the check before either saves.
    A database uniqueness rule allowing only one active reservation per copy is another option.

    The member sends a request identifier, called an idempotency key. The service associates
    it with the signed-in member and reservation operation, then saves the reservation and
    retry result in one database transaction. If the response is lost, the service uses the
    same key to return the saved result instead of making another reservation. It rejects
    reuse of the key with different input. Concurrent requests with the same key must also
    resolve to one saved result, for example through a database uniqueness rule.

    The service keeps retry results for a stated period that covers supported retries.
    After that period, the member must check the reservation's current status rather than
    assume the old request failed. The service checks that the member owns a reservation
    before allowing them to read or release it. If the database is unavailable, the service
    cannot confirm a new reservation. It must not approve one from cached availability.

## Exercise B: reminders

Design a service that saves email-reminder jobs in a queue for workers to process.
Explain separately when the worker has finished and what the service knows about email delivery.

**Requirements and assumptions**

- The queue starts empty and receives 60,000 jobs at a constant rate over ten minutes.
- Workers together complete 80 jobs/sec while busy. Assume no retries for the first
  calculation and no new arrivals after ten minutes.
- The queue keeps jobs in durable storage and may give a worker the same job more than once.
  Each job asks the worker to send one email through an external provider.
- The provider may fail temporarily or reject a request permanently. If a request times
  out, the worker may not know whether the provider accepted it.

**Tasks**

1. Calculate how many jobs remain at ten minutes and how long workers need to finish them.
2. Explain when a worker tells the queue it has finished a job. Decide when it should retry,
   when it should stop, and where failed jobs go for inspection.
3. Follow a job whose worker crashes after the provider accepts the email but before the
   worker tells the queue it has finished. Explain whether another worker could send it again.
4. Define what a completed job means. Choose measurements that show when reminders are delayed.

??? success "Answer guidance"
    Jobs arrive at `60,000 / 600 = 100 jobs/sec`, but workers complete only 80/sec.
    The queue stores the jobs workers cannot yet process. After ten minutes, workers have
    completed `80 × 600 = 48,000 jobs`, leaving `12,000`. With no new arrivals,
    they need `12,000 / 80 = 150 seconds` more: 12.5 minutes from the start.
    Retries and provider rate limits can make this take longer, so the estimate is not a guarantee.

    The worker records the outcome in durable storage before acknowledging the job to the
    queue. The acknowledgment tells the queue that it can remove the job. If the queue
    gives a worker that job again, the worker checks its saved outcome first. If it already
    completed the job, it acknowledges it without sending again. If a failure is temporary,
    the worker retries with the same job ID and waits longer between attempts.
    It adds a random delay so many workers do not retry together. It stops after a chosen
    number of attempts or elapsed time and saves the failed job for inspection.
    It does not repeatedly retry a permanent rejection such as an invalid destination.

    If the worker crashes after the provider accepts the email, the queue may give the job
    to another worker. That worker may send it again because the first worker did not save
    the outcome. A local “sent” flag cannot prevent every duplicate. If the provider supports
    idempotency keys, workers can reuse the job's key so the provider recognizes the repeated
    request. This works only within the provider's documented key rules and retention period.
    Without that support, duplicates remain possible.

    The service reports provider acceptance separately from delivery confirmation, if the
    provider supplies it. Neither proves that exactly one email reached every inbox.
    Measure both the number of waiting jobs and the age of the oldest job, because even a
    short queue can contain an overdue reminder. Record failures and unknown outcomes,
    but do not put sensitive email content in logs.

## Review a design

Follow requests through the design instead of reviewing only its diagram.
If an answer is missing, record what you need to measure or test.

| Ask | Look for |
| --- | --- |
| What happens on a successful request? | Explain what each component does and why the next step needs its result. |
| Where does the service save each fact? | Identify the saved record the service trusts when copies disagree. |
| What if the response is lost after saving? | Show how the service recognizes a retry and lets the user check the result. |
| What if two requests change the same record? | Explain how the database enforces the rule both requests must follow. |
| What if the cache or queue is unavailable? | Explain whether the service can continue safely, and when it rejects work. |
| What information may be out of date? | State how old it may be and which decisions may use it. |
| Can one user access another user's data? | Show where the service checks access and keeps sensitive data out of logs. |
| How does an operator find a problem? | Choose a measurement that shows user impact and explain what action follows. |
| Can the service recover saved data? | State acceptable data loss and recovery time, then explain how to test a restore. |
| Can a component be removed? | Keep it only if you can explain which requirement it meets. |

## Pocket reference

These terms connect the exercises to the chapters that explain their use.

| Term | Meaning | Chapter |
| --- | --- | --- |
| p95 | About 95% of measured requests finish within this duration. State which requests and time period you measured. | [Requirements](01-thinking.md) |
| Deadline | The time by which a request must finish, including time spent waiting for other services. | [Networking](02-requests.md) |
| Transaction | The database saves a group of changes together, or saves none of them. | [Storage](03-storage.md) |
| Cache hit | The service finds a requested value in its cache. The copy may be out of date. | [Scaling](04-scaling.md) |
| Idempotency | Retrying the same operation does not repeat its intended effect, such as creating a reservation. | [Messaging](05-async.md) |
| Outbox | The service saves a message to send in the same transaction as its data change. A worker sends it later. | [Messaging](05-async.md) |
| Network partition | Parts of a distributed system cannot communicate, even though they may still be running. | [Reliability](06-reliability.md) |
| RPO / RTO | RPO limits how much recent data may be lost, measured in time. RTO limits how long restoring service should take. Both are targets. | [Reliability](06-reliability.md) |
| SLO | A target for measured service behavior over a stated period, such as the share of requests that succeed. | [Operations](07-operations.md) |

```text
Average requests/sec = daily requests / 86,400
Peak requests/sec    = average x assumed peak multiplier
Payload bytes/sec    = responses/sec x average response bytes
Raw retained bytes   = writes/day x bytes/write x retained days
Cache misses/sec     = cache lookups/sec x (1 - hit fraction)
Backlog growth/sec   = max(0, arrival rate - completion rate)
Drain time           = backlog / spare completion capacity
```

Use the same units and workload when comparing rates. The storage formula counts only
the saved records; indexes, copies on other servers, and other overhead require more space.
To calculate drain time, subtract continuing arrivals from the workers' completion rate.
The result must stay positive and constant for this formula to apply.
Multiplying an average by an assumed peak factor does not prove the service can handle every burst.

## Conceptual sources

Read these optional references when you want more detail on a decision in your answer.

- [PostgreSQL: transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
  explains what happens when database transactions run at the same time and why some must be retried.
- [Amazon Builders' Library: idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
  explains how a service uses request identifiers to recognize retries without repeating the requested action.
- [Google SRE: service level objectives](https://sre.google/sre-book/service-level-objectives/)
  explains how to choose measurements and targets that reflect what users experience.

Finish by explaining your design without product names. Then change the request rate or how
old a cached value may be. Explain which decisions change and which rules the service must still enforce.

[Return to the learning map →](index.md)
