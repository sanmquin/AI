# Graph Similarity Output Artifacts (Drive) and Residual Analysis Consumption

This document centralizes the output contract for `src/Graphiko/graph_similarity_analysis.ipynb` and explains how those artifacts are consumed by `src/Graphiko/residual_disagreement_analysis.ipynb`.

## Similarity analysis output root

- Drive root: `/content/drive/MyDrive/Graphiko/analysis/graph_similarity/`
- Run directory pattern: `vYYYYMMDD_HHMMSS/`
- Stable mirror: `latest/`

Each run emits at least:

- `similarity_metrics.json`
- `similarity_metrics.csv`
- `run_summary.json`
- `heatmaps_side_by_side.png`
- `difference_heatmap.png`
- `edge_weight_scatter.png`
- `edge_weight_distributions.png`
- `permutation_null_distributions.png`

## Key artifact used by the residual notebook

`src/Graphiko/residual_disagreement_analysis.ipynb` treats the similarity run as its provenance anchor and **starts from**:

- `.../graph_similarity/<run_or_latest>/run_summary.json`

From that file, it reads:

- `inputs.embeddings_downloaded_csv`
- `inputs.subscriptions_downloaded_csv`

These two matrices are then aligned and used to compute:

- directed residual matrix `R = sub_analysis - emb_analysis`
- row-standardized residual matrix `Z`
- pair-level, node-level, and meso-level disagreement artifacts

If either recorded CSV path is unavailable, the notebook falls back to:

- `/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/latest/adjacency_matrix.csv`
- `/content/drive/MyDrive/Graphiko/graphs/subscriptions_normalized_distance/latest/adjacency_matrix.csv`

## Residual analysis output root

- Drive root: `/content/drive/MyDrive/Graphiko/analysis/residual_disagreement/`
- Run directory pattern: `vYYYYMMDD_HHMMSS/`
- Stable mirror: `latest/`

Each run emits:

- `pair_level_residual_ranking.csv`
- `node_level_divergence.csv`
- `cluster_model_selection.csv`
- `residual_fingerprint_clusters.csv`
- `residual_cluster_sizes.csv`
- `signed_residual_edges_top_percentile.csv`
- `residual_matrix_heatmap.png`
- `residual_z_heatmap.png`
- `node_total_divergence_top20.png`
- `run_summary.json`

## Interpretation convention for signed residual edges

Residual direction is fixed to:

- `R_ij = sub_ij - emb_ij`

Because both matrices are distances (row-normalized):

- `R_ij > 0` (positive) means subscriptions says `i -> j` is **farther** than embeddings suggests.
- `R_ij < 0` (negative) means subscriptions says `i -> j` is **closer** than embeddings suggests.

This convention must remain stable across runs so downstream dashboards remain consistent.
