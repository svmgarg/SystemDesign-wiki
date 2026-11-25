# Strings and Hashing

[All coding topics](../index.md)

String problems combine sequence rules with a choice of text unit: bytes, code
units, Unicode scalar values, or user-perceived characters. Hash tables help
count and look up values; they do not replace equality checks.

## Detailed lessons

| Section | What you will learn |
| --- | --- |
| [Text representation and construction](../05-strings.md#51-string-representation-and-construction) | Avoid repeated immutable concatenation and define what a character means. |
| [Frequency maps and signatures](../05-strings.md#52-frequency-counting-and-hashing-patterns) | Count symbols, group anagrams, and choose a map versus a set. |
| [Palindrome checks](../05-strings.md#53-palindrome-checking) | Compare from both ends and handle a single allowed deletion. |
| [Longest palindromic substring](../05-strings.md#54-longest-palindromic-substring) | Expand around odd and even centers without confusing substring with subsequence. |
| [Hash-table mechanics](../05-strings.md#55-hash-table-mechanics) | Understand collisions, equality, load, and immutable-key requirements. |

## Practice

Explain why equal hashes do not prove equal values. Expand around both centers
in `"abba"` and account for the quadratic worst-case work.

Attempt [Chapter 5's questions](../05-strings.md#check-your-understanding---chapter-5)
before opening the [solutions](../answers.md#solutions---chapter-5).

**Related topic:** [Sliding windows](../04-two-pointers.md).
**Next topic:** [Linked lists](linked-lists.md).
