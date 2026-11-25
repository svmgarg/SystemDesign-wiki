# Complete answer key

[All coding chapters](index.md) | [Revision](revision.md)

> Attempt the chapter questions before opening these solutions. Q19.41-Q19.48 have supplemental model answers; the PDF records no learner response or passed final DP checkpoint.

All checkpoint and additional-practice solutions are here, after the teaching chapters. Each answer links back to its question. E identifies a newly authored practice exercise; Q/A are checkpoint question/answer identifiers.

## Solutions - Chapter 1
### A1.1

O(n). right advances at most n times and left also advances at most n times; it never resets, so total pointer movement is at most 2n.

[Back to question](01-problem-solving.md#q11)

### A1.2

DFS stack depth equals tree height. A balanced tree has height O(log n); a skewed tree has height O(n).

[Back to question](01-problem-solving.md#q12)

### A1.3

Initialization, maintenance, and termination/postcondition.

[Back to question](01-problem-solving.md#q13)

### A1.4

O(n log n) because the larger sequential term dominates.

[Back to question](01-problem-solving.md#q14)

### A1.5

Examples: a prefix/subarray sum can exceed a 32-bit range; multiplying histogram
height by width or computing a large answer bound can also require wider arithmetic.

[Back to question](01-problem-solving.md#q15)

### E1.1

The sum is n+n/2+...&lt;2n and at least n, so Theta(n). The inner work shrinks; it is not n on every one of the logarithmically many outer iterations.

[Back to question](01-problem-solving.md#e11)

### E1.2

At index 0, complement 3 is absent, so record 3-&gt;0. At index 1, complement 3 maps to 0; return (0,1). Store value-&gt;index. Looking up first prevents matching an element to itself. Expected O(n) time, O(n) space.

[Back to question](01-problem-solving.md#e12)

## Solutions - Chapter 2
### A2.1

Assignment aliases the same array object; Clone creates a separate shallow array copy. For value-type elements the values are copied; for reference-type elements the object references are copied.

[Back to question](02-arrays.md#q21)

### A2.2

After index i, it is the maximum sum of any non-empty subarray that ends exactly at i.

[Back to question](02-arrays.md#q22)

### A2.3

Zero represents an empty subarray, so it incorrectly beats every negative non-empty subarray.

[Back to question](02-arrays.md#q23)

### A2.4

It is the complete, valid compacted output produced so far.

[Back to question](02-arrays.md#q24)

### A2.5

Arrays have contiguous storage and better cache locality; linked-list traversal follows separately allocated nodes.

[Back to question](02-arrays.md#q25)

### E2.1

States (ending,best): (-5,-5), (-2,-2), (-8,-2). Answer -2. Starting from zero would incorrectly prefer an empty range.

[Back to question](02-arrays.md#e21)

### E2.2

For n=0 return before modulo. Normalize k=7%5=2. Reverse all -&gt; [5,4,3,2,1]; reverse first two -&gt; [4,5,3,2,1]; reverse remainder -&gt; [4,5,1,2,3]. O(n) time and O(1) auxiliary space.

[Back to question](02-arrays.md#e22)

## Solutions - Chapter 3
### A3.1

prefix[r + 1] - prefix[l].

[Back to question](03-prefix-sums.md#q31)

### A3.2

It represents the empty prefix, allowing subarrays that start at index 0 to be counted when the running prefix itself equals the target.

[Back to question](03-prefix-sums.md#q32)

### A3.3

Different earlier positions can have the same prefix and each produces a distinct valid subarray. A set loses that multiplicity.

[Back to question](03-prefix-sums.md#q33)

### A3.4

For current index i, the earliest matching index yields the largest i - j.

[Back to question](03-prefix-sums.md#q34)

### A3.5

diff[l] += d and, when in range, diff[r + 1] -= d.

[Back to question](03-prefix-sums.md#q35)

### E3.1

Prefixes after each element are 1,0,1,0. With initial {0:1}, contributions are 0,1,1,2, totalling 4. Query the map before recording each current prefix.

[Back to question](03-prefix-sums.md#e31)

### E3.2

Difference array [0,5,0,3,0,-5,0,-3,0]; output [0,5,5,8,8,3,3,0]. The output excludes sentinel index 8. Each update changes two boundaries.

[Back to question](03-prefix-sums.md#e32)

## Solutions - Chapter 4
### A4.1

If the largest partner currently available with a[left] is still too small, every smaller partner is also too small; sorted order eliminates that left value.

[Back to question](04-two-pointers.md#q41)

### A4.2

Across the whole algorithm each pointer only moves forward at most n times, so total loop work is linear.

[Back to question](04-two-pointers.md#q42)

### A4.3

After the shrinking loop, when the window invariant says the window is valid.

[Back to question](04-two-pointers.md#q43)

### A4.4

Every valid state encountered while shrinking is a candidate, and the goal is to shrink to the smallest valid one before validity is lost.

[Back to question](04-two-pointers.md#q44)

### A4.5

Adding a negative value can decrease the sum and removing a negative value can increase it, so endpoint movement no longer changes feasibility monotonically.

[Back to question](04-two-pointers.md#q45)

### E4.1

left values after a,b,b,a are 0,0,2,2; best length is 2. At final a, its old index 0 is outside the window, so max prevents left from moving backward.

[Back to question](04-two-pointers.md#e41)

### E4.2

Answer 2 from [4,3]. On each right endpoint, while sum&gt;=7, score the current valid length then remove the left element. Positivity makes further shrinking monotonic. O(n) time, O(1) extra space.

[Back to question](04-two-pointers.md#e42)

## Solutions - Chapter 5
### A5.1

Strings are immutable; each concatenation can copy the accumulated prefix, producing work like 1 + 2 + ... + n.

[Back to question](05-strings.md#q51)

### A5.2

When the input is guaranteed to be lowercase English letters (or another small fixed domain) and each key maps directly to an array index.

[Back to question](05-strings.md#q52)

### A5.3

(i, i) finds odd-length palindromes, while (i, i + 1) finds even-length palindromes.

[Back to question](05-strings.md#q53)

### A5.4

If two keys are equal, they must return the same hash code. Unequal keys may still collide.

[Back to question](05-strings.md#q54)

### A5.5

Mutation can change its bucket/equality identity, so a lookup may search a different bucket and fail to find the stored entry.

[Back to question](05-strings.md#q55)

### E5.1

The gap center (1,2) expands 'bb'; answer is 'bb', length 2. Only testing (i,i) misses it. Center expansion takes O(n squared) time and constant auxiliary space excluding the result.

[Back to question](05-strings.md#e51)

### E5.2

A collision is valid: equality distinguishes the keys. Mutation can change the lookup bucket and strand the stored entry. Equal keys must have equal hashes; equal hashes do not imply equal keys.

[Back to question](05-strings.md#e52)

## Solutions - Chapter 6
### A6.1

prev is the correctly reversed processed prefix and current is the first unprocessed node.

[Back to question](06-linked-list-foundations.md#q61)

### A6.2

Once current.Next is overwritten, there is otherwise no reference to the unprocessed suffix.

[Back to question](06-linked-list-foundations.md#q62)

### A6.3

The real head has a stable predecessor, so deletion uses the same predecessor-link operation as every other node.

[Back to question](06-linked-list-foundations.md#q63)

### A6.4

Reference identity: the same node object, not merely equal stored values.

[Back to question](06-linked-list-foundations.md#q64)

### A6.5

Reset one pointer to head, leave the other at the meeting point, and move both one step until they meet at the entry.

[Back to question](06-linked-list-foundations.md#q65)

### E6.1

After steps: (1,2), (2,3), (3,null). Before every redirect, save current.Next in next. New head is 3; final chain is 3-&gt;2-&gt;1-&gt;null.

[Back to question](06-linked-list-foundations.md#e61)

### E6.2

a+b=5 is a whole cycle. From meeting, three steps wrap to entry; from head, three steps also reach entry. Reset one pointer to head, then advance both one step. Compare references, not values.

[Back to question](06-linked-list-foundations.md#e62)

## Solutions - Chapter 7
### A7.1

The chain after the dummy is sorted and contains exactly all consumed nodes; tail points to its last node.

[Back to question](07-linked-list-patterns.md#q71)

### A7.2

Each pointer traverses both list lengths in opposite order, canceling the difference in unique-prefix lengths; they then align at the common suffix or null.

[Back to question](07-linked-list-patterns.md#q72)

### A7.3

Find/split at the middle, reverse the second half, then alternately weave first-half and reversed-secondhalf nodes.

[Back to question](07-linked-list-patterns.md#q73)

### A7.4

Evicting or promoting a known arbitrary node requires removing it without searching for its predecessor; a doubly linked node provides that predecessor directly.

[Back to question](07-linked-list-patterns.md#q74)

### A7.5

Examples: every real list node appears exactly once in the map; counts match; MRU is after head and LRU before tail; adjacent Next/Prev links are symmetric.

[Back to question](07-linked-list-patterns.md#q75)

### E7.1

Orders MRU-&gt;LRU: A; B,A; A,B; C,A (B evicted); A,C. Get(A) returned 1. Updating A changes its value and recency without creating a duplicate list node.

[Back to question](07-linked-list-patterns.md#e71)

### E7.2

Split [1,2,3] / [4,5] by setting the middle Next to null. Reverse second to [5,4]. Weave to [1,5,2,4,3]. Save both following links before each rewrite. O(n) time, O(1) extra space.

[Back to question](07-linked-list-patterns.md#e72)

## Solutions - Chapter 8
### A8.1

It contains the closing delimiters still required by unmatched openings, with the next required closer on top.

[Back to question](08-stacks.md#q81)

### A8.2

It stores the minimum at every depth, so duplicate minima are duplicated and popping one still leaves the previous equal minimum.

[Back to question](08-stacks.md#q82)

### A8.3

Every element is pushed once and popped at most once, bounding total stack operations by a constant multiple of n.

[Back to question](08-stacks.md#q83)

### A8.4

The answer is a distance (i - j), and indices also distinguish duplicates.

[Back to question](08-stacks.md#q84)

### A8.5

The new top is the surviving left boundary, so width is currentIndex-leftBoundary-1. With strict &lt;

[Back to question](08-stacks.md#q85)

popping, that survivor can have equal height; the earlier equal copy eventually covers the larger width. With &lt;= popping, the boundary is strictly smaller. Keep the equality policy consistent.  Back to question

### E8.1

Answer [1,1,4,2,1,1,0,0]. An incoming warmer day resolves older colder indices with waiting time currentIndex-oldIndex. Equal temperatures do not resolve a strictly-warmer query.

[Back to question](08-stacks.md#e81)

### E8.2

After height 6 is popped, popping index 2 (height 5) leaves index 1. Width=4-1-1=2, area=10, the global optimum. Each bar is pushed/popped at most once, so time is O(n).

[Back to question](08-stacks.md#e82)

## Solutions - Chapter 9
### A9.1

Keeping existing output elements preserves the older queue front. Transferring only when empty ensures each item moves at most once and gives amortized O(1).

[Back to question](09-queues.md#q91)

### A9.2

Discovered nodes waiting to be fully processed, ordered by discovery/level.

[Back to question](09-queues.md#q92)

### A9.3

It prevents different parents from enqueuing the same node multiple times.

[Back to question](09-queues.md#q93)

### A9.4

When edges are unweighted/unit cost and a shortest path or minimum number of steps is required.

[Back to question](09-queues.md#q94)

### A9.5

Indices are inside the window, values decrease from front to back, and dominated indices are removed so the front is the maximum.

[Back to question](09-queues.md#q95)

### E9.1

Transfer input [10,20] to output [20,10], then return 10. Enqueue 30 into input; return remaining output 20 without transfer. Then transfer and return 30. Each item transfers once; amortised O(1) per operation.

[Back to question](09-queues.md#e91)

### E9.2

Output [3,3,5,5,6,7]. At i, expire front indices&lt;=i-3. Remove back indices with value&lt;=current value, then append i. A newer equal/larger value dominates an older one and expires no earlier. O(n) time, O(k) deque space.

[Back to question](09-queues.md#e92)

## Solutions - Chapter 10
### A10.1

If the target exists and has not been returned, its index remains inside [left, right].

[Back to question](10-binary-search.md#q101)

### A10.2

Lower bound is first index with value &gt;= target; upper bound is first index with value &gt; target.

[Back to question](10-binary-search.md#q102)

### A10.3

The valid insertion/boundary position after all elements is n, so the search space must include that sentinel position.

[Back to question](10-binary-search.md#q103)

### A10.4

The right endpoint lies in the low sorted segment; if midpoint is greater than it, midpoint is in the high segment and the rotation minimum must occur after midpoint.

[Back to question](10-binary-search.md#q104)

### A10.5

The feasibility/decision predicate must be monotonic over bounds that contain the answer, and you must know whether the desired boundary is first feasible or last feasible.

[Back to question](10-binary-search.md#q105)

### E10.1

For 2: lower=1, upper=4, count=3. For 5: lower=upper=5 (n), count=0. These are boundary indices; n must not be dereferenced.

[Back to question](10-binary-search.md#e101)

### E10.2

Bounds [5,15]. Capacity 5 needs 4 days and fails; 6 needs 3 and works. A larger capacity can reproduce any packing of a smaller one, so feasible is false...true. First true is 6. Each check O(n), total O(n log R).

[Back to question](10-binary-search.md#e102)

## Solutions - Chapter 11
### A11.1

“Solve(node) returns ______ for the subtree rooted at node.”

[Back to question](11-tree-traversals.md#q111)

### A11.2

Postorder, because both child results are available before processing the parent.

[Back to question](11-tree-traversals.md#q112)

### A11.3

The stack contains suspended ancestor visits. While descending, some left subtrees are still pending. At the instant a node is popped, its left subtree is complete and its own visit/right subtree remain.

[Back to question](11-tree-traversals.md#q113)

### A11.4

Enqueuing children changes queue size; the snapshot ensures exactly the nodes already present at the start belong to the current level.

[Back to question](11-tree-traversals.md#q114)

### A11.5

Example: remaining target/current path as parameter; subtree height as return; diameter or maximum path sum as external best.

[Back to question](11-tree-traversals.md#q115)

### E11.1

Preorder 8,4,2,6,12,10,14. Inorder 2,4,6,8,10,12,14. Postorder 2,6,4,10,14,12,8. BFS 8,4,12,2,6,10,14.

[Back to question](11-tree-traversals.md#e111)

### E11.2

Perfect tree: recursive DFS O(log n) frames; BFS O(n) width. Chain: recursive DFS O(n); BFS O(1) queue. Standard iterative preorder on a one-child chain can also have O(1) pending nodes. Its upper bound O(h) need not be tight for every shape.

[Back to question](11-tree-traversals.md#e112)

## Solutions - Chapter 12
### A12.1

Each call computes height once and immediately propagates failure, avoiding separate repeated height traversals at ancestors.

[Back to question](12-tree-paths.md#q121)

### A12.2

Return one-branch subtree height; update the global diameter with leftHeight + rightHeight.

[Back to question](12-tree-paths.md#q122)

### A12.3

One target (or resolved target-side result) was found in each subtree, so the current node is their lowest split point.

[Back to question](12-tree-paths.md#q123)

### A12.4

The same buffer is later modified during backtracking; without a snapshot, saved results would all reference changing shared state.

[Back to question](12-tree-paths.md#q124)

### A12.5

A parent path can continue through the node into only one child; returning both would create a fork rather than a simple path.

[Back to question](12-tree-paths.md#q125)

### E12.1

Maximum is 42 via 15-&gt;20-&gt;7. Node 20 returns 35 (20+15), not 42; a parent can extend only one downward branch. The candidate at root is -10+9+35=34, which does not improve 42.

[Back to question](12-tree-paths.md#e121)

### E12.2

Without copying, saved results alias the same mutable list. Without removing on exit, sibling traversals inherit values from a finished branch. Correct choose/explore/unchoose discipline plus snapshotting fixes both.

[Back to question](12-tree-paths.md#e122)

## Solutions - Chapter 13
### A13.1

It finds each root's split position in O(1) instead of scanning an inorder range repeatedly, reducing total construction to O(n).

[Back to question](13-tree-construction.md#q131)

### A13.2

Preorder sequence is root, then the complete left subtree, then the right subtree; the shared preorder cursor must consume in that order.

[Back to question](13-tree-construction.md#q132)

### A13.3

Values/traversal order alone may describe multiple structures; null markers encode missing children and make the representation unambiguous.

[Back to question](13-tree-construction.md#q133)

### A13.4

The subtree must be known to be complete. Equal extreme heights are not sufficient for an arbitrary tree.

[Back to question](13-tree-construction.md#q134)

### A13.5

There are O(log n) relevant recursion levels, and each level measures heights in O(log n) time.

[Back to question](13-tree-construction.md#q135)

### E13.1

5,3,#,4,#,#,8,#,#. Four real nodes, five null tokens, nine tokens total. Each recursive call consumes one complete subtree, making decoding unambiguous.

[Back to question](13-tree-construction.md#e131)

### E13.2

No: internal gaps can exist despite equally long extremes. The shortcut needs a guaranteed complete tree. With that guarantee, equal node heights 3 imply 2^3-1=7 nodes.

[Back to question](13-tree-construction.md#e132)

## Solutions - Chapter 14
### A14.1

A deeper descendant can violate an ancestor's range while still being correctly ordered relative to its parent.

[Back to question](14-binary-search-trees.md#q141)

### A14.2

Bounds outside the legal node-value range keep both minimum and maximum
legal values valid. Use symbolic infinities, optional endpoints, or a wider
bound type rather than excluding a legal value.

[Back to question](14-binary-search-trees.md#q142)

### A14.3

Leaf -&gt; return null; one child -&gt; return that child; two children -&gt; replace/transplant with successor or predecessor and remove it from its original position.

[Back to question](14-binary-search-trees.md#q143)

### A14.4

With a right subtree, take its leftmost node. Without one, take the lowest ancestor for which the node lies in that ancestor's left subtree.

[Back to question](14-binary-search-trees.md#q144)

### A14.5

Their time is O(h); an unbalanced BST can have height n, while only a balanced tree guarantees logarithmic height.

[Back to question](14-binary-search-trees.md#q145)

### E14.1

At 20 the interval is (-infinity,40); at its right child it is (20,40). Value 45 violates the upper bound despite being greater than its parent 20. A local-child-only validator would miss this.

[Back to question](14-binary-search-trees.md#e141)

### E14.2

Replace 50's value with successor 60, then remove original 60 from 70's left subtree. Otherwise 60 remains duplicated. Return/reassign the updated subtree links. Time O(h), not necessarily O(log n).

[Back to question](14-binary-search-trees.md#e142)

## Solutions - Chapter 15
### A15.1

Children 2i+1 and 2i+2; parent floor((i-1)/2) only for i&gt;0. Completeness packs each level without interior holes, so array offsets correspond directly to those tree positions.

[Back to question](15-heaps.md#q151)

### A15.2

Append 4 at index 7. Swap with 12 at index 3 -&gt; [3,7,5,4,9,8,10,12]; swap with 7 at index 1 -&gt; [3,4,5,7,9,8,10,12]. Parent 3 is already smaller, so stop.

[Back to question](15-heaps.md#q152)

### A15.3

Remove 3; place 10 at root -&gt; [10,7,5,12,9,8]. Swap with 5 -&gt; [5,7,10,12,9,8]; swap with 8 -&gt; [5,7,8,12,9,10]. Choosing a larger child could leave the new parent above a smaller sibling and violate heap order.

[Back to question](15-heaps.md#q153)

### A15.4

Use a size-k min heap. After processing any prefix, it contains that prefix's largest min(k,seenCount) values, counting duplicates. The minimum accepted value is the weakest candidate; replace it only for a larger incoming value.

[Back to question](15-heaps.md#q154)

### A15.5

Every other source's frontier remains its smallest unconsumed value. Only the popped source's frontier has changed. Later items in any sorted source cannot beat its frontier. Working heap space O(k), returned output O(N).

[Back to question](15-heaps.md#q155)

### A15.6

Start at floor(n/2)-1 and sift down to index 0. Most nodes are leaves or near leaves and move only zero/few levels. Summing height-weighted work gives a convergent constant times n; assigning log n work to every node overcounts.

[Back to question](15-heaps.md#q156)

### A15.7

D,B,C,A, because priorities ascend 1,2,7,10. A priority queue does not inherently
guarantee FIFO among equal priorities. Encode a sequence tie-breaker when required.

[Back to question](15-heaps.md#q157)

### A15.8

All lower values&lt;=all upper values; sizes equal or lower has exactly one extra. Odd count returns lower maximum. Even count averages lower maximum and upper minimum using overflow-safe addition and floating-point division.

[Back to question](15-heaps.md#q158)

### A15.9

Add O(log n), Median O(1), total storage O(n). One ordinary min/max heap exposes only a global extreme, not the two partition-boundary values needed for median. It could find a median with extra work, but does not provide this O(1) query directly.

[Back to question](15-heaps.md#q159)

### A15.10

Negating the minimum fixed-width signed integer cannot fit in that same type;
reverse the comparator instead. Adding two roots can overflow before division;
widen before adding, then use ordinary division to preserve a fractional median.

[Back to question](15-heaps.md#q1510)

### E15.1

Retained sets: {12}; {3,12}; {3,12,17}; {8,12,17}; {12,17,34}; {17,25,34}; {17,25,34}; {19,25,34}. Third largest=19. The sets describe membership, not sorted heap storage.

[Back to question](15-heaps.md#e151)

### E15.2

Last nonleaf=8/2-1=3. After i=3: [10,5,8,1,6,3,9,2]; i=2: [10,5,3,1,6,8,9,2]; i=1: [10,1,3,2,6,8,9,5]; i=0: [1,2,3,5,6,8,9,10]. Other valid arrangements may exist, depending on tie choices.

[Back to question](15-heaps.md#e152)

### E15.3

Medians 5,3.5,5,4.5,5,4.5. Final lower membership {1,2,4}, root 4; upper {5,8,10}, root 5. Both sizes are 3, so median=(4+5)/2=4.5.

[Back to question](15-heaps.md#e153)

### E15.4

Output [1,2,3,6,7,8,9,10,12]. A source must expose its least unconsumed item; if it is unsorted, an unseen smaller later value could precede emitted values and the merge would be incorrect.

[Back to question](15-heaps.md#e154)

## Solutions - Chapter 16
### A16.1

The contract specifies exactly which completions are generated from the current partial state and its permitted future choices. The base case recognizes a complete answer or impossibility. A measure such as undecided indices, unused positions, unfilled rows, or positive remaining target must move toward termination.

[Back to question](16-backtracking.md#q161)

### A16.2

Time is visited states times work per state, plus output construction. A sequential DFS keeps only the active chain, so stack space is O(d) for variable depth d and constant local frames, not O(total states). If 15 is an absolute fixed bound, stack is constant with respect to n.

[Back to question](16-backtracking.md#q162)

### A16.3

Undo restores every mutable component changed by the choice so siblings begin with the identical parent state. A copy preserves a finished result against later mutation of the reused path buffer; undo alone does not prevent saved-result aliasing.

[Back to question](16-backtracking.md#q163)

### A16.4

Subsets are [],[1],[2],[1,2], independent of enumeration order. Each index chooses include or exclude and advances to index+1. Empty input has exactly one result, the empty subset.

[Back to question](16-backtracking.md#q164)

### A16.5

The binary decision tree has 2^n leaves and O(2^n) nodes. For n&gt;=1, total copied elements are n*2^(n1), so copying takes Theta(n*2^n). Stack/path use O(n); output includes 2^n list objects and their contents.

[Back to question](16-backtracking.md#q165)

### A16.6

First 1: [1,2,3],[1,3,2]. First 2: [2,1,3],[2,3,1]. First 3: [3,1,2],[3,2,1]. There are 3!=6.

[Back to question](16-backtracking.md#q166)

### A16.7

([],FFF) -&gt; ([2],FTF) -&gt; ([2,3],FTT) -&gt; ([2,3,1],TTT). Snapshot the result. Undo input index 0: ([2,3],FTT). The flags refer to input indices 0,1,2, not output positions.

[Back to question](16-backtracking.md#q167)

### A16.8

used[i] is true if and only if input position i is present in current. Every selected index must be marked, and every marked index must be represented exactly once. Consequently true-flag count equals path length.

[Back to question](16-backtracking.md#q168)

### A16.9

Any unused index may fill the next output position, including earlier indices. A stale true flag leaves path and availability inconsistent; later sibling branches cannot use that index and may fail to produce otherwise valid complete permutations.

[Back to question](16-backtracking.md#q169)

### A16.10

Available choices shrink n,n-1,...,1 because each input index is used once. Copying n! length-n results gives Theta(n*n!) time/output storage. The active path, used flags, and stack together use O(n) extra space.

[Back to question](16-backtracking.md#q1610)

### A16.11

It distinguishes the equal values' input indices. Swapping those indices can create the same value sequence, so six index permutations contain only [1,1,2],[1,2,1],[2,1,1] as unique outputs.

[Back to question](16-backtracking.md#q1611)

### A16.12

At root i=1: i&gt;0, equal predecessor, and !used[0] are all true, so skip the equivalent sibling. Under path [1] with used[0]=true, the last condition is false, so allow the second 1 as a deeper occurrence.

[Back to question](16-backtracking.md#q1612)

### A16.13

Sorting puts equal candidates adjacent so nums[i]==nums[i-1] identifies interchangeable choices. It does not forbid repeated values in a path; !used[i-1] distinguishes an equivalent sibling from a needed deeper copy.

[Back to question](16-backtracking.md#q1613)

### A16.14

Results are [1,2],[1,3],[1,4],[2,3],[2,4],[3,4]. Advancing to candidate+1 forbids reuse and reverse-order duplicates. Resetting to 1 admits reorderings; staying at candidate admits repetitions.

[Back to question](16-backtracking.md#q1614)

### A16.15

No. Choosing 1 creates Search(2). That call's start remains 2 even after its local loop finishes candidate 2 and advances to 3. Distinguish the fixed lower bound from the candidate currently being tested.

[Back to question](16-backtracking.md#q1615)

### A16.16

Candidate x leaves n-x+1 available values including itself. With needed=k-current.Count, completion requires n-x+1&gt;=needed, or x&lt;=n-needed+1. Any larger x leaves too few choices.

[Back to question](16-backtracking.md#q1616)

### A16.17

needed=2, final candidate=6; try 5 then 6. Completed descendants are [2,4,5,6],[2,4,5,7],[2,4,6,7]. Trying 7 directly at this level cannot fill two remaining slots.

[Back to question](16-backtracking.md#q1617)

### A16.18

The partial path [5] is ordered and distinct but cannot reach length three. Without feasibility pruning, it is explored and rejected later; with pruning, it is avoided earlier. Correct pruning improves efficiency without changing the valid results.

[Back to question](16-backtracking.md#q1618)

### A16.19

There are C(n,k) outputs of length k. The displayed pruned generator has O((k+1)*C(n,k)) traversal/copy time and O(k+1) active space. An unpruned version can visit sum(j=0..k) C(n,j) prefixes; for k=n that is exponential despite one output.

[Back to question](16-backtracking.md#q1619)

### A16.20

Results are [2,2,2,2],[2,3,3],[3,5]. Direct states (current,remaining,start): ([],8,0),([2],6,0),([2,3],3,1),([2,3,3],0,1).

[Back to question](16-backtracking.md#q1620)

### A16.21

Reusable: Search(i,remaining-candidate). Single-use: Search(i+1,remaining-candidate). The availability boundary and the target reduction are independent changes; both must match the contract.

[Back to question](16-backtracking.md#q1621)

### A16.22

Once a sorted candidate exceeds remaining, all later candidates also exceed it. A reusable zero makes no progress; negative values break the decreasing-target proof and can create infinite families or unsafe overshoot pruning. The displayed method rejects nonpositive candidates.

[Back to question](16-backtracking.md#q1622)

### A16.23

Candidate indices never decrease. Reuse can keep index 0 for 2, but after advancing to index 1 for 3 the path cannot return to 2. Nondecreasing candidate order canonicalizes value combinations.

[Back to question](16-backtracking.md#q1623)

### A16.24

return stops the entire state when no continuation can succeed. break stops a sorted sum-candidate loop when the current and all later values are too large. continue skips only a redundant duplicate or one conflicting queen square, leaving other choices available.

[Back to question](16-backtracking.md#q1624)

### A16.25

Soundness: every returned answer is valid. Completeness: every valid answer is returned. Unsafe pruning can keep all returned combinations valid while omitting others, so it preserves soundness but destroys completeness.

[Back to question](16-backtracking.md#q1625)

### A16.26

Attacking queens violate a committed constraint. Two remaining candidates for three required positions are insufficient resources. An upper bound on possible future sum below the target is bound-based impossibility. Each needs a proof that no discarded extension can succeed.

[Back to question](16-backtracking.md#q1626)

### A16.27

row-col values are -2,0,2; row+col is 4 for all three, so they share the ascending diagonal. Different diagonal families are tracked separately even if their numeric keys coincide.

[Back to question](16-backtracking.md#q1627)

### A16.28

Occupied columns {1,3}, descending {-1,-2}, ascending {1,4}; proposed keys 0,2,2 are unused in their families. Choose board[2][0]='Q' and add 0,2,2 to the sets. Undo clears that board cell and removes all three entries.

[Back to question](16-backtracking.md#q1628)

### A16.29

Earlier rows each contain exactly one mutually non-attacking queen, and board/sets match them exactly. At row n all rows are filled under those constraints. One conflicting column does not rule out other columns in the row, so use continue rather than abandoning the call.

[Back to question](16-backtracking.md#q1629)

### A16.30

The shown board uses O(n^2), with O(n) sets/stack. Q result boards require O(Q*n^2) copied characters. Unique columns give a factorial candidate-tree intuition; scanning n columns per state adds work, so O(n*n! + Q*n^2) is a conservative bound for this implementation, not an exact Theta(n!) claim.

[Back to question](16-backtracking.md#q1630)

### E16.1

The eight subsets are [],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3], in any enumeration order. Each element occurs in four subsets, giving 3*4=12 stored integers.

[Back to question](16-backtracking.md#e161)

### E16.2

A previous branch removed its first value but failed to reset the corresponding flag. Restore used[0]=false during that branch's undo, alongside path removal. Do not reset all flags globally inside recursion; that would lose valid ancestor choices.

[Back to question](16-backtracking.md#e162)

### E16.3

Count=4!/(2!*2!)=6: [1,1,2,2],[1,2,1,2],[1,2,2,1],[2,1,1,2],[2,1,2,1],[2,2,1,1]. Sort and suppress equal unused predecessor branches.

[Back to question](16-backtracking.md#e163)

### E16.4

needed=3,last=3, so root candidates are 1,2,3. The only completion beginning with 3 is [3,4,5]. Root 4 cannot leave enough available numbers.

[Back to question](16-backtracking.md#e164)

### E16.5

Search(1) chooses 1 -&gt; Search(2). That call eventually tries candidate 3 -&gt; Search(4), which chooses 4 - &gt; Search(5), then snapshots at length three. The earlier Search(2) argument never became 3.

[Back to question](16-backtracking.md#e165)

### E16.6

Reusable gives [2,2,3] and [7]. Single-use gives only [7]. Change both the availability transition (i to i+1) and preserve subtraction of the chosen value.

[Back to question](16-backtracking.md#e166)

### E16.7

Later 3 can participate in [3,3] under reuse. A break at 7 suppresses that branch. Either sort first, making all later values also too large, or continue past only the oversized candidate.

[Back to question](16-backtracking.md#e167)

### E16.8

Sequences [1,3,0,2] and [2,0,3,1]. For [1,3,0,2], descending keys [-1,-2,2,1] and ascending [1,4,2,5] are each unique, as are the columns. Render rows as .Q.. / ...Q / Q... / ..Q. (four characters per row).

[Back to question](16-backtracking.md#e168)

### E16.9

For branching greater than one, the geometric tree has O(4^d) nodes. Constant local-frame stack is O(d). Add actual per-state candidate checks and total output-copy length rather than assuming the tree bound includes all of them. For literal d=6, counts are finite constants.

[Back to question](16-backtracking.md#e169)

### E16.10

No. It may explore every increasing partial subset before rejecting incomplete branches, visiting 2^n states. Output size is only a lower bound on required work. The feasibility bound in the displayed pruned implementation removes those doomed prefixes.

[Back to question](16-backtracking.md#e1610)

## Solutions - Chapter 17
### A17.1

Examples: two pointers, binary search, adjacent duplicate grouping, interval merging, greedy/event ordering. For a fresh O(n log n) sort followed by O(n) scan, total is O(n log n), not O(n).

[Back to question](17-sorting.md#q171)

### A17.2

Order is (B,70),(D,70),(A,80),(C,80). Equal-score records keep original identity order: B before D and A before C.

[Back to question](17-sorting.md#q172)

### A17.3

Yes. It may allocate no input-sized array but retain O(log n) recursive frames. State data-movement and stack-space costs separately; iterative Heap Sort is a different constant-auxiliary-space case.

[Back to question](17-sorting.md#q173)

### A17.4

The final suffix contains the largest finalized values. A full pass with no swaps means every relevant adjacent pair is ordered, while the suffix was already finalized, so the entire array is sorted.

[Back to question](17-sorting.md#q174)

### A17.5

Swap states are [3,6,8,2,5], [3,6,2,8,5], [3,6,2,5,8]. Comparing 6 and 8 requires no swap. The 8 is finalized.

[Back to question](17-sorting.md#q175)

### A17.6

The prefix contains the globally smallest finalized values in sorted order, not merely an internally sorted set. (4,A),(4,B),(1,C) becomes (1,C),(4,B),(4,A), reversing A and B.

[Back to question](17-sorting.md#q176)

### A17.7

Save key=3; shift 8 -&gt; [1,4,6,8,8], shift 6 -&gt; [1,4,6,6,8], shift 4 -&gt; [1,4,4,6,8], then insert -&gt; [1,3,4,6,8].

[Back to question](17-sorting.md#q177)

### A17.8

Bubble with a flag and Insertion can take O(n) best time; Selection still performs Theta(n^2) comparisons. All use O(1) auxiliary space. Strict-swap Bubble and strict-shift Insertion are stable; standard swap-based Selection is not.

[Back to question](17-sorting.md#q178)

### A17.9

First mid=3: [0..3],[4..6]. Next: [0..1],[2..3],[4..5],[6..6]. Index 7 is invalid.

[Back to question](17-sorting.md#q179)

### A17.10

Take 1(R),2(L),4(L),4(R),7(R),9(L),10(R). Equal 4s choose the left record first because it occurred earlier in the source range.

[Back to question](17-sorting.md#q1710)

### A17.11

Each half is already sorted. The current pointer in each half exposes its least unmerged item, so the next global item is one of those two. Each pointer advances through its half once.

[Back to question](17-sorting.md#q1711)

### A17.12

Halving yields O(log n) levels; disjoint merges at each level cover O(n) elements. The displayed sort takes Theta(n log n) time. One reusable n-element buffer plus O(log n) active frames gives O(n) peak space, not n times the number of levels.

[Back to question](17-sorting.md#q1712)

### A17.13

[left,smallEnd] is processed &lt;=pivot; [smallEnd+1,j) is processed &gt;pivot; [j,right) is unprocessed; nums[right] is the reserved pivot.

[Back to question](17-sorting.md#q1713)

### A17.14

The j loop examines indices 0..5 only. After processing, smallEnd=3; a separate swap of indices 4 and 6 produces [4,3,1,2,5,9,8], pivot index 4.

[Back to question](17-sorting.md#q1714)

### A17.15

All left values are &lt;=pivot and all right values are &gt;pivot, fixing a valid sorted rank for the pivot. Recursion orders the sides without changing how many elements belong before it.

[Back to question](17-sorting.md#q1715)

### A17.16

Sort 2..5 and 7..9. If pivot==right and recursion uses Sort(left,pivot), it repeats the same range and may never terminate.

[Back to question](17-sorting.md#q1716)

### A17.17

Balanced ranges create O(log n) levels with O(n) total work each: O(n log n) time, O(log n) stack. Extreme pivots create n,n-1,... work: O(n^2) time and O(n) stack. Constant-space partitioning does not remove those frames.

[Back to question](17-sorting.md#q1717)

### A17.18

No. Randomization provides probabilistic protection against bad distinct-key input order, not guaranteed halving or elimination of the quadratic worst case. With &lt;= two-way Lomuto, all equal keys still put the pivot at one end; duplicate-aware partitioning is an extension.

[Back to question](17-sorting.md#q1718)

### A17.19

Last nonleaf=2. Intermediate [3,9,5,1,4,2], then [9,3,5,1,4,2], then [9,4,5,1,3,2]. Swap root/end and restore size 5 -&gt; [5,4,2,1,3 | 9].

[Back to question](17-sorting.md#q1719)

### A17.20

[0,end) is the active max heap; [end,n) contains the largest finalized values in ascending order. Index end has just received a final maximum and must not be restored back into the heap.

[Back to question](17-sorting.md#q1720)

### A17.21

Swapping parent 2 with child 5 while sibling 8 remains would leave 5&lt;8. Choose 8 instead. Bottom-up build is O(n), extraction total O(n log n), and the iterative code uses O(1) auxiliary space.

[Back to question](17-sorting.md#q1721)

### A17.22

min=-3,max=2,R=6; distinct offsets 0,2,5. Counts [2,0,1,0,0,1]. Output [-3,-3,-1,2]. Compute range and offsets in widened arithmetic.

[Back to question](17-sorting.md#q1722)

### A17.23

A manageable range R relative to n makes O(n+R) competitive. Basic frequency reconstruction uses O(R) extra space; stable record placement uses O(n+R), including output. Three values spanning a billion-key range are unsuitable despite small n.

[Back to question](17-sorting.md#q1723)

### A17.24

Each is an exclusive end for its key block. Key ranges occupy 0..1,2,3..5,6..7. Scanning original records right-to-left and placing at --counts[key] keeps earlier equal records before later ones.

[Back to question](17-sorting.md#q1724)

### A17.25

Writing only keys loses payload identity. A stable version must carry full records, derive output positions from cumulative counts, and preserve equal-key input order during placement.

[Back to question](17-sorting.md#q1725)

### A17.26

Digits are 3,8,5,0. Ones result [31,11,22,42,14,25]. Its tens digits are [3,1,2,4,1,2], yielding [11,14,22,25,31,42].

[Back to question](17-sorting.md#q1726)

### A17.27

After each pass, all processed lower digits are correctly ordered; the next
stable pass preserves their tie order. Time O(d*(n+b)), live space O(n+b).
Use a sufficiently wide exponent or a guarded final multiplication so the
digit loop does not overflow.

[Back to question](17-sorting.md#q1727)

### A17.28

Indices are 3,7,9,0 respectively. General rules are kth smallest k-1 and kth largest n-k.

[Back to question](17-sorting.md#q1728)

### A17.29

Target=1. Partition -&gt; [3,1,5,8,6], pivot 2, keep 0..1. Partition [3,1] -&gt; [1,3,5,8,6], pivot 0, keep 1..1. Return 3.

[Back to question](17-sorting.md#q1729)

### A17.30

Selection follows only the target side, with balanced work n+n/2+...=O(n); full sorting processes both sides at every level. The average needs pivot/input assumptions, not guaranteed halves. Deterministic worst time is O(n^2), iterative extra space O(1), and input is modified.

[Back to question](17-sorting.md#q1730)

### A17.31

Negative means a before b; zero means tied under the chosen keys; positive means
a after b. Reverse the argument order for descending comparison rather than
subtracting. A&lt;B,B&lt;C,C&lt;A is cyclic and violates transitivity.

[Back to question](17-sorting.md#q1731)

### A17.32

Use one comparator: compare ordinal teams; if nonzero return; otherwise compare b.Score to a.Score; if nonzero return; otherwise compare ordinal names. A zero result means equality under these keys, not necessarily complete object equality.

[Back to question](17-sorting.md#q1732)

### A17.33

n! distinct orders require at least n! decision-tree leaves. With at most 2^h leaves,

[Back to question](17-sorting.md#q1733)

h&gt;=log2(n!)=Omega(n log n). Counting/Radix exploit bounded ranges/digits rather than learning order only through arbitrary pair comparisons.  Back to question

### A17.34

Use Counting Sort for compact ranges; Merge Sort for stable O(n log n) guarantees; Insertion for small/nearly sorted; iterative Heap Sort for O(1) auxiliary and O(n log n) worst time; Quickselect for an inmemory rank; a size-k heap for streaming Top-K. State mutation, stability, memory, and worst-case assumptions.

[Back to question](17-sorting.md#q1734)

### E17.1

Expected B,D,A,C. A stable algorithm must preserve B before D and A before C.
An unspecified library sort need not be stable. A complete original-index
tie-breaker can reproduce input order under ties, or use a stable algorithm.

[Back to question](17-sorting.md#e171)

### E17.2

Selection scans for global minimum 2, swaps with 7, and finalizes [2 | 4,6,7,5]. Insertion saves 3, shifts 8,6,4, then creates [1,3,4,6,8]; its prior sorted prefix did not necessarily contain globally final values.

[Back to question](17-sorting.md#e172)

### E17.3

Take (4,A) first on the tie, then (4,C),(6,D),(7,B). The earlier left 4 remains before the later right 4.

[Back to question](17-sorting.md#e173)

### E17.4

One last-pivot Lomuto result is [4,2,3,6,7], pivot index 3. All left values&lt;=6 and all right values&gt;6, so pivot rank is fixed. The left [4,2,3] is not yet sorted.

[Back to question](17-sorting.md#e174)

### E17.5

Bottom-up build creates [10,5,3,4,1] in O(n). First extraction yields [5,4,3,1 | 10]. Repeated extraction sorts everything in O(n log n) worst time; building a heap alone neither sorts it nor costs n log n.

[Back to question](17-sorting.md#e175)

### E17.6

Frequency blocks for 70 and 80 end exclusively at 1 and 3. Traverse C,B,A from right to left: C goes to index 2, B to 0, A to 1, producing [(70,B),(80,A),(80,C)]. Output must preserve the records, not just numeric scores.

[Back to question](17-sorting.md#e176)

### E17.7

Passes: [170,90,802,2,24,45,75,66]; [802,2,24,45,66,170,75,90]; [2,24,45,66,75,90,170,802]. Live storage is one pass output plus base-sized counts, O(n+b), not one retained array per digit.

[Back to question](17-sorting.md#e177)

### E17.8

Define median convention first; an odd median uses index n/2, while an even arithmetic median needs two central values. Fifth-largest uses n-5 and Quickselect if only that rank is needed. Use size-20 min heap for the stream and full sorting for complete order.

[Back to question](17-sorting.md#e178)

### E17.9

Intervals [2,7],[1,4],[2,5],[1,6] -&gt; [1,6],[1,4],[2,7],[2,5]. Items (4,2),(1,3),(2,2),(7,1) -&gt; (1,3),(2,2),(4,2),(7,1). Return the first nonzero higher-priority comparison.

[Back to question](17-sorting.md#e179)

### E17.10

Counting Sort uses only R=101 count slots, avoiding Radix's multiple passes/output storage. Merge Sort supplies stability and worst-case O(n log n), while normal Heap Sort is unstable. Always include preprocessing, input mutation, key range, and real memory limits.

[Back to question](17-sorting.md#e1710)

## Solutions - Chapter 18
### A18.1

Friendships undirected/unweighted; follows directed/unweighted; two-way timed roads undirected/weighted; prerequisites directed/unweighted. Direction and weighting are independent; one-way timed roads would instead be directed/weighted.

[Back to question](18-graphs.md#q181)

### A18.2

0:[1,2],1:[0,3],2:[0,3],3:[1,2]. Four vertex lists, eight neighbor entries because each undirected edge appears twice. Storage O(V+2 E)=O(V+E).

[Back to question](18-graphs.md#q182)

### A18.3

Lists use O(V+E), scan neighbors by degree, and usually test a specific edge in O(degree). Matrices use O(V^2), test in O(1), scan a row in O(V). Edge lists suit global scans and sorted edges. Keep every vertex, including sinks/isolates, in the representation.

[Back to question](18-graphs.md#q183)

### A18.4

The queue holds discovered but unprocessed vertices in nondecreasing source distance. Mark when enqueuing so the first discovery reserves the vertex and later parents cannot enqueue it again.

[Back to question](18-graphs.md#q184)

### A18.5

Removals 0,1,2,3,4,5. Queues after each are [1,2],[2,3,4],[3,4,5],[4,5],[5],[]. Node 4 is not rescheduled by 2. Distances [0,1,1,2,2,2].

[Back to question](18-graphs.md#q185)

### A18.6

All shorter layers are processed earlier; any shorter route would have discovered X from an earlier predecessor. Distance 4 means four edges, three intermediate vertices, five vertices including endpoints. The guarantee minimizes cost only for equal nonnegative edge costs.

[Back to question](18-graphs.md#q186)

### A18.7

Order 0,1,3,4,2,5. Calls form 0-&gt;1 with children 3 and 4, then 4-&gt;2-&gt;5. Vertex 2 is first entered from 4, not directly from 0; 0 later skips its already visited neighbor 2.

[Back to question](18-graphs.md#q187)

### A18.8

A call finishes the reachable still-unvisited region available to it. Each vertex is entered/processed once, using visited state to skip repeats. Reachability asks which vertices can be reached, not a potentially exponential enumeration of every route.

[Back to question](18-graphs.md#q188)

### A18.9

Recursion and stored (vertex, nextNeighbor) frames preserve suspended adjacency scans with O(V) active frames. Mark-on-pop vertex stacks may schedule duplicates and use O(E) pending entries. Reverse pushing controls LIFO neighbor order, but exact discovery behavior depends on marking strategy.

[Back to question](18-graphs.md#q189)

### A18.10

Components {0,1,2,3},{4,5,6},{7}. Roots encountered in ascending outer loop are 0,4,7, counts 1,2,3. Vertex 6 is linked to 4 and is not isolated.

[Back to question](18-graphs.md#q1810)

### A18.11

Each start processes only its own unvisited component. Vertex and edge totals add across disjoint components, giving O(V+E) rather than K full scans of the graph.

[Back to question](18-graphs.md#q1811)

### A18.12

Ignore an already visited neighbor equal to the current parent. A visited neighbor different from parent detects a cycle in a simple graph. Recurse as Visit(neighbor, currentNode), not Visit(neighbor, currentParent), and propagate a true child return.

[Back to question](18-graphs.md#q1812)

### A18.13

Calls Visit(0,-1), Visit(1,0), Visit(2,1), Visit(3,2). At 3, neighbor 0 is visited and not parent 2, so report cycle. Inspect and ignore reverse parent edges; do not recursively enter those already visited parents.

[Back to question](18-graphs.md#q1813)

### A18.14

Visiting vertices are on the active path: an edge back to one closes a directed cycle. Processed vertices are finished, so a later edge into them can be ordinary convergence. A boolean visited cannot distinguish the two.

[Back to question](18-graphs.md#q1814)

### A18.15

The former branches converge at a finished/shared target without a route back. In the latter, edge 2- &gt;1 reaches an ancestor still visiting, closing a directed cycle. Applying the undirected parent-skip rule to directed edges would be incorrect.

[Back to question](18-graphs.md#q1815)

### A18.16

Queue every zero-indegree vertex. Remove u, append, decrement each successor, enqueue when its unresolved indegree reaches 0. Queued vertices have no remaining prerequisite. A full order needs processedCount==V; fewer means a directed cycle remains.

[Back to question](18-graphs.md#q1816)

### A18.17

Finishing neighbors before u puts successors before u in finish order; reversal places u before every successor. Cycle detection is required. Unrelated vertices may appear in different orders, so a DAG can have multiple topological orders.

[Back to question](18-graphs.md#q1817)

### A18.18

Every edge must connect opposite colors 0/1. A square can alternate colors; a triangle cannot because of an odd cycle; a self-loop immediately conflicts. Check every component, since one odd-cycle component makes the whole graph non-bipartite.

[Back to question](18-graphs.md#q1818)

### A18.19

Traversable cells are vertices; allowed geometric moves define edges generated on demand. Check bounds before indexing. Diagonal-only contact connects under eight-directional movement but not fourdirectional movement.

[Back to question](18-graphs.md#q1819)

### A18.20

Initialize every distinct source at distance 0 before processing. Final distances [1,0,1,2,2,1,0,1]. The shared wavefront visits each vertex once; duplicate source IDs can be deduplicated.

[Back to question](18-graphs.md#q1820)

### A18.21

Rows [0,1,2,1],[1,2,1,0],[2,3,2,1]. The second source is row 1, column 3, not row 2, column 3. Each cell takes its smaller Manhattan distance to either source.

[Back to question](18-graphs.md#q1821)

### A18.22

Only those entries belong to the current time level; new entries represent the next time. No targets initially returns 0. Targets remaining when the queue empties returns-1. Otherwise return the elapsed time, not the number of queue operations.

[Back to question](18-graphs.md#q1822)

### A18.23

The source at(0,0) has blocked right/down neighbors and boundaries above/left. It reaches none of the five targets, so remaining stays 5 and the result is-1.

[Back to question](18-graphs.md#q1823)

### A18.24

Distances [0,1,1,2,2,3], parents[-1,0,0,1,1,3]. First discovery of 5 comes from 3, producing 0-&gt;1-&gt;3-&gt;5. The route through 4 is also shortest but does not replace the first parent under this order.

[Back to question](18-graphs.md#q1824)

### A18.25

BFS may stop at first discovery under equal-cost edges. Dijkstra may stop only on the target's current non-stale minimum-priority removal with nonnegative weights; its first insertion may later improve. Earlystopped runs do not claim a complete all-vertex result.

[Back to question](18-graphs.md#q1825)

### A18.26

BFS;0-1 BFS with distance relaxation and deque front/back rules; Dijkstra; Bellman-Ford with reachable-negative-cycle detection; Floyd-Warshall when all-pairs matrix/time is affordable. State expansion changes what counts as a vertex before making this choice.

[Back to question](18-graphs.md#q1826)

### A18.27

Compute candidate=d[u]+w; if candidate&lt;d[v], set d[v]=candidate, parent[v]=u, and enqueue v with that priority. Lazy queues do not delete the old entry; skip it later when its priority is not current.

[Back to question](18-graphs.md#q1827)

### A18.28

Distances[0,3,1,4], parents[-1,2,0,1], path 0-&gt;2-&gt;1-&gt;3, cost 4. Stale entries(vertex 1, cost 4) and(vertex 3, cost 6) were both superseded.

[Back to question](18-graphs.md#q1828)

### A18.29

Distances[0,5,2,6,6], parents[-1,2,0,2,1], path 0-&gt;2-&gt;1-&gt;4, cost 6. Stale(1,7),(3,10),(4,11). Vertices 3 and 4 have equal final priority 6 and may be extracted in either tie order.

[Back to question](18-graphs.md#q1829)

### A18.30

Vertex 1 appears final at 3 before 2 is processed, but 0-&gt;2-&gt;1 costs 1. A later negative edge can return with a smaller cost, invalidating Dijkstra's greedy proof and safe early stop. Use a negative-edge-capable algorithm.

[Back to question](18-graphs.md#q1830)

### A18.31

At most O(E+1) entries are inserted from successful relaxations, and obsolete ones are still removed. Queue size can be O(E), with log(E+2) operations. Including validation/setup, O(V+E log(E+2)) is safe; simplegraph assumptions yield the common log V shorthand.

[Back to question](18-graphs.md#q1831)

### A18.32

Without a relevant negative cycle, a finite shortest path can be simple with at most V-1 edges. Complete passes propagate those possibilities; in-place order may propagate faster. Early stopping requires an entire pass with no change, not just reaching the final ordinary pass.

[Back to question](18-graphs.md#q1832)

### A18.33

With edge order 2-&gt;3(3),1-&gt;2(-2),0-&gt;1(4),0-&gt;2(5),1-&gt;3(6), pass arrays are[0,4,5,10],[0,4,2,8],[0,4,2,5]. Parent[-1,0,1,2], path 0-&gt;1-&gt;2-&gt;3, cost 5. A separate extra scan finds no cycle.

[Back to question](18-graphs.md#q1833)

### A18.34

Pass 1[0,-2,-1,1], pass 2[0,-5,-4,-2], pass 3[0,-8,-7,-5]. Edge 1-&gt;2 can still lower-7 to-10. In-place updates affect later edges immediately. The cycle 1-&gt;2-&gt;1 weighs-3 and also makes downstream 3 unbounded below.

[Back to question](18-graphs.md#q1834)

### A18.35

Edges from infinity must be skipped. An unreachable negative cycle is not detected by that sourcespecific run and does not affect its paths. When a reachable-negative-cycle flag is true, affected labels/parent chains are not finite shortest answers; do not blindly reconstruct them.

[Back to question](18-graphs.md#q1835)

### A18.36

Diagonal starts 0, other entries infinity, direct edges take minimum cost. Relax d[i, j] with d[i, k]+d[k, j] only when both finite; k is outermost. Preserve the minimum of parallel edges and do not overwrite a negative self-loop with zero.

[Back to question](18-graphs.md#q1836)

### A18.37

k 0 improves(2,1) to 7; k 1 improves(0,2) to 6; k 2 improves(1,0) to 5. Final rows[0,4,6],[5,0,2],[3,7,0].

[Back to question](18-graphs.md#q1837)

### A18.38

It proves a negative closed walk and hence a negative cycle. Pair(i, j) is unbounded below when i can reach some negative-diagonal k and k can reach j. Other unreachable/unaffected pairs need not be invalid. The shown flag does not mark each pair.

[Back to question](18-graphs.md#q1838)

### A18.39

Skipping infinity prevents meaningless additions, but two finite values can
still overflow or collide with a reserved sentinel. The shared helper uses
checked addition and rejects a collision instead of wrapping or treating a
reachable cost as unreachable.

[Back to question](18-graphs.md#q1839)

### A18.40

For u-&gt;v(w): (u,0)-&gt;(v,0) costw,(u,1)-&gt;(v,1) costw,(u,0)-&gt;(v,1) cost 0. No used-to-unused transition. Start at(source,0); optional answer takes minimum over destination layers, mandatory use selects layer 1.

[Back to question](18-graphs.md#q1840)

### A18.41

For 0-&gt;1(5),0-&gt;2(2),2-&gt;1(1),1-&gt;3(4),2-&gt;3(10), best 0-&gt;2-&gt;3 uses coupon on 2-&gt;3, total 2. Unused[0,3,2,7], used[INF,0,0,2]. The free 0-&gt;1 arrival is cost 0, so its normal continuation costs 4.

[Back to question](18-graphs.md#q1841)

### A18.42

There are 2 V states,2 E normal transitions, E free-edge transitions, total 3 E. Same physical vertex with used/unused coupon has different future options, so one scalar distance is insufficient. General resource-state counts can be much larger than a constant.

[Back to question](18-graphs.md#q1842)

### A18.43

Find returns the representative and compresses only its traversed chain. Union finds roots, links lower rank under higher, and increments a winning root only on equal ranks. It does not flatten every descendant, reset losing ranks, or maintain original graph paths.

[Back to question](18-graphs.md#q1843)

### A18.44

Final immediate parent[0,0,0,2,4,4], rank[2,0,1,0,1,0]. Before Find(3), chain 3-&gt;2-&gt;0; Find changes parent[3] from 2 to 0, leaving rank unchanged. A prior Connected(0,3) can already perform that compression.

[Back to question](18-graphs.md#q1844)

### A18.45

Counts 6 initially, then 5,4,3,2,2,1. Edge 4-1 is rejected; cycle 1-2-3-4-1 does not include 0. Final 4-5 joins different components. Process each undirected edge once, not both adjacency copies.

[Back to question](18-graphs.md#q1845)

### A18.46

A spanning tree connects all vertices without cycles usingV-1 edges. MST minimizes total chosen edge weight. Disconnected input needs a forest rather than one global tree. A source shortest-path tree minimizes routes from that source, not the sum of a connection network.

[Back to question](18-graphs.md#q1846)

### A18.47

Add a cheapest crossing edge to an optimum lacking it; the resulting cycle contains another crossing edge of no smaller cost. Exchange preserves or reduces total, so some optimum includes the choice. With ties, it need not belong to every MST.

[Back to question](18-graphs.md#q1847)

### A18.48

Accept 1-2(2),0-2(3); reject 0-1(4); accept 1-3(5),3-4(6), stop.Total 16. Its 0-to 4 tree route costs 16, while original 0-&gt;2-&gt;4 costs 11. Weights 7/8 were not processed after completion.

[Back to question](18-graphs.md#q1848)

### A18.49

Priority is one crossing-edge weight, not accumulated distance. From 0 accept 0-2(3),2-1(2), skip popped 0-1(4), accept 1-3(5),3-4(6), total 16. Candidates 2-3(7),2-4(8) remain unused at early stop, not actually popped/skipped.

[Back to question](18-graphs.md#q1849)

### A18.50

Both MST algorithms allow negative edge weights on undirected graphs. Kruskal returns a forest and component count; the shown Prim returns its starting-component tree with SpansAll=false if disconnected. The graph source hands off to Dynamic Programming; Chapter 19 now documents those later lessons and their checkpoint status.

[Back to question](18-graphs.md#q1850)

### E18.1

Eight lists,12 neighbor entries for six edges, three components{0,1,2,3},{4,5,6},{7}, with 7 the only isolate. New outer-loop starts 0,4,7.

[Back to question](18-graphs.md#e181)

### E18.2

BFS0,1,2,3,4,5 discovers 2 directly from 0. DFS0,1,3,4,2,5 discovers 2 from 4. Both reach every vertex, but order and selected search tree differ.

[Back to question](18-graphs.md#e182)

### E18.3

Kahn with ascending initial queue gives[0,1,2,3,4]. The displayed DFS neighbor order gives[1,3,0,2,4]. Both place each edge's source before its destination; alternative valid orders are acceptable.

[Back to question](18-graphs.md#e183)

### E18.4

Use edge 0-1 and triangle 2-3-4-2. Coloring only 0's component succeeds falsely; the outer loop reaches the triangle and finds an odd-cycle conflict.

[Back to question](18-graphs.md#e184)

### E18.5

Four-direction count 2; eight-direction count 1. Connectivity follows legal moves, so diagonal contact must not be silently added or removed.

[Back to question](18-graphs.md#e185)

### E18.6

Line 0..7 sources 1,6 -&gt;[1,0,1,2,2,1,0,1]. Grid sources(0,0),(1,3) -&gt;rows[0,1,2,1],[1,2,1,0],[2,3,2,1]. No graph sources leaves all distances-1; a spread grid with no targets returns 0 even without sources; existing targets without a source return-1.

[Back to question](18-graphs.md#e186)

### E18.7

Trace A:d=[0,3,1,4], p=[-1,2,0,1], cost 4 to 3. Trace B:d=[0,5,2,6,6], p=[-1,2,0,2,1], cost 6 to 4. Parent entries identify predecessor vertices; costs belong only in distance.

[Back to question](18-graphs.md#e187)

### E18.8

Finite pass arrays[0,4,5,10],[0,4,2,8],[0,4,2,5], extra scan unchanged. Negative pass arrays[0,-2,-1,1],[0,5,-4,-2],[0,-8,-7,-5], then 1-&gt;2 still improves. In-place edge order drives exact values.

[Back to question](18-graphs.md#e188)

### E18.9

Distances 6,5,7. The matrix alone stores costs; maintain a next-hop or predecessor matrix during improvements to reconstruct routes. This is an optional extension, not something the distance-only function already returns.

[Back to question](18-graphs.md#e189)

### E18.10

Best target 3 cost 2 via 0-&gt;2 then free 2-&gt;3. At source 0, optional use permits empty path cost 0. Mandatory use requires a reachable used-layer return; in this acyclic graph that is unreachable, so d[0,1]=INF. Do not initialize it to 0.

[Back to question](18-graphs.md#e1810)

### E18.11

Results true, false, true. Find inside Connected may compress parent chains, so it can change internal parents while leaving represented connectivity unchanged. Before querying 3 its path can still be 3-&gt;2-&gt;0.

[Back to question](18-graphs.md#e1811)

### E18.12

Kruskal accepts 1-2,0-2,1-3,3-4; Prim from 0 accepts 0-2,2-1,1-3,3-4.Total 16 in both. Original 0-&gt;2-&gt;4 costs 11, less than the tree route 16; MST is not all-pairs shortest paths.

[Back to question](18-graphs.md#e1812)

### E18.13

Three components. With no directed dependencies, Kahn returns any order covering all three and IsDag=true. Kruskal returns empty forest, total 0, Components 3. Prim from 0 returns empty component tree, total 0, SpansAll=false. Empty selected edges is not a global connected MST.

[Back to question](18-graphs.md#e1813)

### E18.14

BFS;0-1 BFS; Bellman-Ford; Floyd-Warshall if size permits; DSU for additions/merges; Kruskal or Prim for undirected MST. Recheck source/target/state and disconnected-input contracts before coding.

[Back to question](18-graphs.md#e1814)

## Solutions - Chapter 19
### A19.1

A state records every fact that affects the remaining answer, so equal keys mean equivalent future problems. Overlap concerns repeated questions over the whole search; the active stack holds only one dependency chain. Cache size and stack depth are different costs.

[Back to question](19-dynamic-programming.md#q191)

### A19.2

Define state, legal choices, base cases, transition, dependency order, final answer, and state-count times per-state work. Operators are min, max, sum of correctly disjoint cases, and Boolean OR respectively.

[Back to question](19-dynamic-programming.md#q192)

### A19.3

Plain recursion has O(2^n) call-work upper bound and O(n) stack. Memoisation O(n) work and O(n) cache+stack. Tabulation O(n) work/table; rolling O(n) work and O(1) fixed-width slots.

[Back to question](19-dynamic-programming.md#q193)

### A19.4

The empty move sequence is one way to finish zero steps. Last move 1 or 2 partitions routes disjointly:W(i)=W(i-1)+W(i-2). Values[1,1,2,3,5,8], answer 8.

[Back to question](19-dynamic-programming.md#q194)

### A19.5

Reach bases 0,0 include no leave cost until transitions; answer reach[n]. Leave bases cost[0], cost[1] include current cost; answer min(last two leave states). Leave table[10,15,30], optimum 15.

[Back to question](19-dynamic-programming.md#q195)

### A19.6

For[2,7,9,3,1], inclusive DP[2,7,11,11,12], indices[0,2,4], total 12. The earlier prefix optimum does not force its final house to be selected.

[Back to question](19-dynamic-programming.md#q196)

### A19.7

No valid result contains both endpoints, so it excludes last or first, possibly both. Solve[0, n-2] and[1, n- 1] without forcing the eligible endpoint. Empty 0, single[5]=5,[2,3,2]=3,[1,2,3,1]=4.

[Back to question](19-dynamic-programming.md#q197)

### A19.8

Rewards 2-&gt;4,3-&gt;9,4-&gt;4; dense points[0,0,4,9,4], optimum 9 by all 3s. Total O(n+M+1) time, O(M+1) storage, not merely two scalar space because the points array remains.

[Back to question](19-dynamic-programming.md#q198)

### A19.9

dp[i, c] is best value among first i items under capacity c. No items 0; zero capacity 0 for positive weights. Skip dp[i-1, c]; if w[i-1]&lt;=c, take v[i-1]+dp[i-1, c-w[i-1]], then max.

[Back to question](19-dynamic-programming.md#q199)

### A19.10

Maximum 9 takes weights 2 and 3, values 4+5. Same item prefix differs by capacity; capacity alone in unrestricted recursion omits which items remain. In compressed DP, the outer loop still carries that stage.

[Back to question](19-dynamic-programming.md#q1910)

### A19.11

With w 2, v 4, C4, forward sets dp[2]=4 then dp[4]=4+dp[2]=8. That is wrong for 0/1 but right for unlimited reuse. Descending capacity preserves the previous item stage.

[Back to question](19-dynamic-programming.md#q1911)

### A19.12

dp[i, s] means achievable using first i elements; dp[i,0]=true, dp[0, s&gt;0]=false. Row i uses nums[i-1], not nums[i]. Taking needs nums[i-1]&lt;=s, including equality; combine skip/take with OR.

[Back to question](19-dynamic-programming.md#q1912)

### A19.13

{0,3};{0,3,4,7};{0,3,4,5,7,8,9};{0,2,3,4,5,6,7,8,9}. Witnesses{4,5} and{3,4,2}.

[Back to question](19-dynamic-programming.md#q1913)

### A19.14

Total 22 must be even; target 11 is achievable by[11], complement[1,5,5]. O(n*T), O(T) numeric bounds depend on total magnitude, not only the bits encoding it. Odd total cannot split into equal integer sums.

[Back to question](19-dynamic-programming.md#q1914)

### A19.15

min(-1, valid) chooses impossibility incorrectly. Any positive-integer-coin solution for A has at most A coins, so A+1 exceeds every valid count even without coin 1. Return-1 only after detecting the internal unreachable state.

[Back to question](19-dynamic-programming.md#q1915)

### A19.16

dp[0..6]=[0,1,2,1,1,2,2]. Optimum 3+3 uses 2 coins; largest-first 4+1+1 uses 3, showing that this denomination system does not justify that greedy rule.

[Back to question](19-dynamic-programming.md#q1916)

### A19.17

Count(i, r) counts combinations using denominations i onward. r 0 returns 1 before checking exhausted types; no types with r&gt;0 returns 0. Take retains i and subtracts coin; skip advances i. Sum them, with take only when it fits.

[Back to question](19-dynamic-programming.md#q1917)

### A19.18

Initial[1,0,0,0,0,0]; coin 1-&gt;[1,1,1,1,1,1]; coin 2-&gt;[1,1,2,2,3,3]; coin 5-&gt;[1,1,2,2,3,4]. Combinations 11111,1112,122,5.

[Back to question](19-dynamic-programming.md#q1918)

### A19.19

Choosing every possible final coin without an availability stage distinguishes 12 and 21. Combination recursion needs(i, r), or a tabulated outer coin stage. O(KA) simplifies to O(A) only for fixed K, not arbitrary input denominations.

[Back to question](19-dynamic-programming.md#q1919)

### A19.20

Coin outer/amount ascending counts 111 and 12, answer 2. Amount outer/all possible last coins counts 111,12,21, answer 3. Both allow reuse; only the counting semantics change.

[Back to question](19-dynamic-programming.md#q1920)

### A19.21

Suffix Lcs(i, j) compares a[i..], b[j..], return 0 when either index reaches its length. Match adds 1 and advances both; mismatch takes max of skipping either current character. Prefix table uses lengths i, j, indices i-1, j-1, zero base row/column.

[Back to question](19-dynamic-programming.md#q1921)

### A19.22

Length 2 has'ac' and'bc'. The table's optimum value is unique while valid output witnesses can differ. The supplied one-witness backtrace returns one according to its tie policy, not all LCS strings.

[Back to question](19-dynamic-programming.md#q1922)

### A19.23

Before overwrite, dp[j] is old-above; dp[j-1] is current-left; save previous old-above as next diagonal. Length uses O(min(m, n)+1) space. Full table simplifies witness reconstruction; the compressed result does not by itself retain all choices.

[Back to question](19-dynamic-programming.md#q1923)

### A19.24

dp[i] is best length ending exactly at i, base 1. For all j&lt;i with nums[j]&lt;nums[i], maximize 1+dp[j]. Later weaker candidates must not overwrite stronger ones. Overall LIS can end earlier, e.g[1,2,3,0] gives[1,2,3,1].

[Back to question](19-dynamic-programming.md#q1924)

### A19.25

DP[1,1,1,2,2,3,4,4], length 4. Examples[2,5,7,101] and[2,3,7,18]. Values 10 and 9 are also valid predecessors of 18, but not the best.

[Back to question](19-dynamic-programming.md#q1925)

### A19.26

tails[k] is the minimum ending value of some increasing length-k+1 subsequence in the processed prefix. Strict LIS replaces first&gt;=x so equals cannot extend length. Replacing first&gt;x instead permits a nondecreasing sequence.

[Back to question](19-dynamic-programming.md#q1926)

### A19.27

Frontiers[0],[0,1],[0,1],[0,1,3],[0,1,2],[0,1,2,3]. Second 0 replaces index 0. Valid witness[0,1,2,3] at indices 0,1,4,5; repeated 0 is not strict.

[Back to question](19-dynamic-programming.md#q1927)

### A19.28

At position p, an achievable predecessor tail&lt;x gives a real length-p+1 sequence ending x. A smaller/equal ending loses no future extension. Different positions are independent representatives:for[3,5,6,2,4], final[2,4,6] is not an input subsequence although length 3 is valid.

[Back to question](19-dynamic-programming.md#q1928)

### A19.29

Transform a[i..] into b[j..]. Exhausted a costs n-j insertions; exhausted b costs m-i deletions. Insert advances j only; delete i only; replace both. Match advances both for 0 cost; mismatch takes 1+minimum.

[Back to question](19-dynamic-programming.md#q1929)

### A19.30

Horse-&gt;rorse by replacing h, then rose by deleting the second r, then ros by deleting e, cost 3. Cat/cut rows including empty are[0,1,2,3],[1,0,1,2],[2,1,1,2],[3,2,2,1], answer 1 by replacing a with u.

[Back to question](19-dynamic-programming.md#q1930)

### A19.31

Suffix counts down+right with destination 1 and out-of-bounds 0. Prefix counts above+left, seed start 1. A blocked cell receives 0. In one row, reset dp[c]=0 at an obstacle rather than leaving paths from above.

[Back to question](19-dynamic-programming.md#q1931)

### A19.32

No obstacle[1,1,1]/[1,2,3]/[1,3,6], answer 6. Center blocked[1,1,1]/[1,0,1]/[1,1,2], answer 2 with RRDD and DDRR. Blocked start/destination gives 0.

[Back to question](19-dynamic-programming.md#q1932)

### A19.33

For[1,3,1]/[1,5,1]/[4,2,1], costs[1,4,5]/[2,7,6]/[6,8,7], answer 7. Start includes its own cost; boundary cells have one predecessor, not an imaginary zero-cost route.

[Back to question](19-dynamic-programming.md#q1933)

### A19.34

Last[4,1,8,3], then[7,6,10], then[9,10], then[11]. Path 2,3,5,1 costs 11. Reading dp[c], dp[c+1] left-toright uses two still-old lower-row values; right-to-left would overwrite the right child first.

[Back to question](19-dynamic-programming.md#q1934)

### A19.35

Cost(l, k)+Cost(k+1, r)+d[l-1]*d[k]*d[r]; one matrix 0. (AB)C costs 150+180=330; A(BC) costs 360+600=960. Same 5-by-12 result, different arithmetic cost. Try all splits.

[Back to question](19-dynamic-programming.md#q1935)

### A19.36

Each interval state still tests up to n split/last choices. O(n^2) states times O(n) work gives O(n^3), with O(n^2) cache. Memoisation prevents duplicate state computation, not the legal choices inside a state.

[Back to question](19-dynamic-programming.md#q1936)

### A19.37

Pieces[2,1,2,1,0], cuts 1, witness'a'|'aba'. At start 0, test'a' giving 2 pieces and'aa' giving 3; the latter cannot be omitted from a complete recurrence merely because it loses.

[Back to question](19-dynamic-programming.md#q1937)

### A19.38

n starts times n ends times O(n) palindrome checking yields O(n^3). Precompute all pal[l, r] in O(n^2), then O(1) checks make partition O(n^2) total; storage O(n^2). Fill left backward so the inner interval is ready.

[Back to question](19-dynamic-programming.md#q1938)

### A19.39

The last choice fixes external surviving boundaries and separates children. Last 3 gives 33, last 1 gives 9, last 5 gives 35. Optimum burst order 1,3,5 earns 15+15+5=35. First-removal boundaries would change and couple the sides.

[Back to question](19-dynamic-programming.md#q1939)

### A19.40

Checked arithmetic exposes overflow rather than wrapping. Unknown memo entries,
unreachable minima, and legitimate zero answers need distinct meanings. A
rolling optimum may discard history needed for a witness; all-answer
enumeration adds its own output cost.

[Back to question](19-dynamic-programming.md#q1940)

### A19.41

SUPPLEMENTAL MODEL ANSWER:0/1 Knapsack, state(item stage, remaining or allowed budget), maximum take/skip. Standard O(n*C) time, O(n*C) full table or O(C) descending compressed storage. Positive integer costs and nonnegative budget are the stated dense-DP contract; numeric dependence is pseudopolynomial.

[Back to question](19-dynamic-programming.md#q1941)

### A19.42

SUPPLEMENTAL MODEL ANSWER:even-total test plus 0/1 Subset Sum to T/2. State(item stage, sum), Boolean OR over take/skip. O(n*T) time, O(T) compressed storage, or O(n*T) full table; nonnegative integers assumed.

[Back to question](19-dynamic-programming.md#q1942)

### A19.43

SUPPLEMENTAL MODEL ANSWER:unbounded combination counting, state(coin stage, amount), sum of reuse/skip branches. O(K*A) time, O(K*A) memo or O(A) bottom-up storage. Coin loop outside, amount ascending; dp[0]=1.

[Back to question](19-dynamic-programming.md#q1943)

### A19.44

SUPPLEMENTAL MODEL ANSWER:two-sequence DP, state(i, j) prefix or suffix, minimum over insertion/deletion/replacement with free match. O(m*n) standard time/table, O(min(m, n)+1) length-only compressed storage; memo recursion adds O(m+n) stack.

[Back to question](19-dynamic-programming.md#q1944)

### A19.45

SUPPLEMENTAL MODEL ANSWER:grid DP, state(row, column), current cost plus minimum of above/left for right/down movement. O(R*C) time, O(R*C) table or O(C) for the shown one-row method. Arbitrary movement/revisits would require a different model.

[Back to question](19-dynamic-programming.md#q1945)

### A19.46

SUPPLEMENTAL MODEL ANSWER:Burst Balloons interval DP, state(left, right) with fixed exterior boundaries, maximum over the final balloon. O(n^3) time, O(n^2) memo/table plus O(n) recursive depth when memoised.

[Back to question](19-dynamic-programming.md#q1946)

### A19.47

SUPPLEMENTAL MODEL ANSWER:LCS, state(two prefix lengths or suffix indices), match diagonal+1 or maximum of skipping either mismatch. O(m*n) time, O(m*n) full table or O(min(m, n)+1) length-only storage; memo recursion adds O(m+n) stack.

[Back to question](19-dynamic-programming.md#q1947)

### A19.48

SUPPLEMENTAL MODEL ANSWER:House Robber, prefix index state, maximum of skip previous prefix or take plus the prefix two houses back. O(n) time, O(1) value-only slots or O(n) retained table for simple selected-index reconstruction.

[Back to question](19-dynamic-programming.md#q1948)

### E19.1

All return 8. Plain repeats calls; memo caches i; table fills increasing i; rolling keeps only previous two. Full earlier-state history is lost, not the final count. At n 0, the empty move sequence still counts 1.

[Back to question](19-dynamic-programming.md#e191)

### E19.2

Climbing reach bases 0,0 give reach 2=10, reach 3=15, answer 15. Circular[2,3,2] gives 3;[1,2,3,1] gives 4. The two cases exclude one endpoint rather than requiring the other.

[Back to question](19-dynamic-programming.md#e192)

### E19.3

0/1 gives 4, unlimited 8. The direction of the compressed capacity loop determines whether current writes can be read again. Source weights[2,3,4], values[4,5,7], capacity 5 gives 9.

[Back to question](19-dynamic-programming.md#e193)

### E19.4

Subsets{4,5} and{3,4,2}. Equal partition has target 11 with[11] and[1,5,5]. Each input position is used at most once; descending sums preserve that constraint.

[Back to question](19-dynamic-programming.md#e194)

### E19.5

Minimum 2 coins via 1+2; unordered combinations 2 (111,12); ordered sequences 3 (111,12,21). These are different objectives/operators/state-order meanings, not interchangeable variants of one output.

[Back to question](19-dynamic-programming.md#e195)

### E19.6

Different denomination availability gives different answers for the same remaining amount. Keep index in memoisation, or encode that stage through an outer denomination loop with amounts forward. This compresses storage to O(A), not general time below O(K*A).

[Back to question](19-dynamic-programming.md#e196)

### E19.7

Witnesses'ac','bc', length 2. Recursive calls advance indices without shortening the original strings, so stop when i==a.Length or j==b.Length, not only when an original string initially has length 0.

[Back to question](19-dynamic-programming.md#e197)

### E19.8

Valid[0,1,2,3] at indices 0,1,4,5. For input[3,5,6,2,4], minimum-tail representatives end[2,4,6], but 6 predates 2/4. Length 3 is correct, witness[3,5,6]; the final frontier is not necessarily a route.

[Back to question](19-dynamic-programming.md#e198)

### E19.9

Edit answer 1 minimizes operation choices. Center-obstacle 3-by-3 grid has 2 paths by summing legal predecessor counts. Source cost grid has minimum 7 by adding cell cost to the smaller predecessor. Zero/infinity bases differ by objective.

[Back to question](19-dynamic-programming.md#e199)

### E19.10

Triangle reductions[4,1,8,3]-&gt;[7,6,10]-&gt;[9,10]-&gt;[11], O(R^2) cells and constant choices. Matrix dimensions[5,10,3,12] yield 330 versus 960; O(n^2) intervals each test O(n) splits, giving cubic time.

[Back to question](19-dynamic-programming.md#e1910)

### E19.11

a|aba needs 1 cut; aa|b|a needs 2. Last-balloon candidates are 33,9,35, so last 5 wins. Actual burst order 1,3,5 yields 35. Both partition problems must test every legal candidate even when one loses.

[Back to question](19-dynamic-programming.md#e1911)

### E19.12

Expected patterns:0/1 Knapsack, Subset Sum reduction, Coin Change II, Edit Distance, minimum grid DP, Burst Balloons, LCS, House Robber. No learner answer follows that final checkpoint; these model answers support revision rather than record a pass.

[Back to question](19-dynamic-programming.md#e1912)
