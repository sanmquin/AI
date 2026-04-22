# Similarity Graph Analysis — Researcher Context

This document provides comprehensive context for a senior researcher interpreting the outputs of `src/Graphiko/graph_similarity_analysis.ipynb`.

---

## 1. What is being compared

The analysis cross-examines two independently derived channel-relationship graphs built over the same node universe — the channels belonging to the latest **business cluster** in the Finder platform:

| Graph | Artifact path | What an edge weight represents |
|---|---|---|
| **Embeddings graph** | `Graphiko/graphs/embeddings_distance/latest/adjacency_matrix.csv` | Semantic distance between two channels based on their textual descriptions |
| **Subscriptions graph** | `Graphiko/graphs/subscriptions_normalized_distance/latest/adjacency_matrix.csv` | Proximity between two channels based on shared subscription owners (audience overlap) |

These two graphs encode **two independent signals** of channel relatedness: one from content semantics, the other from actual audience behaviour.

---

## 2. Data pipelines

### Subscriptions graph (`Create-Graph.ipynb`)

1. Connects to MongoDB (`finder` database).
2. Identifies the latest version of the `ChannelDescriptions_clusters` collection and finds the cluster whose name starts with `business`.
3. Resolves channel IDs via `ChannelDescriptions_items → channels`.
4. Fetches all `subscriptions` documents for those channels. The owner of a subscription is identified by the `subscriberChannelId` field (the channel that performed the subscription, not a viewer username).
5. Builds a raw **shared-owner overlap matrix**: `cell(i,j) = number of unique subscriber channel IDs that subscribed to both channel i and channel j`.
6. Converts the overlap matrix into a **normalized distance matrix**:
   - `distance_raw(i,j) = 1 / (overlap(i,j) + 1)` — larger overlap → smaller distance, with +1 smoothing to avoid division by zero.
   - Diagonal is forced to 0 (self-distance).
   - Each row is divided by its sum so that **outbound distances from each node sum to 1** (row-stochastic matrix).

### Embeddings graph (`Embeddings-Graph.ipynb`)

1. Retrieves channel description embeddings from Pinecone (`finder` index, `ChannelDescriptions` namespace). Model: `multilingual-e5-large` (1024-dimensional multilingual embeddings).
2. For any channels without existing vectors, embeds the `description` field from MongoDB `channels` and upserts to Pinecone.
3. Reduces dimensionality with **PCA** (`min(50, embedding_dim, n_channels - 1)` components).
4. Computes **pairwise Euclidean distances** in PCA space.
5. Row-sum normalizes identically to the subscriptions pipeline — the matrix is row-stochastic with a zero diagonal.

### Schema and interoperability

Both graphs are persisted in the `graphiko.adjacency` v1.0.0 schema — a labeled square CSV adjacency matrix plus a `nodes.csv` node list and a `metadata.json` manifest. The `metadata.json` `weight_semantics` field must always be inspected before interpreting edge values, since the same schema carries different semantics across graph kinds.

---

## 3. Pre-processing before the similarity computation

Before any metric is computed, the notebook applies the following transformations:

1. **Node intersection**: Only channels present in both matrices are retained, aligned to a common sorted order. A minimum of 3 shared nodes is required.
2. **Distance-to-similarity conversion** (when `DISTANCE_TO_SIMILARITY = True`, which is the default):
   - Each matrix is globally **min-max normalized** to [0, 1].
   - Similarities are computed as `similarity = 1 − normalized_distance`.
   - After this step, **higher values mean more similar channels** in both matrices.
3. **Upper-triangle vectorisation**: Because both matrices are symmetric after alignment (undirected edges), only the upper triangle (excluding the diagonal) is used for all pairwise statistics. For an n-node graph, this yields `n(n−1)/2` unique edge pairs.

---

## 4. Metrics — what each measures and how to read it

| Metric | Definition | Scale | What a high value means |
|---|---|---|---|
| `pearson_r` / `pearson_p` | Pearson linear correlation between the two upper-triangle edge-weight vectors | −1 to 1 | Linear co-movement in absolute edge weights; sensitive to outliers |
| `spearman_rho` / `spearman_p` | Rank-order Pearson correlation between the same vectors | −1 to 1 | Monotonic relationship in relative ordering of edge weights; robust to non-linearity and outliers |
| `cosine_similarity` | Cosine of the angle between the two edge-weight vectors | 0 to 1 | Both graphs agree on the directional pattern of weights (agnostic to scale) |
| `rmse` | Root-mean-square of element-wise differences | ≥ 0 (lower is better) | Small means edge weights are numerically close across both graphs |
| `mae` | Mean absolute error of element-wise differences | ≥ 0 (lower is better) | More interpretable than RMSE; less sensitive to large individual deviations |
| `edge_jaccard` | Jaccard index of binarised edges (threshold = 0.7 by default) | 0 to 1 | Both graphs agree on *which* channel pairs are strongly connected, regardless of exact weight |
| `mantel_r` / `mantel_p` | Mantel (1967) matrix correlation with two-sided permutation p-value (2000 permutations, seed 42) | −1 to 1 | Statistically significant structural correlation at the matrix level, accounting for non-independence of dyadic observations |
| `qap_r` / `qap_p` | QAP-style (Krackhardt 1987) one-sided permutation correlation (2000 permutations, seed 7) | −1 to 1 | Same as Mantel but uses a one-sided test; QAP is the standard network-science complement to the Mantel test |

**Both permutation tests share the same logic**: the observed correlation is compared against a null distribution generated by randomly permuting one matrix's rows and columns simultaneously (node-label-preserving shuffles). This preserves the degree distribution of the permuted graph and is robust to the non-independence that would invalidate a naive Pearson p-value.

**Significance**: use `p < 0.05` as the conventional threshold. Because the p-value is estimated by `(count_exceeding + 1) / (permutations + 1)`, the minimum attainable p-value with 2000 permutations is `1/2001 ≈ 0.0005`.

---

## 5. Interpreting combinations of metrics

No single metric is sufficient; the notebook is designed around multi-metric assessment (Schieber et al. 2017). Consider these interpretive patterns:

| Pattern | Likely interpretation |
|---|---|
| High Mantel r + low p AND high Spearman rho | Strong, statistically significant structural correspondence — semantic content and audience behaviour are aligned across the network |
| High Jaccard but low Pearson r | The graphs agree on *which* channel pairs are close (topology) but disagree on degree — content closeness and audience closeness diverge in magnitude |
| Low Mantel p but low Pearson r | Rank structure is preserved but linear scale differs — a monotone transformation exists between the two representations |
| High RMSE alongside high Spearman | Systematic scale difference or a small number of extreme outlier edges; inspect the difference heatmap |
| Low Jaccard but high Pearson | Global weight correlation exists but not at the extreme (threshold = 0.7) structural level; channels that are "very close" in one graph are not "very close" in the other |
| All metrics low/non-significant | Semantic content and audience overlap are essentially independent signals for this channel set — the two graph types capture orthogonal phenomena |

---

## 6. Visual outputs and what to look for

| Figure | What to look for |
|---|---|
| `heatmaps_side_by_side.png` | Compare the block/cluster structure of both matrices. Matching dark-block patterns indicate correlated communities; absent blocks in one but not the other reveal community divergence |
| `difference_heatmap.png` | Positive (red) cells: embeddings graph assigns higher similarity than subscriptions graph. Negative (blue) cells: audience overlap is stronger than content similarity predicts. Concentrated off-diagonal bands may reveal clusters with misaligned content and audience |
| `edge_weight_scatter.png` | Each point is one channel pair. Slope indicates how well the two signals scale together. A tight linear band → high Pearson. A monotone but curved band → high Spearman but lower Pearson. A fan shape → heteroscedastic relationship; some regions of the graph are more aligned than others |

---

## 7. Domain interpretation

The core research question answered by this analysis is:

> **Do channels that are semantically similar (same kind of content) also attract overlapping audiences?**

- **High overall similarity** (high Mantel r, Spearman rho, Jaccard): Content-audience alignment is strong. Recommendation and clustering algorithms based on either signal alone should produce compatible results.
- **Low similarity**: The two graphs capture genuinely different phenomena. Channels might serve the same content niche but attract different audiences (e.g., regional/linguistic segmentation), or channels might share audiences despite describing unrelated content (parasocial or algorithmic co-recommendation effects). This is an actionable divergence warranting further investigation.
- **Mixed results by cluster region** (visible in the difference heatmap): Alignment may be strong for some channel sub-groups but weak for others — warranting cluster-level breakdowns.

---

## 8. Key parameters to note when reading results

| Parameter | Default | Effect on interpretation |
|---|---|---|
| `DISTANCE_TO_SIMILARITY` | `True` | Both matrices are inverted before comparison. If `False`, raw normalized distances are compared directly — check `metadata.json` `weight_semantics` to confirm |
| `EDGE_THRESHOLD` | `0.7` | Only affects `edge_jaccard`. A higher threshold tests for agreement on the strongest edges only; lower thresholds are more inclusive |
| `PERMUTATIONS` | `2000` | Determines precision of permutation p-values. With 2000 permutations the minimum p-value is ~0.0005 |
| Node intersection size (`n_nodes`) | Varies by run | Directly affects statistical power. Fewer shared nodes → wider confidence intervals for all permutation-based metrics |

---

## 9. Scientific references

- Mantel, N. (1967). The detection of disease clustering and a generalized regression approach. *Cancer Research*, 27(2), 209–220.
- Krackhardt, D. (1987). QAP partialling as a test of spuriousness. *Social Networks*, 9(2), 171–186.
- Borgatti, S. P., Everett, M. G., & Johnson, J. C. (2018). *Analyzing Social Networks* (2nd ed.). SAGE Publications.
- Schieber, T. A., et al. (2017). Quantification of network structural dissimilarities. *Nature Communications*, 8, 13928.
