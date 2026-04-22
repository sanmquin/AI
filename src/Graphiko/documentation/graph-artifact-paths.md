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
4. Normalize each row by row maximum value.
5. Set diagonal to `0` and export as adjacency matrix.

### Usage notes

- Use this graph for semantic-distance analysis between channel descriptions.
- Compare against overlap graph to detect audience-vs-content alignment gaps.
