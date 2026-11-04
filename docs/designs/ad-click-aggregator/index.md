# Ad Click Aggregator

## Basic description

Record clicks on ads, redirect visitors to the destination, and let advertisers
query click totals. Kafka buffers click events; Spark Streaming aggregates them;
an OLAP store serves the query service.

**Kafka** is a durable event log that keeps clicks for later processing.
**Spark Streaming** runs background computations over those events.
**Aggregation** combines events into counts; **OLAP** (online analytical
processing) storage is optimized for queries such as “how many clicks did
this ad receive today?”

## Functional requirements

- Accept click events containing an `adId`, stable `clickId`, and event timestamp.
- Look up the ad's destination and return an HTTP `302` redirect.
- Aggregate click counts by ad and one-minute event-time window.
- Let advertisers query their ads' totals for a selected time range.

## Non-functional requirements

- Keep the redirect path responsive while reliably accepting click events.
- Retain Kafka events for replay after processing failures.
- Define event deduplication and make storage writes safe to retry.
- Handle popular-ad traffic without concentrating it on one overloaded partition.

## Architecture

**First pass:** someone clicks ad `ad1222`. The click processor looks up its
destination, publishes the click to Kafka, and redirects the browser. Background
Spark processing counts the click in its minute; later, the advertiser's query
reads the stored counts. A redirect is not proof that aggregation has finished.
The implementation must define what it does if Kafka publication fails before
returning the redirect; buffering alone does not establish reliable acceptance.

<div class="diagram-scroll" role="region" aria-label="Ad click aggregation with Kafka and Spark Streaming; scroll horizontally on small screens" tabindex="0" markdown="1">

[![A browser reaches the click processor through an API gateway. The processor reads the ad destination from Ad DB, returns a redirect, and publishes events to Kafka. Spark Streaming aggregates clicks into OLAP storage; the advertiser queries totals through the query service.](assets/ad-click-aggregator.png)](assets/ad-click-aggregator.png)

</div>

The diagram adapts the supplied architecture to **Kafka** and **Spark Streaming**.
Its 32 partitions, seven-day retention, one-minute windows, and ten-second flush
interval are example configuration choices. Kafka does not have Kinesis's fixed
1,000-records-per-second shard limit.

## Partition groups and partial counts

A **partition** is one ordered slice of Kafka's event log. The event's **key**
helps choose that slice; it is not the click's unique identity.
For example, many distinct `clickId` values can share the same `adId` key.

Use **eight independent Spark streaming applications**, each assigned four Kafka
partitions: `0-3`, `4-7`, through `28-31`.

With normal routing, the Kafka key is `adId`. For a fixed partition count and
partitioner, all events for an ad reach one partition and therefore one
application.

Each application aggregates its own events by `(adId, minute)` and upserts
its latest partial count into storage under `(adId, minute, jobId)`. Here,
`jobId` is the stable identity of that partition-group application, not a
new identity on every restart or micro-batch.

An **upsert** inserts a row if absent or updates it if present. A **partial
count** covers only one application's events: if two applications store 7 and
5 clicks for the same ad/minute, the query returns 12, not either row alone.

The **query service sums these partial counts** across applications for the
requested ad and time range. If a hot ad spans applications, their partials
remain separate instead of overwriting one another.

A ten-second flush publishes the latest cumulative partial count; it must
replace that application's previous value, not be added repeatedly. It does
not make the event-time minute final: define watermark and late-event handling
separately. Retry-safe upserts alone do not deduplicate repeated input clicks.

**Event time** is when the click happened, not when Spark received it.
A **watermark** tracks event-time progress and helps decide how long to wait
for delayed clicks. The late-event policy defines what happens to clicks
arriving after that allowance; a flush only makes current results visible.

## Popular ads: the celebrity problem

An ad such as `ad1222` may contribute 10% of all clicks. If its key maps to
partition 15, that partition receives all those clicks plus other ads. More
Spark applications alone cannot split those Kafka writes.

For identified hot ads, the click processor can explicitly choose
`positiveHash(clickId) % partitionCount`, spreading clicks across partitions
while retaining `adId` in the event. The existing applications write their
partials, and the query service sums them. Normal ads can keep `adId` routing.

Detect hot ads from recent per-ad rates aggregated across click processors,
then distribute a cached hot-ad routing list. This balances load rather than
isolating it: sufficient total Kafka and Spark capacity is still required.
