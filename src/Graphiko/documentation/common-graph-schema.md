# Graphiko Common Graph Schema

This document defines a shared, matrix-based schema used by both Graphiko notebooks:

- `src/Graphiko/Create-Graph.ipynb`
- `src/Graphiko/Embeddings-Graph.ipynb`

## Schema identifier

- `schema_name`: `graphiko.adjacency`
- `schema_version`: `1.0.0`

## Artifact layout (applies to every graph)

Each graph writes two directories:

- `latest/` (always points to the newest export)
- `v<schema_version>/` (immutable versioned export)

Each directory contains:

1. `nodes.csv`
   - Columns:
     - `node_id` (string, stable id used by the matrix)
     - `node_label` (human-readable node label)

2. `adjacency_matrix.csv`
   - A square matrix.
   - Rows are graph source nodes.
   - Columns are graph target nodes.
   - First column is `row_node_id`.
   - Remaining columns are node ids matching `nodes.csv.node_id`.
   - The matrix is explicitly labeled in both directions:
     - **row labels** = `row_node_id`
     - **column labels** = node-id header columns

3. `metadata.json`
   - Required keys:
     - `schema_name`
     - `schema_version`
     - `graph_kind`
     - `is_directed`
     - `weight_semantics`
     - `node_count`
     - `row_node_ids`
     - `column_node_ids`
     - `derivation`

## Matrix semantics

The schema is shared, but weight meaning depends on `graph_kind`:

- `subscriptions_owner_overlap`
  - Undirected overlap matrix where weight(i,j) = count of shared subscription owners.
- `subscriptions_normalized_inverse_overlap_distance`
  - Directed matrix derived from overlap via inverse-overlap + row normalization.
- `embeddings_pca_euclidean_rowmax_normalized_distance`
  - Directed matrix derived from channel-description embeddings via PCA + Euclidean distance + row-max normalization.

Consumers must always inspect `metadata.json` to interpret edge weights.
