---
hide:
  - toc
---

# System Design Wiki

Personal notes, worked designs, architecture diagrams, and SQL examples.

## Your learning path

Read in order or use these links for reference. The
[shopping-app walkthrough](#a-first-look-inside-a-shopping-app) below introduces
the components.

1. [Requirements](01-thinking.md): scope, correctness rules, and estimates.
2. [Networking & APIs](02-requests.md): requests, protocols, and API contracts.
3. [Storage](03-storage.md): data models, transactions, and concurrent updates.
4. [Scaling & Caching](04-scaling.md): capacity, load balancing, and cached data.
5. [Messaging](05-async.md): queues, workers, retries, and duplicate deliveries.
6. [Reliability](06-reliability.md): timeouts, failures, and recovery.
7. [Security & Operations](07-operations.md): access control and observability.

For a database-specific deep dive, read the
[Apache Cassandra notes](storage/cassandra.md): partitioning, replication,
consistency levels, Commit Log, Memtables, SSTables, compaction, and recovery.

For direct large-file uploads, see
[Multipart Uploads: AWS S3 and Azure](storage/multipart-uploads.md), including
API examples, presigned part URLs, SAS authorization, retries, and finalization.

## Worked designs

- [URL Shortener](designs/url-shortener/index.md): link creation, redirects,
  uniqueness, and caching.
- [Ticket Booking](designs/ticket-booking/index.md): seat holds, payments,
  ownership, and expiry.
- [E-commerce Checkout & Inventory](designs/ecommerce/index.md): SKU quantities,
  TTL-backed reservations, PostgreSQL-authoritative sales, and Redis recovery.
- [Amazon Prime Video-like platform](designs/prime-video/index.md): direct
  multipart uploads, media-aware splitting, encoding, quality checks, publication,
  authorized playback, and CDN scaling.
- [Uber System Design](designs/uber/Uber-System-Design.md): booking, live
  locations, and WebSocket routing.
  [Driver matching](designs/uber/Uber-Driver-Matching.md) covers reservations,
  sequential offers, deadlines, and recovery.
- [Library Reservation](designs/library_reservation_system_design.md):
  date-range availability and overbooking prevention.
  [SQL transaction queries](designs/library_reservation_sql_queries.md)
  accompany the design.
- [Notification Service](designs/notification-service.md): background delivery,
  retries, and duplicate work.
- [Distributed Cache](designs/distributed-cache.md): routing, replication,
  expiry, and failure handling.

## Practice

[Exercises & Reference](10-practice.md) includes a 45-minute design session and
a pocket reference. Each design also includes its own exercise.

## A first look inside a shopping app

When you open a shopping app, you can search for a product, check its price, and
place an order. What happens after you tap a button? Where does the app get the
price? How does the shop remember your order?

**System design is deciding how the parts of an application work together.**
We decide which part handles a request, where to save data, and what to do when
something stops working.

Let's start with a small online shop and add parts only when we need them.

## What happens when you open a product?

The shopping app on your phone is a **client**. It asks another computer for
product details. That computer is a **server**, which runs the shop's application.

The app sends a **request**, such as "show me product 123." The application finds
the product and sends back a **response** containing its name, price, and
description. The app uses that response to display the product.

```text
Shopping app  -- asks for product 123 -->  Shop application
Shopping app  <-- name, price, details --  Shop application
```

The app and the application need an agreement about what the app can request
and what the application will return. That agreement is an **API**.

[Learn how requests reach a server and how APIs work](02-requests.md).

## Where do products and orders live?

The application needs to remember product prices and customer orders, even
after it restarts. It saves them in a **database**.

When you open a product, the application reads its details from the database.
When you place an order, the application checks the available stock and saves
the order before confirming it.

```text
Shopping app  -->  Shop application  -->  Database
              <--                    <--
```

Now imagine two customers ordering the last item at the same time. Both requests
may reach the application before either order is saved. The stock check and
update must work together so that only one order gets the last item.

Choosing a database is not just about where to put data. We also need to decide
how to keep that data correct when requests arrive together.

[Learn how to store data and handle concurrent updates](03-storage.md).

## What if one server cannot handle all the requests?

As more people use the shop, one application server may struggle to keep up.
Requests start waiting, and the app feels slow.

We can give that server more CPU or memory. This is called **vertical scaling**.
Or we can run the application on more servers and share the requests between
them. This is called **horizontal scaling**.

A **load balancer** receives incoming requests and sends each one to an
application server.

```text
                                   -->  Application server 1  -->  Database
Shopping app  -->  Load balancer
                                   -->  Application server 2  -->  Database
```

More application servers can handle more application work. But they still use
the same database. If the database is already overloaded, adding application
servers alone will not solve the problem.

## Do we need to read the same product every time?

Many customers may open the same popular product. Reading its description from
the database for every request repeats the same work.

A **cache** keeps a copy of data so the application can reuse it. The application
checks the cache first. If the description is there and has not expired, the
application can return it without reading the database. Otherwise, it reads the
database and puts a copy in the cache for later requests.

There is a trade-off: a cached copy can be out of date. An old product description
may be acceptable for a short time. An old stock count must not be used to decide
whether to accept an order.

[Learn when to add servers and when to use a cache](04-scaling.md).

## Does the customer need to wait for every task?

After saving an order, the shop also needs to send a confirmation email. The
customer does not need to wait for the email provider before seeing that the
order was accepted.

The shop can record a task in a **queue**, which holds work to be processed
later. A separate program, called a **worker**, takes the task and sends the
email. If the email provider is temporarily unavailable, the task can be tried
again without asking the customer to place the order again.

The shop must make sure a saved order does not lose its email task. It must also
handle the same task being delivered more than once.

[Learn how queues and workers handle background work](05-async.md).

## What happens when something breaks?

A server can stop. A database can become unavailable. A request can time out
after an order has already been saved, leaving the customer unsure whether it
worked.

We need to decide how the service responds in each case. For example, if the
customer retries an order, the shop should find the existing order rather than
create a second one. Backups help recover lost data, but they must be tested to
check that recovery actually works.

We also need to protect customer data. Signing in should not let one customer
read another customer's orders. And when requests start failing, the team
running the shop needs a way to notice and find the cause.

Read about [handling failures](06-reliability.md) and
[protecting and operating a service](07-operations.md).

## How do you choose what to build?

You do not need every component above in every application. Start with what
users need to do, how much traffic you expect, and which mistakes the service
must prevent. Add a component when it solves a specific problem, and understand
the extra work it creates.

For the shop, "show a product" and "accept an order" need different rules. A
slightly old description may be fine. Selling the last item twice is not.
Those rules guide the design.

**Next: [define the shop's requirements](01-thinking.md).** This chapter explains
how to turn those needs into a starting design.

To see a complete example instead, open the [URL Shortener](designs/url-shortener/index.md).
Follow how it saves a long URL and finds it again when someone opens a short link.
For a design where concurrent requests compete for the same item, open the
[Ticket Booking System](designs/ticket-booking/index.md). Follow seat selection,
temporary holds, payment, and database-confirmed tickets, with an editable
diagram and local image preview.

Then explore the [Notification Service](designs/notification-service.md),
[Distributed Cache](designs/distributed-cache.md), or
[Exercises & Reference](10-practice.md).
