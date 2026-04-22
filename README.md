# AI

## Shared Finder subscription artifacts (Google Drive)

To make the common subscription matrix reusable across notebooks and repositories,
`Grafiko.ipynb` persists artifacts to this shared Google Drive folder:

- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/owner_overlap_matrix.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/owner_overlap_matrix.pkl`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/subscriptions_per_channel.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/normalized_distance_matrix.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/normalized_distance_edges.csv`

### Reuse from any notebook
1. Mount Google Drive in Colab:
   `from google.colab import drive; drive.mount('/content/drive')`
2. Read artifacts from:
   `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/`

## Embeddings distance graph artifacts (Google Drive)

`src/Graphiko/Embeddings-Graph.ipynb` writes semantic embedding graph outputs to:

- `/content/drive/MyDrive/Graphiko/embeddings_distance_graph/distance_graph_directed_normalized.csv`
- `/content/drive/MyDrive/Graphiko/embeddings_distance_graph/channel_embeddings_pca.csv`

## Graph similarity analysis (embeddings vs subscriptions)

Use `src/analysis/graph_similarity_analysis.py` to compare the semantic embeddings graph
against the subscription graph with:

- **Numerical outputs**: Pearson/Spearman correlation, cosine similarity, RMSE/MAE,
  binary edge Jaccard overlap, Mantel permutation test, and QAP-style permutation test.
- **Visualizations**: side-by-side heatmaps, difference heatmap, and edge-weight scatter/regression.

### Run

```bash
python src/analysis/graph_similarity_analysis.py \
  --embeddings /content/drive/MyDrive/Graphiko/embeddings_distance_graph/distance_graph_directed_normalized.csv \
  --subscriptions /content/drive/MyDrive/finder_artifacts/common_subscription_matrix/normalized_distance_matrix.csv \
  --output-dir outputs/graph_similarity \
  --distance-to-similarity
```

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
