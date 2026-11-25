# Queues and Deques

[All coding topics](../index.md)

A queue processes the oldest item first. A deque supports both ends, which
lets a sliding-window algorithm remove expired items from one end and dominated
candidates from the other.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Queue using two stacks](../09-queues.md#92-queue-using-two-stacks) | Transfer only when the output stack is empty and distinguish amortized from single-operation cost. |
| [BFS scheduling](../09-queues.md#93-bfs) | Mark at enqueue, capture level sizes, and initialize multiple sources together. |
| [DFS versus BFS](../09-queues.md#94-dfs-versus-bfs) | Choose by traversal order and the guarantees the problem needs. |
| [Deque model](../09-queues.md#95-deque) | Add and remove at either end without shifting a whole array. |
| [Sliding-window maximum](../09-queues.md#96-sliding-window-maximum) | Keep live indices in decreasing value order so the front is the maximum. |

## Practice

Trace the maximum of every size-three window in `[1,3,-1,-3,5,3,6,7]`.
Explain why removing a dominated older index cannot lose a later answer.

Attempt [Chapter 9's questions](../09-queues.md#check-your-understanding---chapter-9)
before checking the [solutions](../answers.md#solutions---chapter-9).

**For full graph algorithms:** [Graphs](graphs.md).
**Next topic:** [Binary search](binary-search.md).
