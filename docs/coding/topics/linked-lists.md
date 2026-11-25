# Linked Lists

[All coding topics](../index.md)

A linked list stores values in nodes connected by references. Most operations
are about preserving reachability while changing links, not moving values
between array positions.

## Detailed lessons

| Detail page | Sections to study |
| --- | --- |
| [List basics, reversal, and cycles](../06-linked-list-foundations.md) | Node identity, dummy nodes, iterative and recursive reversal, middle conventions, nth-from-end removal, Floyd detection, and cycle entry. |
| [Merging, intersection, reorder, and LRU](../07-linked-list-patterns.md) | Reuse nodes safely, align paths by pointer switching, restore a palindrome check when required, weave reversed halves, and maintain a map plus doubly linked list. |

## Contracts to check

Two nodes with equal values are not necessarily the same node. State whether
lists are acyclic, whether nodes may be shared, and whether the operation may
rewire the caller's input.

During reversal, save the next link before overwriting it. During reorder,
split the list before reversing the second half. In an LRU cache, the map and
recency list must contain exactly the same live entries; these examples do not
provide thread safety.

## Practice

Draw an odd-length reorder and a cycle with a nonempty prefix. Track references
rather than just printed values.

Attempt the checkpoints on both detail pages, then use the
[Chapter 6 solutions](../answers.md#solutions---chapter-6) and
[Chapter 7 solutions](../answers.md#solutions---chapter-7).

**Next topic:** [Stacks](stacks.md).
