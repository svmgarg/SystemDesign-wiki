# System Design Wiki

System design explains how a service receives requests, stores data, and returns
results, including when traffic grows or a component fails. This wiki connects
those concepts to complete service designs.

You need basic familiarity with application code, client/server requests, and
databases. No previous distributed-systems experience is required.

## Start with one service

**[Open the URL Shortener](designs/url-shortener/index.md).** Read the overview,
follow creation and redirection, then try the exercise. Consult the API contract
as needed; save scaling and detailed failure handling for a second pass.

## Browse the foundations

If you prefer concepts first, begin with Requirements and follow the chapter links.

- [Requirements](01-thinking.md): define behavior, correctness rules, and capacity.
- [Networking & APIs](02-requests.md): follow requests and define client contracts.
- [Storage](03-storage.md): save related data and protect concurrent updates.
- [Scaling & Caching](04-scaling.md): add capacity and reuse results safely.
- [Messaging](05-async.md): record work and process it later.
- [Reliability](06-reliability.md): handle failures and recover data.
- [Security & Operations](07-operations.md): check access, monitor, and deploy.

## Continue with other designs

- [Notifications](designs/notification-service.md): accept a request and manage sending through an email provider.
- [Distributed Cache](designs/distributed-cache.md): route reads across cache nodes and protect the database during failures.

Use [Exercises & Reference](10-practice.md) to practice and check your reasoning.
Exercises identify the required material and what a complete answer should cover.
Capacity figures are example assumptions, not measured production guarantees.
