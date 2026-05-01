# Channel Clustering and Graph Projection Artifacts

This document defines the artifact contract used by the web app for:

- channel-level clustering outputs,
- channel-level semantic graph projection outputs.

The goal is that app developers can integrate without opening notebooks.

## 1) Channel clustering artifacts

Source notebook: `src/Graphiko/2.Channel-Clustering.ipynb`

Output root:

- `/content/drive/MyDrive/Graphiko/exports/video_embeddings_clustered/optimized/`

Files:

1. `business_cluster_video_embeddings_channel_optimized_reduced.json`
   - Array of video-level rows.
   - Includes per-video assignment and reduced embedding fields used downstream.
   - Key fields consumed by app/data pipelines:
     - `channel_name: string`
     - `video_id: string`
     - `cluster_id: number`
     - `cluster_name: string`
     - `best_k_for_channel: number`
     - `best_adj_r2_for_channel: number`
     - `embedding_20d: number[20]`
     - `x: number`
     - `y: number`

2. `channel_optimal_clustering_metrics.json`
   - Array, one record per channel.
   - Interface:
     - `channel_name: string`
     - `n_videos: number`
     - `best_k: number | null`
     - `best_adj_r2: number | null`
     - `eligible: boolean`
     - `note?: string`

3. `channel_cluster_centroids.json`
   - Array, one record per channel.
   - Interface:
     - `channel_name: string`
     - `centroid_20d: number[20]`
     - `centroid_2d_x: number`
     - `centroid_2d_y: number`

### 2D meaning for clustering outputs

- `centroid_2d_x` / `centroid_2d_y` are means of each channel's reduced video points (`x`, `y`) from the clustered video export.
- They are useful for visualization within the same run and same 2D basis.
- They are **not guaranteed cross-run comparable** unless the exact same upstream reduction setup/data ordering is preserved.

## 2) Graph projection artifacts

Source notebook: `src/Graphiko/3.Graph-Projection.ipynb`

Output root:

- `/content/drive/MyDrive/Graphiko/analysis/graph_projection/latest/`

Files:

1. `channel_centroids_20d.json`
   - Array, one record per channel.
   - Interface:
     - `channel_id: string | number`
     - `channel_name: string`
     - `centroid_20d: number[20]`

2. `channel_adjacency_relative_distance.json`
   - Object with aligned arrays/matrix.
   - Interface:
     - `channel_ids: (string | number)[]`
     - `channel_names: string[]`
     - `distance_matrix_row_normalized: number[n_channels][n_channels]`
   - Alignment rule:
     - row `i`, col `j` corresponds to `channel_ids[i] -> channel_ids[j]`.

3. `channel_projection_2d.json`
   - Array, one record per channel.
   - Interface:
     - `channel_id: string | number`
     - `channel_name: string`
     - `x: number`
     - `y: number`

4. `run_summary.json`
   - Provenance and export metadata.

### How graph 2D is computed and comparability

- The notebook computes pairwise Euclidean distances between channel 20D centroids.
- It then runs **metric MDS** (`dissimilarity='precomputed'`) once on the full channel distance matrix.
- Therefore, `x,y` in `channel_projection_2d.json` are globally comparable **across channels within the same run**.
- Cross-run comparisons are not guaranteed unless channel set, centroid inputs, and MDS configuration stay identical.

## App integration recommendation

- Prefer reading these exact `latest/` JSON files directly.
- Treat `run_summary.json` as the provenance contract and show its method note in tooltips/metadata panels.
