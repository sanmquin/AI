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
- `embeddings_pca_euclidean_rowsum_normalized_distance`
  - Directed matrix derived from channel-description embeddings via PCA + Euclidean distance + row-sum normalization (row-stochastic).

Consumers must always inspect `metadata.json` to interpret edge weights.




# Graph Artifact Paths and Usage

This document lists where each notebook writes graph outputs under the common schema, and what each graph represents.

## 1) Subscription owner overlap graph

- Notebook: `src/Graphiko/Create-Graph.ipynb`
- Root path: `/content/drive/MyDrive/Graphiko/graphs/subscriptions_owner_overlap/`
- Exports:
  - `latest/nodes.csv`
  - `latest/adjacency_matrix.csv`
  - `latest/metadata.json`
  - `v1.0.0/nodes.csv`
  - `v1.0.0/adjacency_matrix.csv`
  - `v1.0.0/metadata.json`

### Derivation

1. Pull the latest `business*` cluster from `finder.ChannelDescriptions_clusters`.
2. Resolve channel ids from `finder.ChannelDescriptions_items`.
3. Read subscriptions from `finder.subscriptions` using `subscriberChannelId` as owner id.
4. Build matrix where cell(i,j) is shared-owner count.

### Usage notes

- Use this graph to identify channels with overlapping audiences.
- Larger values indicate stronger audience overlap.

## 2) Subscription normalized distance graph

- Notebook: `src/Graphiko/Create-Graph.ipynb`
- Root path: `/content/drive/MyDrive/Graphiko/graphs/subscriptions_normalized_distance/`
- Exports:
  - `latest/nodes.csv`
  - `latest/adjacency_matrix.csv`
  - `latest/metadata.json`
  - `v1.0.0/nodes.csv`
  - `v1.0.0/adjacency_matrix.csv`
  - `v1.0.0/metadata.json`

### Derivation

Derived from the subscription overlap graph using:

- `distance_raw = 1 / (overlap + 1)`
- diagonal forced to `0`
- row normalization so each row sums to `1` (when row sum > 0)

### Usage notes

- Use this graph as a directed distance matrix for routing/ranking algorithms.
- Lower raw overlap becomes higher distance before normalization.

## 3) Embeddings distance graph

- Notebook: `src/Graphiko/Embeddings-Graph.ipynb`
- Root path: `/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/`
- Exports:
  - `latest/nodes.csv`
  - `latest/adjacency_matrix.csv`
  - `latest/channel_embeddings_pca.csv`
  - `latest/metadata.json`
  - `v1.0.0/nodes.csv`
  - `v1.0.0/adjacency_matrix.csv`
  - `v1.0.0/channel_embeddings_pca.csv`
  - `v1.0.0/metadata.json`

### Derivation

1. Load/fetch channel-description embeddings from Pinecone (`ChannelDescriptions` namespace).
2. Reduce embedding vectors with PCA.
3. Compute Euclidean pairwise distances.
4. Normalize each row by row sum so outbound distances sum to `1` (when row sum > 0).
5. Set diagonal to `0` and export as adjacency matrix.

### Usage notes

- Use this graph for semantic-distance analysis between channel descriptions.
- Compare against overlap graph to detect audience-vs-content alignment gaps.
