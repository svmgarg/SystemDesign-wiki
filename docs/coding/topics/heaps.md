# Heaps and Priority Queues

[All coding topics](../index.md)

A priority queue exposes the next item according to a comparison rule. A heap
is one implementation. Its parent/child order is weaker than fully sorting
all stored items.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Representation](../15-heaps.md#151-the-abstraction-and-its-implementation) | Separate the priority-queue contract from binary-heap layout. |
| [Insertion](../15-heaps.md#152-inserting-into-a-min-heap) | Sift a new item toward its parent until heap order holds. |
| [Removal](../15-heaps.md#153-removing-the-minimum) | Replace the root and repeatedly choose the smaller child. |
| [Heap pseudocode](../15-heaps.md#154-a-binary-min-heap-implementation-for-learning) | Implement the array layout and boundary checks explicitly. |
| [Top-K](../15-heaps.md#155-top-k-expose-the-weakest-accepted-candidate) | Keep a size-k min-heap of the largest accepted values. |
| [K-way merge](../15-heaps.md#156-k-way-merge-one-live-frontier-per-source) | Keep only the next unconsumed item from each sorted source. |
| [Linear heap construction](../15-heaps.md#157-bottom-up-heapify-why-it-is-linear) | Sum work by node height instead of charging every node the root's cost. |
| [Ties and priorities](../15-heaps.md#158-priority-values-and-tie-contracts) | Define direction and stable tie-breaking without overflow-prone subtraction. |
| [Streaming median](../15-heaps.md#159-streaming-median---worked-revision-and-supplemented-solution) | Maintain ordering and size invariants across a max-heap and min-heap. |

## Practice

Explain why the weakest accepted item should be easiest to remove for Top-K.
Then rebalance the two heaps after each streaming-median insertion.

Attempt [Chapter 15's questions](../15-heaps.md#check-your-understanding---chapter-15)
before checking the [solutions](../answers.md#solutions---chapter-15).

**Next topic:** [Recursion and backtracking](backtracking.md).
