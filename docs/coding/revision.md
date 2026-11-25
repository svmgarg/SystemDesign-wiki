# Coding revision and references

[All coding chapters](index.md) | [Answer key](answers.md)

> The following revision aids and source-history statements come from PDF pages 154-158. Dates, transcript coverage, and completion statements are the PDF author's records, not independently verified claims by this wiki.

## Pattern map
|**Problem clue**|**Core state**|**Invariant to say aloud**|
|---|---|---|
|**Range sum query**|Prefix array|prefix[i] summarizes first i elements|
|**Count target-sum subarrays**|Prefix frequency map|Map contains counts of earlier prefixes|
|**Many range additions**|Difference boundaries|Prefix of diff equals net active update|
|**Longest valid substring**|Window counts + two indices|Window is valid after shrinking|
|**Maximum subarray**|Ending sum + global best|Ending sum is best subarray ending<br>here|
|**Linked-list reversal**|prev/current/next|prev is reversed processed prefix|
|**Cycle**|Slow/fast references|Meeting implies cyclic relative motion|
|**Next greater**|Monotonic stack of indices|Stack contains unresolved candidates|
|**Window maximum**|Monotonic deque|Front is maximum; all indices are live|
|**Exact/boundary search**|Search interval|All possible answers remain inside|
|**Tree combination**|Recursive return contract|Return is exactly what parent can<br>consume|
|**LRU cache**|Map + doubly linked list|Map/list contain the same real entries|

## Complexity sheet
|**Algorithm**|**Time**|**Auxiliary space**|
|---|---|---|
|**Prefix construction**|O(n)|O(n)|
|**Prefix range query**|O(1)|-|
|**Prefix-hash subarray count**|expected O(n)|O(n)|
|**Difference updates + reconstruction**|O(m + n)|O(n)|
|**Fixed/variable window**|O(n)|O(1) to O(active-window state); up to<br>O(n)|
|**Kadane**|O(n)|O(1)|
|**Longest palindrome by centers**|O(n^2)|O(1)|
|**Linked-list operations in these**<br>**chapters**|O(n)|usually O(1)|
|**LRU get/put**|expected O(1)|O(capacity)|
|**Monotonic stack/deque**|O(n)|O(n) / O(k)|
|**BFS/DFS graph**|O(V + E)|O(V)|
|**Binary search**|O(log n)|O(1)|
|**Tree traversal**|O(n)|O(h) DFS or O(w) BFS|
|**Complete-tree count**|O(log^2 n)|O(log n)|
|**BST operations**|O(h)|iterative O(1), recursive O(h)|

## Interview dry-run checklist
- Empty/single-element input.

- Duplicates and all-equal input.

- Negative values and overflow.

- First/last index boundaries.

- All-negative Kadane/tree path input.

- Even/odd lengths.

- Missing target or invalid k.

- Skewed tree/linked list.

- Shared node identity versus equal value.

- Mutation/restoration expectations.

|**Heap algorithm**|**Time**|**Working space / retained data**|
|---|---|---|
|**Peek extreme**|O(1)|Heap storage O(n)|
|**Insert / remove extreme**|O(log n) ordering work|Occasional backing-array growth costs<br>O(n)|
|**Bottom-up heapify**|O(n)|O(1) auxiliary for in-place iterative<br>heapify|
|**Top-K stream**|O(n log(k+1))|O(k) retained candidates|
|**K-way merge**|O(k + N log(k+1))|O(k) heap, plus O(N) output|
|**Streaming median**|O(log n) insert; O(1) query|O(n) retained values|

|**New chapter pattern**|**Time / work to account for**|**Auxiliary space, excluding output**|
|---|---|---|
|**Subsets**|O(n*2^n) including copying|O(n)|
|**Distinct permutations**|O(n*n!) including copying|O(n)|
|**Pruned combinations**|O((k+1)*C(n,k))|O(k+1)|
|**Combination Sum**|Candidate/target-dependent search<br>plus total copied output|O(T/minCandidate + sorting stack)|
|**N-Queens, shown board**<br>**implementation**|Conservative O(n*n! + Q*n^2)|O(n^2); Q boards are separate output|
|**Stable Merge Sort**|O(n log n)|O(n)|
|**Quick Sort, last-pivot Lomuto**|O(n log n) under suitable average<br>assumptions; O(n^2) worst|O(log n) balanced stack; O(n) worst|
|**Iterative Heap Sort**|O(n log n) worst; build alone O(n)|O(1)|
|**Counting Sort**|O(n+R)|O(R) basic; O(n+R) stable|
|**LSD Radix Sort**|O(d*(n+b))|O(n+b)|
|**Iterative Quickselect**|O(n) under suitable average<br>assumptions; O(n^2) worst|O(1)|

Detailed references: graph selection and complexity in Chapter 18.24; DP patterns, update direction, and storage in Chapters 19.21-19.22. The final source checkpoint is Q19.41-Q19.48, with supplemental model answers in the answer key.

## Revision tools and misconception register
## Corrections worth revisiting from the teaching
|**Earlier trap**|**Correct mental model**|**Where to revise**|
|---|---|---|
|**Index -&gt; value for complement**<br>**lookup**|Two Sum needs value -&gt; earlier index|Chapter 1|
|**A Task automatically means another**<br>**thread**|Async I/O waiting and CPU parallel<br>execution are different|Chapter 1|
|**Logarithmic outer loop always**<br>**multiplies inner n**|Sum the actual shrinking work|Chapter 1|
|**All recursive calls stay in memory**|Sequential recursion stack follows<br>maximum active depth|Chapters 1,11|
|**Amortised means probability of an**<br>**expensive event**|Bound a sequence's total work without<br>a probability distribution|Chapters 1,8,9|
|**Column-wise traversal is always**<br>**cache-friendlier**|For row-major rectangular arrays,<br>adjacent columns in a row are<br>contiguous|Chapter 2|
|**One set entry per prefix is enough for**<br>**counting**|Repeated prior prefixes create distinct<br>subarrays|Chapter 3|
|**All window templates score after**<br>**shrinking**|Longest-valid and minimum-valid<br>score at different times|Chapter 4|
|**Linked nodes with equal values**<br>**intersect**|Intersection is shared reference<br>identity|Chapters 6,7|
|**LRU map can store only values**|O(1) promotion/removal needs the<br>actual list node|Chapter 7|
|**Nested monotonic-stack loop is**<br>**quadratic**|Each index enters/leaves once|Chapter 8|
|**Push left first to visit left first**|LIFO requires pushing right before left|Chapter 11|
|**Tree traversal time equals stack**<br>**space**|O(n) visits can use O(h) frames|Chapter 11|
|**Balance is checked only at root**|Every subtree must be balanced|Chapter 12|
|**LCA must be strictly above both**<br>**targets**|A target itself can be the LCA|Chapter 12|
|**Parent can accept a two-branch**<br>**maximum path**|Return one-sided gain; track a two-<br>sided global best|Chapter 12|
|**Equal extreme heights prove any tree**<br>**perfect**|Requires the complete-tree guarantee|Chapter 13|
|**BST is always logarithmic**|Height determines cost; a plain BST<br>can be a chain|Chapter 14|
|**A displayed heap array must be**<br>**sorted**|Only parent-child heap order is<br>required|Chapter 15|
|**Biggest priority number is always**<br>**served first**|The priority contract defines the<br>comparison direction|Chapter 15|

## One-page pattern selection extension
|**Requirement**|**Candidate**|**Check before choosing**|
|---|---|---|
|**Best k values from a stream**|Size-k heap|Which accepted value should be<br>easiest to evict?|
|**Merge already sorted sources**|Heap of source frontiers|Is every source individually sorted?|
|**Exact running median**|Two opposite heaps|Are both ordering and size invariants<br>maintained?|
|**Arbitrary key lookup**|Hash table / balanced BST|Do you need expected equality lookup<br>or ordered/range operations?|
|**Fixed-window maximum**|Monotonic deque|Can arrival/expiration order discard<br>dominated candidates?|
|**Sortedness of every element**|Sorting|Do you actually need the entire global<br>order?|

## Suggested revision routine - New study aid, not the original calendar
For each chapter: explain the invariant without looking, dry-run one worked example, solve its checkpoint, then implement one exercise from memory. Revisit incorrect answers after one day, three days, and a week; these intervals are a practical suggestion, not a claim of a guaranteed learning outcome.

Use an error log with four columns: question, wrong assumption, corrected invariant, retest result. Judge readiness by explanation and successful unseen variations, not by counting questions attempted.

Finish the Dynamic Programming recognition checkpoint in handbook Chapter19, then begin Greedy Algorithms. DP lessons and requested worked solutions are documented, while final consolidation remains pending in the supplied transcript. The broader backend, HLD/LLD, and AI curriculum remains planning context.

## Glossary
Invariant: a property preserved by every algorithm step. Frontier: the currently exposed next candidates. Amortised: total cost spread over a sequence. Expected: a cost under stated distribution/hash assumptions. Auxiliary space: working memory beyond the input/output. Monotonic: changes in only one direction, or a true/false predicate with a single transition. Sentinel: artificial boundary entry that simplifies edge cases. Identity: the same object, not merely equal contents. Complete tree: final level filled left-to-right. Perfect tree: all levels full. Stable tie: equal-priority items retain defined relative order.

## Source references and implementation notes
The chat and its linked October 21 handbook are the sources for lesson coverage and the original learning plan. The following primary references were checked on October 23, 2026 for narrowly scoped implementation clarifications:

[R1] Microsoft Learn, PriorityQueue&lt;TElement,TPriority&gt;: min-priority ordering, quaternary implementation, and no guaranteed FIFO ordering for equal priorities.

[R2] Princeton Algorithms, section 2.4 Priority Queues: binary heap operations and linear bottom-up construction.

[R3] Microsoft Learn, Asynchronous programming scenarios: async I/O, await, and concurrency distinctions.

Wiki examples use [language-neutral pseudocode](index.md#pseudocode-conventions).
The supplied PDF originally used C#/.NET, so some primary references below
describe that runtime rather than prescribe the language for this learning path.
Inputs are assumed non-null and structurally valid unless stated otherwise.

Window templates require problem-specific Add/Remove/IsValid operations.
The bracket parser accepts bracket-only input; graphs assume valid vertex
indices; construction assumes distinct consistent traversals; linked lists
are acyclic except in cycle-detection problems. Concurrent production usage
requires additional contracts and synchronization.

## Primary references for the new sorting clarifications
Checked October 24, 2026: [R4] Microsoft Learn, Array.Sort, for comparer overloads and unstable introspective sorting; [R5] MIT 6.006 linear-sorting notes and counting-sort recitation, for stable cumulative placement and digit passes; [R6] Princeton COS 226 quicksort/quickselect lecture, for expected-linear selection analysis. The supplied chat remains the primary source of covered lessons and corrected checkpoints.

Graph clarification references checked October 26, 2026: [R7] Princeton Algorithms directed graphs for cycle-aware topological order; [R8] Princeton shortest-paths lecture for Dijkstra/Bellman-Ford; [R9] Archive of Formal Proofs Floyd-Warshall exposition for intermediate-vertex DP and negative cycles; [R10] Princeton minimum-spanning-tree lecture for cut-property reasoning. The retained pasted transcript supplies the covered topics and corrected worked checkpoints.

DP clarification references checked October 28, 2026: [R11] MIT 6.006 Lecture 21 for useful sequence subproblems, parenthesization, edit distance, and knapsack; [R12] MIT 6.006 Recitation 19 for numericcapacity versus bit-length complexity. The pasted Chapter 13 continuation remains the source of lesson coverage and corrected traces.

- [R1: Microsoft PriorityQueue documentation](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.priorityqueue-2?view=net-8.0)
- [R2: Princeton priority queues](https://algs4.cs.princeton.edu/24pq/)
- [R3: Microsoft async scenarios](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios)
- [R4: Microsoft Array.Sort](https://learn.microsoft.com/en-us/dotnet/api/system.array.sort?view=net-8.0)
- [R5: MIT stable Counting Sort recitation](https://courses.csail.mit.edu/6.006/fall11/rec/rec07.pdf)
- [R5: MIT linear-sorting lecture](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/78a3c3444de1ff837f81e52991c24a86_MIT6_006S20_lec5.pdf)
- [R6: Princeton quicksort and quickselect](https://www.cs.princeton.edu/courses/archive/spring22/cos226/lectures/23Quicksort.pdf)
- [R7: Princeton directed graphs](https://algs4.cs.princeton.edu/42digraph/)
- [R8: Princeton shortest paths](https://www.cs.princeton.edu/courses/archive/spring24/cos226/lectures/44ShortestPaths.pdf)
- [R9: Floyd-Warshall formal exposition](https://www.isa-afp.org/browser_info/current/AFP/Floyd_Warshall/document.pdf)
- [R10: Princeton minimum spanning trees](https://www.cs.princeton.edu/courses/archive/spring13/cos226/lectures/43MinimumSpanningTrees-JH-2x2.pdf)
- [R11: MIT dynamic programming](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-21-dp-iii-parenthesization-edit-distance-knapsack/)
- [R12: MIT pseudo-polynomial complexity](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/7232b0ff982f501556118a8552654762_MIT6_006S20_r19.pdf)
