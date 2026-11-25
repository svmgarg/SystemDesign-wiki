# Coding and DSA

Choose a topic, open its detail pages, and work through the examples and
questions. Algorithms use **language-neutral pseudocode**, not C#.
This learning path stays separate from system design, backend, and AI.

## Topics

| Topic | What it covers |
| --- | --- |
| [Problem Solving and Complexity](topics/problem-solving.md) | Contracts, examples, invariants, time, and memory. |
| [Arrays and Range Patterns](topics/arrays.md) | Array basics, Kadane, prefix sums, range updates, two pointers, and windows. |
| [Strings and Hashing](topics/strings.md) | Text units, frequency maps, palindromes, and hash-table mechanics. |
| [Linked Lists](topics/linked-lists.md) | Reversal, cycles, merging, intersection, reorder, and LRU. |
| [Stacks](topics/stacks.md) | Parsing, minimum tracking, monotonic stacks, and histograms. |
| [Queues and Deques](topics/queues.md) | Two-stack queues, BFS scheduling, and sliding-window maximum. |
| [Binary Search](topics/binary-search.md) | Exact search, bounds, rotations, predicates, and answer search. |
| [Trees and BSTs](topics/trees.md) | Traversals, recursive contracts, paths, construction, and ordered-tree operations. |
| [Heaps and Priority Queues](topics/heaps.md) | Heap mechanics, Top-K, sorted-source merging, and streaming median. |
| [Recursion and Backtracking](topics/backtracking.md) | Subsets, permutations, combinations, pruning, and N-Queens. |
| [Sorting and Selection](topics/sorting.md) | Comparison sorts, counting/radix sorts, custom ordering, and Quickselect. |
| [Graphs](topics/graphs.md) | Traversals, cycles, grids, shortest paths, Union-Find, and MSTs. |
| [Dynamic Programming](topics/dynamic-programming.md) | State design, knapsack, coins, sequences, grids, and interval problems. |

## How to study

Read a chapter's explanation, state its invariant, and dry-run its worked
example before writing code. Then attempt its checkpoint and additional
practice. The **320 self-test items** link to a
[separate answer key](answers.md), whose answers link back to each question.
Use the [revision guide](revision.md) for pattern selection, complexity tables,
misconceptions, and the original reference links.

Each topic page maps its sections to the full explanations, diagrams,
pseudocode, complexity notes, and exercises. The 19 original detail-page URLs
and question IDs remain available.

## Pseudocode conventions

- Indentation defines scope. `<-` assigns a value; `=` compares values.
- Arrays are zero-indexed. `FOR i FROM a TO b` includes both endpoints and
  performs no iterations if `a > b`. `DOWN TO` counts downward.
- `DIV` is integer division; `/` is ordinary division. `MOD` gives a remainder.
  `slice(sequence, start, end)` excludes `end`.
- `REQUIRE` states a precondition; invalid input is rejected. Boolean `AND` and
  `OR` short-circuit from left to right, so bounds checks protect later accesses.
- `array(n, initial = value)` initializes every slot. Containers support the
  named operations; maps distinguish missing keys from stored zero values.
- `copy(path)` creates a separate container. Nodes are compared by identity
  when stated. Nested helpers can update variables in their enclosing call.
- `INFINITY` and `NEGATIVE_INFINITY` are symbolic unreachable/best-so-far
  markers, not permission to overflow a machine integer. `CHECKED_ADD` and
  checked products reject unrepresentable finite results. Choose sufficient
  numeric width or arbitrary precision when implementing.
- `UNKNOWN` means a memoized state has not been evaluated. It is distinct from
  a valid zero answer and from an unreachable state.

Examples are algorithm descriptions, not a compilable application. Respect
mutation contracts and separate auxiliary memory from output storage.
`Add`, `Remove`, and `IsValid` in general window templates must be defined for
the chosen problem.

## Original chapter reference

The numbers below are the PDF's **handbook chapter numbers**, not its original
chat-track numbers.

| Chapter | Topic | PDF pages |
| --- | --- | --- |
| 1 | [Problem Solving and Complexity Analysis](01-problem-solving.md) | 17-20 |
| 2 | [Arrays, Memory Model, Kadane, and In-Place Manipulation](02-arrays.md) | 21-24 |
| 3 | [Prefix Sums, Hashing, and Difference Arrays](03-prefix-sums.md) | 25-28 |
| 4 | [Two Pointers and Sliding Windows](04-two-pointers.md) | 29-32 |
| 5 | [Strings, Hashing, Palindromes, and Hash Tables](05-strings.md) | 33-36 |
| 6 | [Linked List Basics, Reversal, and Cycles](06-linked-list-foundations.md) | 37-40 |
| 7 | [Linked List Patterns and LRU Cache](07-linked-list-patterns.md) | 41-45 |
| 8 | [Stacks, Parsing, and Monotonic Stacks](08-stacks.md) | 46-49 |
| 9 | [Queues, Deques, and Sliding-Window Maximum](09-queues.md) | 50-53 |
| 10 | [Binary Search](10-binary-search.md) | 54-57 |
| 11 | [Binary Tree Contracts and Traversals](11-tree-traversals.md) | 58-61 |
| 12 | [Tree Structure, LCA, and Paths](12-tree-paths.md) | 62-66 |
| 13 | [Tree Construction, Serialization, and Counting](13-tree-construction.md) | 67-70 |
| 14 | [Binary Search Trees](14-binary-search-trees.md) | 71-74 |
| 15 | [Heaps and Priority Queues](15-heaps.md) | 75-81 |
| 16 | [Recursion and Backtracking](16-backtracking.md) | 82-91 |
| 17 | [Sorting Algorithms and Selection](17-sorting.md) | 92-104 |
| 18 | [Graphs](18-graphs.md) | 105-129 |
| 19 | [Dynamic Programming](19-dynamic-programming.md) | 130-153 |

## Source progress is not your progress

The completed marks in the PDF describe its author's study history. They do
**not** mark any topic complete for you. This import does not populate browser
history, bookmarks, or reading progress from those marks.

The PDF reports twelve completed tracks through Graphs (handbook chapters 1-18).
Dynamic Programming lessons are present, but its final eight-question recognition
checkpoint, **Q19.41-Q19.48**, was unanswered in the recorded source. Its model
answers are revision material, not evidence of a passed assessment.

After that checkpoint, the source's remaining roadmap is **Greedy Algorithms,
Tries, Bit Manipulation, Maths & Geometry, and mixed unhinted interview
practice**. Those are roadmap-only topics here; no missing lessons or completion
claims have been invented.

## Provenance and numbering

Coverage is based on the supplied **One-Month Software Interview Plan -
Illustrated Study Notes**, C#/.NET study edition dated **28 October 2026**
(`One-Month-Software-Interview-Plan-Study-Notes.pdf`). The wiki reorganizes its
coding material into topic sections and rewrites its code as pseudocode.
Pages 17-153 supply the 19 detailed chapters, pages 154-158 the revision aids,
and pages 159-178 the answer key. Backend/AI planning material is not included.

Only the supplied PDF was reviewed for this import. Its references to chat
transcripts, an earlier handbook, and a DOCX describe the PDF author's sources;
those files were not supplied or independently reviewed. Reference-check dates
inside the imported notes are likewise historical source statements.

The PDF's original chat tracks map to handbook chapters as follows:

| Chat track | Handbook chapters |
| --- | --- |
| 1: Complexity | 1 |
| 2: Arrays | 2-4 |
| 3: Strings and hashing | 5 |
| 4: Linked lists | 6-7 |
| 5: Stacks and queues | 8-9 |
| 6: Binary search | 10 |
| 7: Trees | 11-13 |
| 8: BST | 14 |
| 9: Heaps | 15 |
| 10: Recursion and backtracking | 16 |
| 11: Sorting | 17 |
| 12: Graphs | 18 |
| 13: Dynamic Programming | 19 |

In particular, handbook Chapter 12 is about tree paths; chat track 12 is Graphs.
Question IDs retain the handbook numbering: `Qchapter.number` for checkpoints,
`Achapter.number` for checkpoint answers, and `Echapter.number` for exercises
and their answers.
