# Security & Operations

Security controls prevent callers from reading data or taking actions without permission.
Operations helps the team understand how the service behaves, release changes safely,
and recover from failures. A failure can expose data, return wrong results, or stop
users from completing their work.

<a id="the-situation"></a>
## Purpose and scope

The service checks who sent each request and what that caller may do. The team measures
whether users can complete their work, then checks new releases against those measurements.
Encryption does not replace permission checks. Monitoring helps the team detect failures;
it does not prevent them. A running service may still return or store incorrect data.

## Protect trust boundaries

A **trust boundary** separates callers or components that have different permissions
or owners. When a request crosses that boundary, the receiving service verifies the
caller, checks permission, and validates the submitted data. An internal network address
does not prove that a caller is trusted; one service must also check calls from another.

```text
Client -- encrypted transport --> Service -- restricted account --> Database
                                    |
                                    +--> External provider [separate boundary]
```

**Authentication** means checking who the caller is. After login, the service can use a
**session**, a record of that login, to recognize later requests. **Authorization** means
checking whether the caller may take the requested action. Login does not prove that a
customer owns a requested order.

The service takes the customer identity from the verified session, not from a customer
field in the request. It uses Structured Query Language (SQL) to look up the requested
order only if that customer owns it:

```sql
SELECT id, status FROM orders
WHERE id = :order_id AND customer_id = :authenticated_customer_id;
```

The database treats the named parameters as values, not executable query text.
If no row matches, the service does not return the order. It also checks permission
before changing or deleting an order or returning related data. Staff access requires
a separate permission rule; a staff login alone is not enough.
For a write, the service can include the ownership condition in the update itself.
If it checks separately, it groups the check and write in a **transaction**, so they
succeed or fail together, and locks the row to prevent ownership changing between them.

| Control | What the service does | What it does not replace |
| --- | --- | --- |
| Least privilege | Gives each service account only the data access and operations it needs | Checks on individual user requests |
| Input validation | Checks types, sizes, ranges, and allowed values before expensive work | Permission checks, even when the input is valid |
| Parameterized SQL | Passes submitted values separately from query instructions | A fixed list of permitted choices for dynamic table names or sort options |
| Encryption | Makes data unreadable without the right key, during transfer or storage | Permission checks and control over who can use the key |

Hypertext Transfer Protocol Secure (HTTPS) encrypts the connection and checks the
server's identity when the client validates its certificate. It does not prove that
the service handles data safely. Before changing data after a provider notification,
the service verifies the sender using the provider's supported method. It also rejects
replayed notifications where needed: a valid old message must not repeat an action.

Use maintained authentication libraries or an identity provider that handles login.
A browser stores a session reference in a cookie and sends it with later requests.
The cookie's `Secure` flag limits it to secure connections; `HttpOnly` prevents scripts
from reading it; `SameSite` limits when the browser sends it across sites. Also protect state-changing requests
against **cross-site request forgery**, where another site makes the browser submit
an unwanted action using its session. Cookie flags alone are not a complete defense.
Keep secrets outside source control, request addresses, and logs. Limit who can read
them, provide a way to replace or revoke them, and avoid sharing them between services.

## Limit abuse and data exposure

A **rate limit** sets how much work the service accepts over time. It reduces abuse
and helps keep enough capacity for other users. A **token bucket** gives each caller
an allowance of tokens; requests use tokens, and the allowance refills at a fixed rate.
A full bucket of 20 tokens, refilling at 5 per second, allows 20 immediate one-token
requests. Over sustained use, the accepted rate approaches at most 5 per second.

The service can limit requests by account, operation, requested resource, or Internet
Protocol (IP) address. Many users can share an address, and an attacker can use many
addresses, so address limits alone are insufficient. If several service instances must
share one limit, they must coordinate; separate full buckets allow a larger total.
Slow requests can still build up within the rate limit. Limit how many run at once,
set timeouts, and cap the number waiting in a queue.

Store data only for a stated purpose and period. With **payment tokenization**, a
payment provider stores card details and returns a reference the service can use.
That reference and access to the provider still need protection. Storage encryption
does not hide data from an application or person who has permission to read it.

- Keep passwords, session tokens, card data, and full private request bodies out of collected diagnostic data.
- Record who made sensitive changes, what changed, when, and whether the action succeeded; restrict access to these records.
- Define when to delete primary records, cached copies, exports, and backups. When restoring a backup, prevent previously deleted records from becoming available again.

## Observe user outcomes

**Observability** is the ability to explain service behavior from the data it produces.
The team first checks whether users receive correct results in time. It then uses
metrics, logs, and traces to find which part of the service needs investigation.

| Signal | Definition | Useful evidence |
| --- | --- | --- |
| Metrics | Numbers measured or summarized over time | Request rate, error proportion, response times, age of oldest queued item |
| Structured logs | Events recorded with named fields | Request identifier, operation, safe error code |
| Traces | Connected records showing the steps and time spent handling a request | Time waiting for another service |
| Span | One timed step in a trace | A database call or outgoing provider request |

```text
Slow responses --> use metrics to find affected operations and versions
               --> use a trace to find which call took the time
               --> use related logs to investigate what happened
```

The service passes a **correlation identifier**, a value that links records for the
same work, between calls. This value helps find related records; it grants no access.
The team checks recent changes and the services it calls before deciding the cause.
Low processor use does not prove health: requests may be waiting for a database lock.

Metric labels group measurements by categories such as operation or result. Avoid a
label for every order: each distinct value adds more measurements to store and query.
Keep specific identifiers in protected logs or traces only when needed. Set who may
read them, what private fields to remove, and how long to keep them. **Sampling** keeps
only some records; missing records or missing measurements can hide failures.

## Set objectives and actionable alerts

The team chooses a measurement that reflects user experience, then sets a target for
it over a stated period. These terms distinguish the measurement from the promise:

| Term | Meaning |
| --- | --- |
| Service level indicator (SLI) | A measurement such as the proportion of requests that succeed |
| Service level objective (SLO) | The target for that measurement over a stated period |
| Service level agreement (SLA) | A contractual promise with stated consequences, not just an internal target |
| Error budget | How much failure the objective allows during that period |

For a monthly objective of 99.9% successful valid checkout attempts and 1,000,000 eligible attempts:

```text
Allowed failures = 1,000,000 x (1 - 0.999) = 1,000 attempts
```

The team defines which attempts count and how it counts retries before measuring.
A correctly handled payment decline counts as a good result only if the definition
says so. This budget counts failed attempts, not minutes of downtime. Measure response
time and correctness separately when a success count would hide problems.

Send alerts when users remain affected or failures use the budget quickly, rather than
for every small change. Each alert needs a responsible person or team and a useful next
action. If the budget runs out, the team can pause risky releases and prioritize repairs.
The budget guides that decision; it does not fix the failure.

## Deploy and recover safely

A **deployment** puts a new service version into use. The team sends it limited traffic,
checks results, and prepares a recovery path before sending more traffic.

| Technique | Use when | Constraint |
| --- | --- | --- |
| Rolling deployment | Replace running instances gradually | Old and new versions must work together while both run |
| Canary release | Send a small share of traffic to the new version first | Check correctness, errors, and response time; a small sample can miss rare failures |
| Rollback | Return to a version known to work | This does not undo external actions or automatically repair stored data |
| Runbook | Follow a written procedure for diagnosis and recovery | Include safe steps, checks, who is responsible, and when to ask for help; rehearse it |

A **schema** defines how the database organizes data. To change it safely, first add
fields that old code can tolerate. Release code that works with both formats, fill
the new fields in existing records, and switch reads and writes to the new format.
Keep old fields current while older versions still use them.
Remove old fields only when older code no longer needs them, including any version
the team may roll back to. If old code cannot read the new data, the team may need to
release a corrected version instead of rolling back; see [Storage](03-storage.md).

Test expected load and slow or failed services before release. During an incident,
first reduce ongoing harm, communicate the impact, and keep a timeline of actions.
After recovery, check data and delayed work as well as current requests. Review causes
without blame. Test backup restores against agreed limits on data loss and recovery time.

Estimate the cost of processing, storage, monitoring data, backups, network transfer,
and the team's operating work. Keeping fewer diagnostic records saves money but leaves
less evidence for investigations. Provide spare capacity for expected load and failures.

## Exercise

A service verifies login, then runs `SELECT ... WHERE id = ?`. Why is that insufficient?
What can it safely log when it denies access? What should the team check before rolling
back a release that wrote a new data format?

??? success "Answer guidance"
    - The service must check that the caller owns the order or has a specific staff
      permission before returning it. Query parameters stop submitted values from
      becoming query instructions; they do not decide who may read the result.
    - It can log a correlation identifier, operation, permitted caller identifier,
      and `access_denied`. Restrict access and how long records are kept. Do not log
      another customer's order or credentials, or unnecessarily reveal that an order exists.
    - Check that old code can read current data and still use the database and other
      service interfaces. Rollback does not reverse payments or repair records.
      A corrected release or a separate process to check and repair records may be needed.
    - Check successful requests, response time, correct data, and delayed work after
      recovery, not just whether the process runs. Check data-loss and recovery-time limits.

[Next: URL Shortener →](designs/url-shortener/index.md)
