# Category Quantization Tasks — Design Document

This document describes the design for three analytical tasks that extend
`src/Graphiko/category_quantization.ipynb`.  Each task specifies its goal,
required data, code design, visualizations, and a testable hypothesis.

---

## Background: Category Quantization notebook

`src/Graphiko/category_quantization.ipynb` takes the per-video 20D reduced
embeddings produced by `src/Graphiko/Fetch-Business-Cluster-Videos.ipynb`,
trains a per-channel k-means model (4–10 clusters, silhouette-optimized), and
exposes two views of the result:

- A 2D scatter plot coloring each video dot by cluster ("polygon").
- A labeled table of video titles and their cluster assignments.
- A web-consumable JSON export (`business_cluster_video_embeddings_clustered_2d.json`).

The three tasks below build directly on this output.

---

## Task 1 — Performance Measurement

### Goal

Quantify how much predictive signal the semantic clusters carry for video
performance (view count).  A cluster that separates high-performing from
low-performing videos is an informative semantic partition; one where view
counts are uniformly distributed across clusters adds no actionable signal.

### Input data

| Artifact | Source | Key fields |
|---|---|---|
| Clustered 2D JSON | `category_quantization.ipynb` output at `.../business_cluster_video_embeddings_clustered_2d.json` | `video_id`, `channel_id`, `view_count`, `cluster_id`, `cluster_name`, `embedding_2d` |
| Reduced 20D CSV (optional) | `Fetch-Business-Cluster-Videos.ipynb` output at `.../business_cluster_video_embeddings_reduced_20d.csv` | Same video rows + `embedding_reduced_01` … `embedding_reduced_20` |

No new data fetch is needed; both artifacts are already produced by existing notebooks.

### Code design

The analysis should be implemented as a new notebook
`src/Graphiko/performance_measurement.ipynb` with the following cells:

1. **Load data** — mount Drive, load the clustered 2D JSON, validate required
   columns (`video_id`, `channel_id`, `view_count`, `cluster_id`).

2. **Normalise view counts** — apply `log1p` transformation to `view_count`
   per channel to reduce skew.  Retain the raw value as `view_count_raw`.

3. **Per-channel cluster performance summary** — for every channel, compute:
   - mean and median `log1p(view_count)` per `cluster_id`
   - inter-quartile range (IQR) per `cluster_id`
   - coefficient of variation (CV = std / mean) across clusters — low CV
     means performance is similar across clusters (low informativeness).

4. **Cluster informativeness score** — compute one-way ANOVA (F-statistic
   and p-value) of `log1p(view_count)` grouped by `cluster_id`, per channel.
   A significant F-statistic (p < 0.05) is evidence that the semantic
   partition is informative.  Additionally compute η² (eta-squared) as the
   effect-size estimate: `η² = SS_between / SS_total`.

5. **Cross-channel summary table** — collect `(channel_name, n_clusters,
   F_stat, p_value, eta_squared)` into a ranked DataFrame sorted by `η²`
   descending.

6. **Export** — write the summary table to:
   `/content/drive/MyDrive/Graphiko/analysis/performance_measurement/latest/cluster_performance_summary.csv`
   and a `run_summary.json` with input paths and run timestamp.

### Visualizations

| Plot | Description |
|---|---|
| **Box-plot grid** | One subplot per channel. X-axis = cluster label; Y-axis = `log1p(view_count)`. Each box shows the distribution of video performance within that cluster. Sorted by median descending so the best-performing cluster is leftmost. |
| **η² bar chart** | One bar per channel, showing effect size. A dashed horizontal line at η² = 0.06 (conventional "medium" effect). Bars colored by whether p < 0.05. |
| **Scatter: cluster centroid position vs cluster mean views** | 2D scatter using the 2D embedding coordinates of each cluster centroid (mean of member points). Point color encodes mean `log1p(view_count)` of that cluster. One figure per channel. Provides spatial intuition: are high-performing clusters spatially separated from low-performing ones? |

All figures are saved alongside the CSV under the `latest/` folder.

### Testable hypothesis

**H₀**: Within a given channel, mean `log1p(view_count)` does not differ
across semantic clusters (η² = 0).

**H₁**: At least one cluster has a significantly different mean performance
(ANOVA F-test p < 0.05, η² > 0.06).

**Reporting**: For each channel, report whether H₁ is supported.  Across the
full channel set, report the proportion of channels where H₁ is supported.
A proportion > 50 % would support the broader claim that semantic clustering
is a useful predictor of video performance.

---

## Task 2 — Subscription Topology

### Goal

For a given category (channel), represent — visually and separately — how that
category relates to every other category in terms of:

1. **Semantic distance** — derived from the embeddings distance graph.
2. **Topological distance** — derived from the subscriptions normalized
   distance graph.

Two standalone charts are produced, one per modality.

### Input data

| Artifact | Source | Key fields |
|---|---|---|
| Embeddings adjacency matrix | `Embeddings-Graph.ipynb` at `Graphiko/graphs/embeddings_distance/latest/adjacency_matrix.csv` | Square channel × channel distance matrix |
| Embeddings nodes | Same run, `nodes.csv` | `node_id`, `node_label` |
| Subscriptions adjacency matrix | `Create-Graph.ipynb` at `Graphiko/graphs/subscriptions_normalized_distance/latest/adjacency_matrix.csv` | Square channel × channel normalized distance matrix |
| Subscriptions nodes | Same run, `nodes.csv` | `node_id`, `node_label` |
| Clustered 2D JSON | `category_quantization.ipynb` output | Cluster polygon data per channel |

Both graph artifacts are already produced by existing notebooks and do not
require additional data collection.  See `docs/Graphiko/coding_guidelines.md`
for the common `graphiko.adjacency` schema used by both.

#### How to gather the data

1. Mount Google Drive in Colab:
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```
2. Read the embeddings matrix:
   ```python
   EMBEDDINGS_CSV = (
       '/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/latest/adjacency_matrix.csv'
   )
   ```
3. Read the subscriptions matrix:
   ```python
   SUBSCRIPTIONS_CSV = (
       '/content/drive/MyDrive/Graphiko/graphs/subscriptions_normalized_distance/latest/adjacency_matrix.csv'
   )
   ```
4. Load node labels from the companion `nodes.csv` files in the same `latest/`
   directories.  Use `channel_name` (from `node_label`) as the display label
   per `docs/Graphiko/coding_guidelines.md`.

### Code design

Implement as `src/Graphiko/subscription_topology.ipynb`:

1. **Load both adjacency matrices and node labels** — align to the common
   node intersection (same logic used in `graph_similarity_analysis.ipynb`).
   Minimum 3 shared nodes required.

2. **Select focal category** — configurable parameter `FOCAL_CHANNEL` (channel
   name string).  Default: first channel in alphabetical order.

3. **Extract focal row** — for each matrix, extract the row corresponding to
   `FOCAL_CHANNEL`, producing a distance vector to every other channel.

4. **Convert distances to similarities** — apply `similarity = 1 − normalized_distance`
   (same convention as `graph_similarity_analysis.ipynb` with
   `DISTANCE_TO_SIMILARITY = True`).

5. **Chart A — Semantic distance fan plot**:
   - A radial/spider chart where each spoke is another channel.
   - Spoke length encodes semantic *distance* (embeddings) from the focal
     channel.  Shorter spoke = more similar in content.
   - Channel labels annotate the spoke tips.
   - Alternatively, a horizontal bar chart sorted by ascending distance is
     acceptable when the number of channels is large (> 20).

6. **Chart B — Subscription topology fan plot**:
   - Identical layout to Chart A but using the subscriptions normalized
     distance vector.
   - Both charts use the same scale so visual comparison is direct.

7. **Overlay table** — a side-by-side DataFrame with columns
   `channel_name`, `semantic_distance`, `subscription_distance`,
   `semantic_rank`, `subscription_rank` sorted by `semantic_rank`.

8. **Export** — write both figures and the overlay table to:
   `/content/drive/MyDrive/Graphiko/analysis/subscription_topology/latest/`

### Visualizations

| Plot | Description |
|---|---|
| **Chart A: Semantic distance** | Bar chart (or radial fan) of all other channels sorted by ascending embeddings distance from the focal channel. Color encodes distance magnitude (cool = close, warm = distant). |
| **Chart B: Subscription topology** | Identical layout but using subscription normalized distance. Same channel order as Chart A so rank changes are immediately visible between the two charts. |

### Testable hypothesis

**H₀**: The rank ordering of other channels by semantic distance is the same
as the rank ordering by subscription distance (Spearman ρ = 1).

**H₁**: There exist channels whose semantic rank and subscription rank differ
significantly (Spearman ρ < 1, with a permutation p-value < 0.05).

**Reporting**: Compute Spearman ρ between the two distance vectors for the
focal channel.  Report the top-5 channels with the largest rank difference
(`|semantic_rank − subscription_rank|`) as the most interesting
divergence cases.

---

## Task 3 — Unified Performance × Modality Analysis

### Goal

Design a feature that measures video performance and correlates it with both
its semantic modality (cluster membership in the embeddings space) and its
topological modality (position in the subscription distance graph) in a single
chart and model.

### Input data

All three existing artifact families are required:

| Artifact | Source |
|---|---|
| Clustered 2D JSON | `category_quantization.ipynb` → `business_cluster_video_embeddings_clustered_2d.json` |
| Embeddings adjacency matrix + nodes | `Embeddings-Graph.ipynb` → `embeddings_distance/latest/` |
| Subscriptions adjacency matrix + nodes | `Create-Graph.ipynb` → `subscriptions_normalized_distance/latest/` |

#### How to gather the data

Follow the same Drive-mount and path instructions from Tasks 1 and 2.  The
three artifacts are always co-present when all three upstream notebooks have
been run in the same session.

### Code design

Implement as `src/Graphiko/performance_modality_analysis.ipynb`:

1. **Build per-video feature vector** — for every video in the clustered JSON:

   | Feature | Derivation |
   |---|---|
   | `log_views` | `log1p(view_count)` — target variable |
   | `cluster_id` | Integer cluster label from `category_quantization.ipynb` |
   | `cluster_centroid_distance` | Euclidean distance from the video's 2D embedding to its cluster centroid (intra-cluster spread proxy) |
   | `semantic_channel_rank` | Rank of the video's channel in the embeddings distance matrix, averaged across all rows (mean outbound distance rank — lower = more central in the semantic graph) |
   | `subscription_channel_rank` | Equivalent rank from the subscriptions distance matrix |
   | `semantic_isolation` | Focal channel's mean embedding distance to all other channels (from its adjacency row) |
   | `subscription_isolation` | Focal channel's mean subscription distance to all other channels |

2. **Single-chart: performance bubble chart**:
   - X-axis: `semantic_isolation` (how isolated the channel is in the
     embeddings graph).
   - Y-axis: `subscription_isolation` (how isolated the channel is in the
     subscriptions graph).
   - Bubble size: median `log_views` of the channel (performance proxy).
   - Bubble color: dominant cluster (most frequent `cluster_id` in the
     channel).
   - Each bubble is one channel; labels show `channel_name`.
   - This chart places every channel in semantic–topological space with
     performance encoded as a third visual dimension.

3. **Unified regression model** — fit an OLS (ordinary least squares)
   regression:
   ```
   log_views ~ semantic_isolation + subscription_isolation
               + cluster_centroid_distance + C(cluster_id)
   ```
   Use `statsmodels.formula.api.ols`.  Report coefficients, p-values, and
   adjusted R².

4. **Partial regression plots** — one panel per continuous predictor showing
   the partial relationship between that predictor and `log_views` after
   controlling for the other predictors (available directly from
   `statsmodels` via `plot_partregress_grid`).

5. **Export** — write the unified bubble chart, partial regression plots,
   OLS summary table, and `run_summary.json` to:
   `/content/drive/MyDrive/Graphiko/analysis/performance_modality/latest/`

### Visualizations

| Plot | Description |
|---|---|
| **Bubble chart** | Semantic isolation (X) × subscription isolation (Y), bubble size = median log_views, bubble color = dominant cluster. One bubble per channel. Annotation arrows mark the top-3 and bottom-3 performing channels. |
| **Partial regression grid** | 3-panel grid for `semantic_isolation`, `subscription_isolation`, and `cluster_centroid_distance`. Residuals on Y, partial predictor on X. A positive slope for a given predictor means that modality drives performance independently of the others. |

### Testable hypothesis

**H₀**: Neither semantic modality (`semantic_isolation`) nor topological
modality (`subscription_isolation`) is a significant predictor of video
performance (`log_views`) in the unified OLS model (both β = 0).

**H₁**: At least one of `semantic_isolation` or `subscription_isolation` has
a statistically significant non-zero coefficient (p < 0.05) in the unified
OLS model.

**Reporting**: Report adjusted R², the individual coefficients with 95 %
confidence intervals, and whether each modality predictor is significant.
Additionally report which modality (semantic vs topological) contributes more
variance by comparing the absolute value of standardized coefficients.

---

## Notebook conventions

All three notebooks must follow `docs/Graphiko/coding_guidelines.md`:

- Every code cell is preceded by a short markdown paragraph describing intent
  and expected outputs.
- Channel names (not IDs) are used as display labels.
- A single `channel_id → channel_name` map is built once per run and reused
  consistently.
- Output column names are unambiguous (`source_channel_name`,
  `target_channel_name`, `channel_name`).

---

## Summary of output artifacts

| Notebook | Drive output path |
|---|---|
| `performance_measurement.ipynb` | `Graphiko/analysis/performance_measurement/latest/` |
| `subscription_topology.ipynb` | `Graphiko/analysis/subscription_topology/latest/` |
| `performance_modality_analysis.ipynb` | `Graphiko/analysis/performance_modality/latest/` |

All three run paths also mirror under a timestamped `vYYYYMMDD_HHMMSS/`
directory alongside `latest/` for reproducibility.

---

## Scientific references

- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*
  (2nd ed.). Lawrence Erlbaum. — η² effect-size benchmarks (small 0.01,
  medium 0.06, large 0.14).
- Mantel, N. (1967). The detection of disease clustering and a generalized
  regression approach. *Cancer Research*, 27(2), 209–220.
- Krackhardt, D. (1987). QAP partialling as a test of spuriousness.
  *Social Networks*, 9(2), 171–186.
- Borgatti, S. P., Everett, M. G., & Johnson, J. C. (2018). *Analyzing
  Social Networks* (2nd ed.). SAGE Publications.
