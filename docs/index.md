# System Design Wiki

System design is deciding how a service receives requests, processes work,
stores data, and returns results. The design also explains what the service
does when traffic increases, a request is repeated, or a database becomes
unavailable.

This wiki explains those decisions step by step. The foundation pages introduce
the concepts. The service designs then show how the concepts work together.
The aim is to understand why a component is needed, how the component works,
and what the component cannot guarantee.

## Who this wiki is for

This wiki is for developers learning system design or reviewing a design.
You should understand basic application code and know that a client sends
requests to a server. You should also know that an application can save data
in a database.

You do not need previous experience with distributed systems. A distributed
system has components that communicate over a network. The pages explain
technical terms when the terms are first used.

## Choose a reading path

**If you are starting:** read the seven foundation pages in order. Continue
with URL Shortener, Notifications, and Distributed Cache. Try each exercise
before reading the answer guidance.

**If you want to understand one concept:** open the relevant foundation page
below. Follow the request or data update through the example. Then read a
service design that uses the same concept.

**If you need a reference:** use search or the page contents to find the topic.
Read the conditions around a claim before applying the claim to your service.
Use [Exercises & Reference](10-practice.md) to review your design and estimates.

## Learn the foundations

1. [Requirements](01-thinking.md) explains how to decide what a service must do.
   You define which results must be correct, then estimate the requests and data
   the service needs to handle.

2. [Networking & APIs](02-requests.md) follows a request from the client to the
   service. An API, or application programming interface, defines how the client
   makes a request and what the service returns.

3. [Storage](03-storage.md) explains how a database stores related facts and
   handles updates. You learn how the service can protect its data when two
   clients try to change the same record.

4. [Scaling & Caching](04-scaling.md) explains what to do when a component cannot
   handle the required traffic. A cache keeps copies of data for faster reads;
   the page explains when those copies can become out of date.

5. [Messaging](05-async.md) explains how a service saves work for a worker to
   process later. If the worker receives the same task again, the design must
   account for any action the worker has already completed.

6. [Reliability](06-reliability.md) explains what happens when part of a system
   fails. You learn when a service can return old data, when the service must
   refuse a request, and how the service can recover stored data.

7. [Security & Operations](07-operations.md) explains how the service checks
   access and how operators detect problems. The page also covers changing the
   service without breaking requests or losing data.

## Follow the service designs

The design pages use the foundations to explain a complete request flow.
Each design starts with what the service needs to do, then explains how the
service stores data, handles failures, and reports its results.

Start with [URL Shortener](designs/url-shortener.md). Follow how the service
saves a link and later uses that saved link to redirect a client.

Continue with [Notifications](designs/notification-service.md). Follow how the
service accepts a notification request and passes the work to a worker. If the
provider does not return a response, the worker may not know whether the
provider accepted the notification.

Then read [Distributed Cache](designs/distributed-cache.md). Use the supplied
architecture diagram to follow how the cache finds a value, keeps copies,
and handles changes. Compare those paths with the simpler cache explanation
in the foundations.

## Read the examples with their limits

The calculations use stated assumptions about traffic, data size, and timing.
The numbers explain the calculation; the numbers are not measurements of your
service. Check which costs a calculation includes before using the result.

In a diagram, a box represents a component and an arrow shows communication.
An arrow does not by itself promise that a message arrives, arrives in order,
or travels over an encrypted connection. The text explains those conditions.

Pay attention to where the service saves the original record and where the
service reads a copy. A copy may be older than the original. Likewise, a service
may confirm that a request was saved before a worker finishes the requested work.

The wiki is learning material, not a production-ready application or a guarantee
that a design meets your targets. Before using a design in production, test the
actual workload, check the database and provider guarantees, review access and
privacy rules, and test recovery. Add a component when a requirement or a
measured problem explains why the service needs that component.

[Begin with Requirements →](01-thinking.md)
