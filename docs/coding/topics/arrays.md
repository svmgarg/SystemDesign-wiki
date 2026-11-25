# Arrays and Range Patterns

[All coding topics](../index.md)

An array gives direct indexed access to a sequence. The main interview patterns
either reuse information about ranges or move boundaries without revisiting
discarded work.

## Detailed lessons

| Detail page | Sections to study |
| --- | --- |
| [Array basics and Kadane](../02-arrays.md) | Memory layout, aliasing versus copying, subarray versus subsequence, maximum subarray, compaction, reversal, and rotation. |
| [Prefix sums and range updates](../03-prefix-sums.md) | Range queries, 2D inclusion-exclusion, counting target-sum subarrays with a map, and difference-array boundary events. |
| [Two pointers and sliding windows](../04-two-pointers.md) | Sorted elimination, fixed windows, longest-valid windows, shortest-valid windows, and when negative numbers invalidate a sum-window argument. |

## Choose the pattern

| Problem requirement | Start with | Important condition |
| --- | --- | --- |
| Many sum queries on unchanged data | Prefix sums | Build once; use consistent range boundaries. |
| Count target-sum subarrays, including negatives | Prefix sum plus frequency map | Count prior prefixes; query before inserting. |
| Many range additions | Difference array | Record start/stop events, then reconstruct once. |
| Best nonempty contiguous sum | Kadane | Initialize from an element, not zero. |
| Pair sum in sorted input | Two pointers | Explain why moving a pointer safely discards candidates. |
| Longest or shortest valid contiguous range | Sliding window | Prove how validity changes as boundaries move. |

## Worked examples and practice

Dry-run Kadane on all-negative input, count zero-sum subarrays with repeated
prefixes, and trace the longest unique window in `"abba"`. State which input
each in-place algorithm overwrites.

Each detail page ends with its own checkpoint and exercises. Keep the
[answer key](../answers.md) closed until you have tried them.

**Next topic:** [Strings and hashing](strings.md).
