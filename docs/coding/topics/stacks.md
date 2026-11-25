# Stacks and Monotonic Stacks

[All coding topics](../index.md)

A stack processes the most recently added item first. It can represent nested
syntax, a history of minima, or unresolved elements waiting for a future event.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Stack model](../08-stacks.md#81-stack-mental-model) | Use last-in-first-out ordering and define empty-stack behavior. |
| [Bracket parsing](../08-stacks.md#82-valid-parentheses) | Store the closing bracket expected by each opening bracket. |
| [Min stack](../08-stacks.md#83-min-stack) | Maintain the minimum for every stack depth, including duplicates. |
| [Monotonic stacks](../08-stacks.md#84-monotonic-stacks) | Store unresolved indices and prove that each is pushed and popped at most once. |
| [Daily Temperatures](../08-stacks.md#85-daily-temperatures) | Resolve earlier indices only on a strictly warmer temperature. |
| [Histogram rectangles](../08-stacks.md#86-largest-rectangle-in-a-histogram) | Derive the width after popping and flush the stack with a trailing zero. |

## Practice

Trace `[2,1,5,6,2,3]` as a histogram. After each pop, identify the exclusive
right boundary and the new left-smaller boundary. Explain your equality policy.

Attempt [Chapter 8's questions](../08-stacks.md#check-your-understanding---chapter-8),
then check the [solutions](../answers.md#solutions---chapter-8).

**Next topic:** [Queues and deques](queues.md).
