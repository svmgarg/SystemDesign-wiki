# Graphs

[All coding topics](../index.md)

A graph models vertices and edges. Before choosing an algorithm, specify
direction, weights, duplicate-edge rules, connectivity, and what the result
must optimize.

## Traversal and structure

| Section | Details |
| --- | --- |
| [Graph representations](../18-graphs.md#181-graph-models-and-representation-contracts) | Adjacency lists, matrices, edge lists, and input contracts. |
| [BFS](../18-graphs.md#182-bfs---schedule-each-vertex-once-by-distance-layer) and [DFS](../18-graphs.md#183-dfs---finish-a-reachable-region-before-returning) | Discovery timing, parents, distance layers, and explicit recursive frames. |
| [Connected components](../18-graphs.md#184-connected-components---restart-only-from-unvisited-vertices) | Restart traversal only from unseen vertices. |
| [Undirected cycles](../18-graphs.md#185-undirected-cycles---ignore-the-one-incoming-parent-edge) and [directed cycles](../18-graphs.md#186-directed-cycles-and-dfs-topological-order) | Distinguish a parent edge from an active-path back edge. |
| [Kahn's algorithm](../18-graphs.md#187-kahns-topological-sort---remove-satisfied-prerequisites) | Consume zero-indegree vertices and detect incomplete topological output. |
| [Bipartite checks](../18-graphs.md#188-bipartite-graphs---alternate-colors-across-every-edge) | Alternate colors across every edge, including disconnected components. |

## Grids and shortest paths

| Section | Details |
| --- | --- |
| [Grid traversal](../18-graphs.md#189-grids-are-implicit-graphs), [multi-source BFS](../18-graphs.md#1810-multi-source-bfs---all-sources-form-time-zero), and [propagation](../18-graphs.md#1811-simultaneous-propagation-and-unreachable-targets) | Neighbor rules, islands, simultaneous sources, and unreachable targets. |
| [Path reconstruction](../18-graphs.md#1812-reconstruct-one-shortest-path-with-parents) | Return a route from parent links instead of confusing parents with distances. |
| [Algorithm selection](../18-graphs.md#1813-choose-the-shortest-path-algorithm-from-its-edge-contract) | Unit weights, 0-1 weights, general nonnegative weights, and negative edges. |
| [Safe arithmetic](../18-graphs.md#1814-weighted-arithmetic-and-infinity-are-part-of-the-contract) | Skip unreachable states and detect finite overflow. |
| [Dijkstra](../18-graphs.md#1815-dijkstra---tentative-discovery-versus-final-extraction), [Bellman-Ford](../18-graphs.md#1816-bellman-ford---repeated-edge-relaxation-including-negatives), and [Floyd-Warshall](../18-graphs.md#1817-floyd-warshall---grow-the-set-of-allowed-intermediates) | Tentative versus final distances, reachable negative cycles, and all-pairs states. |
| [Expanded states](../18-graphs.md#1818-state-expanded-shortest-paths---node-identity-includes-future-options) | Include coupon availability in the vertex state. |

## Connectivity and minimum spanning trees

Study [Union-Find](../18-graphs.md#1819-union-find---merge-component-representatives),
[DSU cycle detection](../18-graphs.md#1820-detect-undirected-cycles-with-dsu),
the [MST objective](../18-graphs.md#1821-msts-optimize-total-connection-cost-not-source-routes),
[Kruskal](../18-graphs.md#1822-kruskal---cheapest-global-edge-joining-distinct-components),
and [Prim](../18-graphs.md#1823-prim---cheapest-edge-crossing-out-of-the-current-tree).
An MST minimizes the total network cost, not shortest routes from a source.

## Practice and coverage

Use the [selection and complexity map](../18-graphs.md#1824-selection-map-invariants-and-complexity-reference),
then attempt the [Chapter 18 checkpoint](../18-graphs.md#check-your-understanding---chapter-18)
before opening the [solutions](../answers.md#solutions---chapter-18).
The source covers 0-1 BFS recognition and deque rules, not a full implementation.

**Next topic:** [Dynamic programming](dynamic-programming.md).
