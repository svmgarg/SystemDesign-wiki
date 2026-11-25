# Trees and Binary Search Trees

[All coding topics](../index.md)

A tree problem becomes easier when each recursive call has one precise
meaning. A binary search tree adds an ordering rule inherited from every
ancestor; it does not automatically add balancing.

## Detailed lessons

| Detail page | Sections to study |
| --- | --- |
| [Tree contracts and traversals](../11-tree-traversals.md) | Node model, preorder/inorder/postorder, iterative stacks, level-order BFS, and height versus width space bounds. |
| [Structure, LCA, and paths](../12-tree-paths.md) | Same/invert, balance, diameter, general-tree LCA, root-to-leaf paths, snapshots, and maximum path sum. |
| [Construction, serialization, and counting](../13-tree-construction.md) | Rebuild from unique traversals, encode nulls, reject malformed streams, and exploit the complete-tree guarantee. |
| [Binary search trees](../14-binary-search-trees.md) | Validate ancestor bounds, search/insert/delete, kth smallest, successor/predecessor, and BST-specific LCA. |

## Keep these distinctions clear

Traversal time counts all visited nodes; recursive memory counts the active
path. A diameter or maximum-path routine returns a one-sided result to its
parent while considering a two-sided candidate for the global answer.

A complete tree fills its last level from left to right. A perfect tree fills
every level. The fast complete-tree counting shortcut cannot be applied to an
arbitrary tree just because its two extreme heights match.

## Practice

Trace maximum path sum on an all-negative tree and validate a BST where a
descendant violates a distant ancestor's bound. State whether an LCA algorithm
compares node identity or ordered values.

The four detail pages contain their own questions and links to the
[answer key](../answers.md).

**Next topic:** [Heaps and priority queues](heaps.md).
