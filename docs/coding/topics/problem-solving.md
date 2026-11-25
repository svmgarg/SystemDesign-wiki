# Problem Solving and Complexity

[All coding topics](../index.md)

Start here before choosing an algorithm. A solution needs a clear input/output
contract, an explanation of why it is correct, and an honest accounting of time
and memory.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Clarifying a problem](../01-problem-solving.md#11-the-problem-solving-pipeline) | Identify legal inputs, output requirements, mutation rules, and useful boundary cases. |
| [Proving correctness](../01-problem-solving.md#12-correctness-through-invariants) | Explain initialization, maintenance, and termination using a loop invariant. |
| [Time complexity](../01-problem-solving.md#13-time-complexity) | Count actual work; distinguish worst-case, expected, and amortized bounds. |
| [Space complexity](../01-problem-solving.md#14-space-complexity) | Separate active recursion frames, auxiliary storage, and returned output. |
| [Implementation discipline](../01-problem-solving.md#15-implementation-discipline) | Check numeric ranges, allocation costs, empty inputs, and comparison contracts. |

## Worked example and practice

Follow the [Two Sum derivation](../01-problem-solving.md#deriving-two-sum-instead-of-memorising-it):
start with all pairs, identify repeated complement lookup, then introduce a map
from value to earlier index. Explain why lookup comes before insertion.

Attempt [Chapter 1's questions](../01-problem-solving.md#check-your-understanding---chapter-1),
then check the [separate solutions](../answers.md#solutions---chapter-1).

**Next topic:** [Arrays and range patterns](arrays.md).
