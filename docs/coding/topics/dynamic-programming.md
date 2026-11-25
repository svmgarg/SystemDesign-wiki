# Dynamic Programming

[All coding topics](../index.md)

Dynamic programming reuses answers to precisely defined subproblems. Write the
state meaning, objective, bases, transition, and dependency order before
choosing memoization, tabulation, or compressed storage.

## State and evaluation order

Start with the [DP mental model](../19-dynamic-programming.md#191-the-dp-mental-model---cache-a-precisely-defined-state)
and [four versions of Climbing Stairs](../19-dynamic-programming.md#192-climbing-stairs---one-recurrence-four-evaluation-strategies).
Compare total calls with the active stack, then see how memoization avoids
repeated states and tabulation follows dependencies directly.

## Detailed patterns

| Pattern | Detailed lessons |
| --- | --- |
| One-dimensional choices | [Minimum climbing cost](../19-dynamic-programming.md#193-minimum-cost-climbing---state-meaning-changes-answer-extraction), [House Robber](../19-dynamic-programming.md#194-house-robber---prefix-optimum-versus-compulsory-endpoint), [circular houses](../19-dynamic-programming.md#195-circular-house-robber---two-exhaustive-exclusions), and [Delete and Earn](../19-dynamic-programming.md#196-delete-and-earn---aggregate-by-conflicting-value-not-input-position). |
| Capacity and reachability | [0/1 versus unlimited knapsack](../19-dynamic-programming.md#197-01-knapsack-and-unbounded-reuse---item-stage-plus-capacity), [Subset Sum](../19-dynamic-programming.md#198-subset-sum---replace-maximum-reward-by-boolean-reachability), and [equal partition](../19-dynamic-programming.md#199-partition-equal-subset-sum---a-reduction-not-a-new-recurrence). |
| Coin problems | [Minimum coins](../19-dynamic-programming.md#1910-minimum-coin-change---infinity-belongs-inside-minimisation) versus [unordered combinations and ordered sequences](../19-dynamic-programming.md#1911-coin-change-ii---availability-is-a-hidden-dimension). |
| Sequence alignment | [LCS and one witness](../19-dynamic-programming.md#1912-lcs---two-sequence-positions-not-contiguous-matching) and [Edit Distance](../19-dynamic-programming.md#1915-edit-distance---align-two-suffixes-with-three-choices). |
| Increasing subsequences | [Quadratic LIS](../19-dynamic-programming.md#1913-lis-quadratic-dp---best-subsequence-ending-exactly-here) and [binary-search tails](../19-dynamic-programming.md#1914-lis-tails---a-frontier-of-best-endings-with-a-proof); tails is not necessarily a witness. |
| Grids | [Count paths with obstacles](../19-dynamic-programming.md#1916-grid-paths-and-obstacles---sum-predecessor-counts) and [minimum grid/triangle cost](../19-dynamic-programming.md#1917-minimum-grid-and-triangle-paths---min-instead-of-sum). |
| Intervals and partitions | [Matrix chain](../19-dynamic-programming.md#1918-matrix-chain-multiplication---try-every-final-split), [palindrome cuts](../19-dynamic-programming.md#1919-palindrome-partitioning---minimum-pieces-versus-cuts), and [Burst Balloons](../19-dynamic-programming.md#1920-burst-balloons---choose-the-last-operation-to-fix-boundaries). |

## Revision and practice

Use the [pattern-recognition map](../19-dynamic-programming.md#1921-pattern-recognition---state-operator-and-dependency-direction)
and [space/numeric contracts](../19-dynamic-programming.md#1922-space-optimisation-complexity-and-numeric-contracts).
Capacity loops descend for one-use items and ascend for unlimited reuse.
Coin-first counting gives combinations; amount-first counting gives sequences.

Attempt the [Chapter 19 questions](../19-dynamic-programming.md#check-your-understanding---chapter-19)
before opening the [solutions](../answers.md#solutions---chapter-19).
The source's final recognition checkpoint, Q19.41-Q19.48, was unanswered;
the model answers do not record a passed assessment.

**Remaining source roadmap:** Greedy, Tries, Bit Manipulation, Maths & Geometry,
and mixed interview practice. Detailed lessons for those topics are not part
of the supplied coding chapters.
