# Recursion and Backtracking

[All coding topics](../index.md)

Backtracking explores a tree of choices. Each branch must restore every shared
mutation before its sibling begins, and saved results must not alias the
working path.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Recursive contracts](../16-backtracking.md#161-the-recursion-contract-and-the-active-stack) | Define the state, base cases, progress measure, and active-stack cost. |
| [Choose, explore, undo](../16-backtracking.md#162-choose-explore-undo-the-state-restoration-invariant) | Restore shared state and snapshot accepted results. |
| [Subsets](../16-backtracking.md#163-subsets-recap---reconstructed-prerequisite) | Include or exclude each element. |
| [Distinct permutations](../16-backtracking.md#164-distinct-permutations---recurse-over-output-positions) | Track which input positions are already used. |
| [Unique permutations](../16-backtracking.md#165-unique-permutations---suppress-equivalent-siblings) | Skip redundant equal siblings without rejecting valid repeated values deeper in a path. |
| [Combinations](../16-backtracking.md#166-combinations---availability-is-encoded-by-start) | Encode remaining availability in a start index and derive a feasibility bound. |
| [Combination Sum](../16-backtracking.md#167-combination-sum---reuse-and-the-remaining-target) | Distinguish reusable choices from single-use choices; prove positivity-based pruning. |
| [N-Queens](../16-backtracking.md#169-n-queens---one-structural-decision-per-row) | Track columns and both diagonal families while placing one queen per row. |

## Practice

Draw sibling branches for `[1,1,2]`, then explain the unique-permutation skip
condition. For each algorithm, count both visited states and output copying.

Attempt [Chapter 16's questions](../16-backtracking.md#check-your-understanding---chapter-16)
before opening the [solutions](../answers.md#solutions---chapter-16).

**Next topic:** [Sorting and selection](sorting.md).
