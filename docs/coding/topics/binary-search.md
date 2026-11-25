# Binary Search

[All coding topics](../index.md)

Binary search discards part of an ordered search space while preserving every
possible answer. The ordering may be in an array or in a yes/no feasibility
predicate over possible answers.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Exact search](../10-binary-search.md#102-exact-search) | Maintain an inclusive candidate interval and terminate when it is empty. |
| [Lower and upper bounds](../10-binary-search.md#103-lower-bound-and-upper-bound) | Find the first value greater than or equal to a target, or strictly greater than it. |
| [First true and last true](../10-binary-search.md#104-first-true-and-last-true) | Find a predicate transition with explicit sentinel and feasibility contracts. |
| [Rotated search](../10-binary-search.md#105-search-in-rotated-sorted-array) | Identify the sorted half; understand why duplicates may prevent logarithmic elimination. |
| [Rotated minimum](../10-binary-search.md#106-find-minimum-in-rotated-sorted-array) | Keep the minimum in the surviving interval by comparing against the right endpoint. |
| [Search on the answer](../10-binary-search.md#107-binary-search-on-answer) | Define bounds and a monotonic feasibility test before writing the loop. |

## Practice

Trace a lower bound with repeated values and a shipping-capacity search.
Explain why an infeasible capacity lets you discard all smaller capacities.

Attempt [Chapter 10's questions](../10-binary-search.md#check-your-understanding---chapter-10)
before using the [solutions](../answers.md#solutions---chapter-10).

**Next topic:** [Trees and BSTs](trees.md).
