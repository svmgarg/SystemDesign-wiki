# Sorting and Selection

[All coding topics](../index.md)

Sorting creates global order; selection finds a required rank without fully
ordering everything. Choose by key range, required stability, input shape,
memory budget, and worst-case guarantees.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Stability and adaptiveness](../17-sorting.md#172-stability-adaptiveness-and-in-place-terminology) | Define ties, input-dependent savings, and auxiliary storage. |
| [Bubble Sort](../17-sorting.md#173-bubble-sort---finalize-the-largest-suffix) | Finalize a suffix and stop when no swap occurs. |
| [Selection Sort](../17-sorting.md#174-selection-sort---finalize-the-smallest-prefix) | Select the minimum for the next output position. |
| [Insertion Sort](../17-sorting.md#175-insertion-sort---grow-an-ordered-prefix) | Shift larger values while maintaining a sorted prefix. |
| [Merge Sort](../17-sorting.md#176-merge-sort---split-by-position-combine-ordered-halves) | Merge sorted halves and take the left item on ties for stability. |
| [Partitioning](../17-sorting.md#177-lomuto-partitioning---four-regions-and-one-final-swap) and [Quick Sort](../17-sorting.md#178-quick-sort---recursively-order-both-partitions) | Prove partition regions and account for bad pivots. |
| [Heap Sort](../17-sorting.md#179-heap-sort---active-max-heap-plus-finalized-suffix) | Build a max-heap and shrink its active prefix. |
| [Counting Sort](../17-sorting.md#1710-counting-sort---time-and-memory-depend-on-key-range) and [stable placement](../17-sorting.md#1711-stable-counting-sort---prefix-values-are-exclusive-ends) | Relate cost to the key range and place equal keys without reversing them. |
| [LSD Radix Sort](../17-sorting.md#1712-lsd-radix-sort---stable-passes-preserve-previous-work) | Use stable digit passes to preserve earlier work. |
| [Quickselect](../17-sorting.md#1713-quickselect---follow-only-the-required-rank) | Follow the partition containing the desired rank. |
| [Custom comparison rules](../17-sorting.md#1714-custom-comparisons---one-ordered-chain-of-rules) | Chain keys, reverse direction safely, and obey transitivity. |

## Practice

Trace Lomuto partitioning and a stable counting pass. Explain why a counting
array can be too large even for a short input.

Attempt [Chapter 17's questions](../17-sorting.md#check-your-understanding---chapter-17)
before checking the [solutions](../answers.md#solutions---chapter-17).

**Next topic:** [Graphs](graphs.md).
