# AI

## Shared Finder subscription artifacts (Google Drive)

To make the common subscription matrix reusable across notebooks and repositories,
`Grafiko.ipynb` persists artifacts to this shared Google Drive folder:

- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/owner_overlap_matrix.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/owner_overlap_matrix.pkl`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/subscriptions_per_channel.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/normalized_distance_matrix.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/normalized_distance_edges.csv`

> Deprecated for graph-comparison workflows: use Graphiko schema exports under
> `/content/drive/MyDrive/Graphiko/graphs/.../latest/adjacency_matrix.csv`.

### Reuse from any notebook
1. Mount Google Drive in Colab:
   `from google.colab import drive; drive.mount('/content/drive')`
2. Read artifacts from:
   `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/`

## Embeddings distance graph artifacts (Google Drive)

`src/Graphiko/Embeddings-Graph.ipynb` writes semantic embedding graph outputs to:

- `/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/latest/adjacency_matrix.csv`
- `/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/latest/channel_embeddings_pca.csv`
- `/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/latest/metadata.json`

> Deprecated path (old export format, often edge-list and not square):
> `/content/drive/MyDrive/Graphiko/embeddings_distance_graph/distance_graph_directed_normalized.csv`

## Graph similarity analysis notebook (embeddings vs subscriptions)

Use `src/Graphiko/graph_similarity_analysis.ipynb` to compare the semantic embeddings graph
against the subscriptions graph.

The notebook provides:

- **Numerical outputs**: Pearson/Spearman correlation, cosine similarity, RMSE/MAE,
  edge-overlap Jaccard, Mantel permutation test, and QAP-style permutation test.
- **Visual outputs**: side-by-side heatmaps, difference heatmap, and edge-weight scatter.

### Run

Open and execute:

- `src/Graphiko/graph_similarity_analysis.ipynb`

Then set:

- `EMBEDDINGS_CSV`
- `SUBSCRIPTIONS_CSV`
- `OUTPUT_DIR`
- `DISTANCE_TO_SIMILARITY`

and run the analysis cells.

### Default graph inputs (recommended)

- `EMBEDDINGS_DRIVE_SOURCE=/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/latest/adjacency_matrix.csv`
- `SUBSCRIPTIONS_DRIVE_SOURCE=/content/drive/MyDrive/Graphiko/graphs/subscriptions_normalized_distance/latest/adjacency_matrix.csv`

### Output artifacts

- `outputs/graph_similarity/similarity_metrics.json`
- `outputs/graph_similarity/similarity_metrics.csv`
- `outputs/graph_similarity/heatmaps_side_by_side.png`
- `outputs/graph_similarity/difference_heatmap.png`
- `outputs/graph_similarity/edge_weight_scatter.png`
- `outputs/graph_similarity/run_summary.json`

### Scientific references implemented in code

- Mantel, N. (1967). *Cancer Research*.
- Krackhardt, D. (1987). *Social Networks*.
- Borgatti, S. P., Everett, M. G., & Johnson, J. C. (2018). *Analyzing Social Networks*.
- Schieber, T. A., et al. (2017). *Nature Communications*.
