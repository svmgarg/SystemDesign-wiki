# Design a Notification Service

## What are we building?

A **notification service** accepts notification requests and manages sending through an external email provider.
The caller submits a recipient user ID, an approved template name, and values to insert into that template.

```text
Caller --> API --> Stored request --> Background worker --> Email provider
```

The service checks the request, saves it in its database so it survives a restart, and returns a notification ID.
A **worker**, a background process, loads the saved request and checks whether the recipient may receive the email.
If sending is allowed, the worker submits the email to the provider and saves the result.
If sending fails, the service retries or records why it cannot continue.

The caller can continue after `202 Accepted`; this response means the request is saved, not sent.
**Provider acceptance** means the provider acknowledged the submission. **Provider-reported delivery**
means the provider later reported delivery under its own rules. Neither proves inbox placement or reading.

## Why this needs design

The service uses a **durable queue** to hold messages until workers process them.
If a worker stops without acknowledging a message, the queue supplies it again.
The service cannot save a database row and a queue message in one database transaction.
If it saves the row and crashes before publishing the message, the worker will not know the request exists.

The service therefore saves an **outbox** row with the notification row. The database saves both or neither.
The outbox row tells a **relay**, another background process, which notification ID to publish.
After a restart, the relay can still find that row and publish the message.

The caller may repeat a request if it loses the API response. **Idempotency** means the repeat creates no new notification.
**Deduplication** means recognizing a repeated request or event instead of treating it as new work.
The queue provides **at-least-once processing**: a worker may process a message again.
These checks prevent repeated local work, but they cannot prove that an email was
sent only once. The provider may accept a submission even if its response is lost.

## Scope and targets

Each request asks for one transactional email to one registered user. The service looks up a verified address;
the authenticated caller cannot supply an arbitrary address or body. A **tenant** is a customer organization
whose users and notification records the service keeps separate from those of other tenants.

| Area | Requirement |
| --- | --- |
| Included | Approved templates, preferences, retries, status, provider feedback |
| Excluded | Marketing, SMS/push, scheduling, attachments, global ordering, inbox guarantees |
| Deployment | One provider in one region; no regional failover guarantee |
| Acceptance target | 95% of API acceptance responses in less than 200 ms, measured separately from sending |
| Submission target | 99% of eligible accepted requests submitted within 60 seconds when healthy |

The service measures submission delay from the time it saves the request to the
provider's acknowledgment. If preferences prevent sending, the service records
`suppressed` and excludes that request from the eligible-submission denominator.

## Capacity

Assume callers submit one million eligible requests/day, peaks reach 10x the average,
and workers make 1.2 provider attempts per request. These are planning estimates,
not measured limits; workers may need more attempts during an outage.

| Estimate | Calculation | Result |
| --- | --- | --- |
| Average requests | 1,000,000 / 86,400 | 11.57/s |
| Peak requests | 11.57 x 10 | about 116/s |
| Average attempts | 1,000,000 x 1.2 / 86,400 | 13.89/s |
| Peak attempts, same retry ratio | 13.89 x 10 | about 139/s |
| Thirty days of 1 KB request rows | 1,000,000 x 30 x 1,000 bytes | 30 GB |

The storage estimate uses decimal units and excludes indexes, outbox rows, attempts,
and replication. If the provider is unavailable for 30 minutes and workers complete
no jobs, round incoming requests to 120 jobs/s:
`120 x 1,800 = 216,000` waiting jobs, about 216 MB at 1 KB/job.
If recovery completes 200 jobs/s while arrivals remain 120/s, net drain is
`200 - 120 = 80/s`; clearing the backlog takes `216,000 / 80 = 2,700 s = 45 min`.
Workers must actually complete 200 jobs/s after accounting for retries and provider
quotas; adding workers alone does not establish this rate. The outage also causes
requests to miss the 60-second target, which applies when the system is healthy.

## API and status

```http
POST /v1/notifications
Authorization: Bearer example-token
Idempotency-Key: order-482-confirmation-user-17
Content-Type: application/json

{"recipient_user_id":"user-17","template":"order-confirmed","data":{"order_id":"482"}}
```

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{"notification_id":"ntf_91","status":"accepted"}
```

The service authenticates the caller and checks that it may send this business event to this recipient
using this template. It obtains the tenant from trusted credentials, not an unchecked request field.

The caller supplies an idempotency key. The service looks it up within **tenant + caller**,
so another caller cannot reuse it to read or change this request. If the key is new, the service creates the notification.
If the key exists with the same payload, the service returns the existing ID and current status without another send.
If the payload differs, it returns `409 Conflict`. The service compares a **payload hash**, a fingerprint
of the validated request. It first puts JSON object keys in a consistent order while preserving array order and values.

The service returns `202` only after the database saves the notification and outbox rows together.
If the response is lost or the caller cannot tell whether the save succeeded, it retries with the same key.
The service never acknowledges unsaved work. It returns `503` if database storage is unavailable.

The caller uses `GET /v1/notifications/ntf_91` to read status; the service checks its
access before returning the row. Other errors are `400` for invalid input, `401` for
missing or invalid authentication, `403` for denied access, and `429` for exceeded quotas.

| Status | Meaning |
| --- | --- |
| `accepted` / `queued` / `sending` | Recorded / published / attempt in progress |
| `provider_accepted` | Provider acknowledged submission; not proof of delivery |
| `delivered` | Authenticated provider-reported delivery under its semantics; not inbox/read proof |
| `suppressed` / `failed` | Preference exclusion / known terminal failure |
| `unknown` | Ambiguous attempt; timeout may hide a successful submission |

## Data model

```text
notifications(id, tenant_id, caller_id, idempotency_key, payload_hash,
              recipient_id, template_version, data, status, next_attempt_at,
              lease_until, claim_token, created_at)
  UNIQUE(tenant_id, caller_id, idempotency_key)
outbox(id, notification_id, available_at, published_at NULL)
attempts(id, notification_id, attempt_no,
         claim_token, destination_ref, provider_request_key, provider_message_id NULL, outcome)
preferences(tenant_id, user_id, category, enabled, updated_at)
  PRIMARY KEY(tenant_id, user_id, category)
provider_events(provider, event_id, provider_message_id,
                notification_id NULL, received_at, event_type)
  UNIQUE(provider, event_id)
```

The database allows only one notification for each tenant, caller, and idempotency key.
If two requests arrive together, one insert wins; the service reads that row and compares its payload hash.
It returns the existing result or a conflict. The service saves the approved template version and values
so a later template change does not change the pending message.

The service retains idempotency records for a documented period, for example 30 days.
After it removes a record, the same key may create another notification.
It keeps unresolved records beyond that period rather than forgetting an uncertain send.

## Architecture and workflows

```text
Trusted app --> API --> Database [notification + outbox transaction]
                           |
                       Outbox relay --> Durable queue --> Worker --> Provider
                           ^                              |
                           +------- attempts/status ------+

User preferences --------> Database <-- verified provider webhook
Trusted app -- status GET --> API --> Database
```

**Accept and publish**

The API checks access and input, saves notification and outbox rows in one database transaction, and returns `202`.
The relay finds outbox rows whose `available_at` time has arrived and publishes their notification IDs.
After the queue confirms that it has durably stored a message, the relay marks that outbox row published.

If the relay crashes after publishing but before marking the row, it publishes the same ID again after restarting.
The database transaction cannot include the queue's write, so the worker must check for completed or repeated work.
The relay does not overwrite a later sending result. The API reads status from the database, not the queue.

**Send**

The worker receives a notification ID and loads its database row. If the request has finished
or the provider has already accepted it, the worker does not send again.
If an earlier result is uncertain, the worker checks that attempt first.
If a retry is not yet due, it leaves the work for the saved retry schedule.

The worker claims due work using a **lease**, a database record granting ownership until a specified time.
The database grants only one current claim per notification. Each claim gets a new token;
the database accepts updates only from the current owner. The worker checks the verified recipient,
eligibility, and category preferences immediately before submission.

The worker saves an attempt before calling the provider. It keeps the destination and message unchanged
when retrying an uncertain submission. If the provider supports idempotency, it uses the same key for each attempt.
The worker calls the provider outside a database transaction so a slow response does not keep a transaction open.

The worker saves the result before acknowledging the queue message. For a retry, it saves the outcome,
`next_attempt_at`, and a new outbox row with a future `available_at` in one transaction.
The relay publishes that row when it becomes due.
If the worker crashes before acknowledging, the queue supplies the message again;
the next worker checks saved state and the due time instead of sending immediately.

**Reconcile**

A **webhook** is an HTTP request that the provider sends to report an event, such as
delivery or a bounce. The service checks the signature over the original request
bytes, verifies the expected provider account, and checks the timestamp against its
allowed replay window. It rejects invalid callbacks rather than changing a notification.

The service finds the notification using the stored provider message ID; it does not
trust a callback's tenant ID. It saves a valid event before acknowledging the callback.
If the provider repeats an event ID, the service does not apply the event again.
If the event arrives before the submission result, the service retains it until it
can match the message ID. If events arrive out of order, it keeps delivery and bounce
facts instead of replacing them with an older acceptance event. Where supported,
the service can also ask the provider for the message's status.

## Reliability decisions

The worker sets a deadline for each provider call and renews its lease while working.
However, a paused worker may resume after its lease expires and still call the provider.
The claim token stops that worker from changing the database; it cannot stop the
provider from accepting the call.

If the provider supports idempotency, it can recognize the repeated key and return
the earlier result without sending again. The worker must follow the provider's
rules for key scope, unchanged payloads, and key retention. Sending through a second
provider does not reuse the first provider's deduplication records and can duplicate
an uncertain send; this design does not automatically fail over to another provider.

The service limits concurrent provider calls to respect quotas and reserves capacity for new work.
It limits attempts and total request age so retries cannot consume capacity forever.

A **dead-letter store** holds work removed from automatic retries. An operator checks previous attempts
before replaying a request with its existing identity. The service keeps an uncertain send marked `unknown`
even after retries end; running out of retries does not prove that the provider rejected the email.

| Failure | Handling |
| --- | --- |
| Retryable rate limit/server error | The worker honors `Retry-After`, increases retry delays up to a limit, and adds randomness so retries do not all arrive together. |
| Timeout or crash around submission | The service records `unknown`; it checks provider status or retries under the provider's idempotency rules. |
| No provider deduplication or status lookup | The operator must choose between a possible duplicate on retry and a possible missed send without retry. |
| Permanent rejection/invalid address | The worker records failure and stops unchanged retries. |
| Worker crash and queue redelivery | A worker claims work after the old lease expires, skips completed sends, and checks uncertain attempts. |
| Attempts or age exhausted | The service saves the work and reason in a dead-letter store for review. |

## Preferences and security

The service assigns each template a preference category. Before sending, the worker
reads that user's current preference for the category. If sending is disabled, it
records `suppressed`. If it cannot read the preference, it postpones sending rather
than assuming permission. An opt-out or address change after this check may not stop
a submission already in progress.

The service restricts recipient lookup, status reads, and preference changes to the
authorized tenant. It checks that the caller may trigger the business event for this
recipient; permission to use a template alone does not authorize an email.
It accepts only approved template versions, escapes inserted values, and limits field
sizes so callers cannot inject arbitrary content.

The service limits requests per caller and recipient. It protects provider credentials
and encrypts sensitive data in storage and transit. Logs identify notifications without
including addresses or payloads. The service deletes request, event, and dead-letter
data according to documented retention periods.

## Metrics and exercise

| Measurement | What it tells the operator |
| --- | --- |
| Age of oldest unpublished outbox row and queue message | The relay or workers may have stopped making progress. |
| Dead-letter count and reasons | Requests have left automatic processing and need review. |
| API acceptance latency/errors; acceptance-to-provider-acknowledgment delay | The API may be healthy even when workers miss the submission target. |
| Attempts, retries, provider latency, unknown outcomes, suppressions | Provider problems and preference exclusions affect different parts of the flow. |
| Authenticated delivery/bounce reports divided by provider-accepted sends | The provider has reported outcomes; the service has not measured inbox placement or reading. |

For outcome rates, the service groups sends by submission period and states how long
it waits for feedback, because callbacks may arrive late. Operators trace a request
by notification ID, not email address. An age alert can expose a stuck request even
when the queue contains very few messages.

**Exercise:** the provider accepts a request, but its response is lost. What next?

**Answer guidance:** the worker records `unknown` and keeps the same notification ID,
provider key, destination, and payload. It asks the provider for status or retries
within the provider's documented idempotency rules. If the provider offers neither
lookup nor deduplication, retrying may send a duplicate and not retrying may miss the
email. The queue and outbox preserve work; neither tells the service which happened.

**Next:** [Distributed cache](distributed-cache.md).
**Compare:** [URL shortener](url-shortener.md) — repeatable reads vs external effects.
