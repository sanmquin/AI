# AI — Graphiko & Research Platform

This repository is a research and engineering platform for studying the relationship between **content semantics** and **audience topology** in YouTube channel networks. The primary deliverable is **Graphiko**: a pipeline of Jupyter notebooks that builds, compares, and analyses two independently derived channel-relationship graphs, whose outputs are then visualised in a **React web application**.

---

## Table of contents

1. [Project overview](#project-overview)
2. [Repository layout](#repository-layout)
3. [Research context](#research-context)
4. [Graphiko — pipeline reference](#graphiko--pipeline-reference)
   - [Data sources](#data-sources)
   - [Notebooks](#notebooks)
   - [Graph schema](#graph-schema)
   - [Drive artifact paths](#drive-artifact-paths)
5. [Web app](#web-app)
   - [Data contract](#data-contract)
   - [Components](#components)
   - [Running locally](#running-locally)
   - [Deployment](#deployment)
6. [Predikto](#predikto)
7. [Coding guidelines](#coding-guidelines)
8. [Agent context](#agent-context)

---

## Project overview

The platform answers one core question:

> **Do channels that are semantically similar (same kind of content) also attract overlapping audiences?**

To answer it, Graphiko builds two graphs over the same set of channels (the *business* cluster in the Finder platform):

| Graph | Signal | Construction |
|---|---|---|
| **Embeddings distance graph** | Content semantics | Pairwise Euclidean distance of PCA-reduced channel-description embeddings (Pinecone / `multilingual-e5-large`) |
| **Subscriptions distance graph** | Audience behaviour | Normalised inverse of shared-subscriber-channel overlap (MongoDB `finder.subscriptions`) |

Both graphs are row-stochastic directed matrices stored under a versioned schema (`graphiko.adjacency v1.0.0`) in Google Drive. Downstream analysis notebooks measure their structural similarity and decompose disagreements. A React web application visualises the video-level clustering that emerges from the embedding pipeline.

---

## Repository layout

```
AI/
├── src/
│   ├── Graphiko/          # Jupyter notebooks — graph construction, analysis, visualisation pipeline
│   └── Predikto/          # Jupyter notebooks — InfluxDB raw-data ingestion helpers
├── webapp/                # React + Vite web application (deployed to Netlify)
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ChannelSelector.jsx
│   │       ├── Chart.jsx
│   │       ├── ClusterStats.jsx
│   │       ├── ErrorBoundary.jsx
│   │       └── Table.jsx
│   ├── public/            # Static assets; data.json is placed here for local dev
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── Graphiko/          # Schema contracts, researcher context, coding guidelines
│   ├── Finder/            # MongoDB and InfluxDB schema references
│   └── Predikto/          # Additional DB documentation
├── Development.md         # Drive artifact paths and reuse instructions
├── Research.md            # Academic framing of the research problem
└── netlify.toml           # Netlify build configuration
```

---

## Research context

`Research.md` frames the scientific problem: *Topology-Induced Anisotropic Prediction in Semantic Spaces*. In brief:

- Items (videos) belong to categories (channels) embedded in a shared semantic space.
- Standard isotropic prediction assumes value (views) decays uniformly with distance from a semantic optimum.
- The hypothesis is that this decay is **anisotropic** — it is faster in some directions — and that the **category topology** (the inter-channel graph) explains the preferred directions.
- This is a multi-view representation learning problem: one view is semantic (embedding space), the other is topological (subscription graph).

The Graphiko pipeline is the empirical foundation for testing this hypothesis.

---

## Graphiko — pipeline reference

### Data sources

| Store | Usage |
|---|---|
| **MongoDB** (`finder` database) | `ChannelDescriptions_clusters` — cluster membership; `ChannelDescriptions_items` — channel IDs; `channels` — channel metadata and descriptions; `subscriptions` — subscriber-channel IDs |
| **Pinecone** (`finder` index) | `ChannelDescriptions` namespace — channel description embeddings; `VideoTitles` namespace — video title embeddings |
| **Google Drive** (`/content/drive/MyDrive/`) | All artifact inputs and outputs (adjacency matrices, exports, analysis results) |

### Notebooks

The notebooks in `src/Graphiko/` are executed sequentially in the following logical order:

#### 1. `Create-Graph.ipynb`
Builds both the **subscription overlap graph** and the **subscription normalised distance graph**.

1. Connects to MongoDB and identifies the latest `business*` cluster.
2. Resolves channel IDs and fetches subscription documents.
3. Builds the raw overlap matrix (`cell(i,j)` = shared subscriber count).
4. Derives the distance matrix: `distance = 1 / (overlap + 1)`, diagonal forced to 0, then row-normalised.
5. Exports both graphs under the `graphiko.adjacency` schema to Google Drive.

#### 2. `Embeddings-Graph.ipynb`
Builds the **embeddings distance graph**.

1. Fetches channel-description embeddings from Pinecone; embeds and upserts any missing channels.
2. Reduces dimensionality with PCA (`min(50, dim, n_channels - 1)` components).
3. Computes pairwise Euclidean distances, row-sum normalises, sets diagonal to 0.
4. Exports the graph and a `channel_embeddings_pca.csv` file under the `graphiko.adjacency` schema.

#### 3. `Fetch-Business-Cluster-Videos.ipynb`
Fetches video data and produces the **20-dimensional video embedding export**.

1. Discovers the latest `business*` cluster and fetches its channels and videos from MongoDB.
2. Fetches or builds video-title embeddings in Pinecone (`VideoTitles` namespace).
3. Reduces video embeddings to 20 dimensions with PCA over the full run set.
4. Exports: `Graphiko/exports/video_embeddings_reduced/latest/business_cluster_video_embeddings_reduced_20d.csv`

#### 4. `category_quantization.ipynb`
Clusters videos per-channel and produces the **2D web-app JSON export**.

1. Loads the 20D video embeddings.
2. Runs per-channel k-means clustering to assign `cluster_id` and `cluster_name`.
3. Reduces embeddings to 2D for visualisation.
4. Exports a flat JSON array that is consumed directly by the web app.

Export path: `Graphiko/exports/video_embeddings_clustered/latest/business_cluster_video_embeddings_clustered_2d.json`

#### 5. `graph_similarity_analysis.ipynb`
Cross-examines the embeddings and subscriptions graphs.

- Inputs: the two `latest/adjacency_matrix.csv` files under their respective graph roots.
- Aligns node universes (intersection), optionally converts distances to similarities.
- Computes: Pearson r, Spearman ρ, cosine similarity, RMSE, MAE, edge Jaccard, Mantel test, QAP test.
- Outputs: metrics JSON/CSV, heatmaps, scatter plots, permutation null-distribution plots.
- Output root: `Graphiko/analysis/graph_similarity/latest/`

See `docs/Graphiko/graph_similarity_analysis_context.md` for metric-by-metric interpretation.

#### 6. `residual_disagreement_analysis.ipynb`
Decomposes disagreement between the two graphs.

- Reads provenance from `graph_similarity/<latest>/run_summary.json`.
- Computes directed residual `R = subscriptions − embeddings`.
- Outputs pair-level, node-level, and meso-level disagreement artifacts.
- Output root: `Graphiko/analysis/residual_disagreement/latest/`

See `docs/Graphiko/similarity_output_artifacts.md` for the full artifact contract.

#### Supporting notebooks

| Notebook | Purpose |
|---|---|
| `channel_video_geometry.ipynb` | Analyses video geometry within the embedding space |
| `cluster_performance_correlation.ipynb` | Correlates cluster position with engagement (views) |
| `channel_optimal_performance_clustering.ipynb` | Identifies clustering configurations that maximise performance signal |

### Graph schema

Every Graphiko graph uses the `graphiko.adjacency v1.0.0` schema. Each graph export directory contains:

| File | Description |
|---|---|
| `nodes.csv` | `node_id` (stable, used as matrix label), `node_label` (human-readable channel name) |
| `adjacency_matrix.csv` | Square matrix; first column is `row_node_id`; remaining column headers are `node_id` values |
| `metadata.json` | `schema_name`, `schema_version`, `graph_kind`, `is_directed`, `weight_semantics`, `node_count`, `row_node_ids`, `column_node_ids`, `derivation` |

**Always inspect `metadata.json` `weight_semantics` before interpreting edge values.** Registered `graph_kind` values:

- `subscriptions_owner_overlap` — raw shared subscriber count (undirected)
- `subscriptions_normalized_inverse_overlap_distance` — row-stochastic directed distance (lower = closer)
- `embeddings_pca_euclidean_rowsum_normalized_distance` — row-stochastic directed distance (lower = closer)

Both versioned (`v1.0.0/`) and stable (`latest/`) copies are written on every export run.

### Drive artifact paths

| Artifact | Path |
|---|---|
| Subscription overlap graph | `Graphiko/graphs/subscriptions_owner_overlap/latest/` |
| Subscription distance graph | `Graphiko/graphs/subscriptions_normalized_distance/latest/` |
| Embeddings distance graph | `Graphiko/graphs/embeddings_distance/latest/` |
| 20D video embeddings export | `Graphiko/exports/video_embeddings_reduced/latest/business_cluster_video_embeddings_reduced_20d.csv` |
| 2D clustered video export (web app input) | `Graphiko/exports/video_embeddings_clustered/latest/business_cluster_video_embeddings_clustered_2d.json` |
| Graph similarity analysis | `Graphiko/analysis/graph_similarity/latest/` |
| Residual disagreement analysis | `Graphiko/analysis/residual_disagreement/latest/` |

All paths are relative to `/content/drive/MyDrive/` when running in Google Colab.

---

## Web app

The web application (`webapp/`) visualises the per-channel video clustering produced by `category_quantization.ipynb`. It is a single-page React application with no backend.

### Data contract

The app fetches `/data.json` at runtime. This file must be a flat JSON array where each element matches the schema produced by `category_quantization.ipynb`:

| Field | Type | Notes |
|---|---|---|
| `channel_name` | string | Human-readable channel name |
| `video_title` | string | |
| `video_url` | string | Full YouTube URL |
| `video_id` | string | |
| `channel_id` | string | |
| `view_count` | number | snake_case canonical field |
| `viewCount` | number | camelCase alias for schema compatibility |
| `cluster_id` | number | |
| `cluster_name` | string | Human-readable cluster label |
| `embedding_2d` | `[x, y]` | Two-element number array |

For local development, place `data.json` in `webapp/public/`. In production the file must be available at the deploy root.

### Components

| Component | Responsibility |
|---|---|
| `ChannelSelector` | Dropdown populated from all unique `channel_name` values in the dataset |
| `Chart` | Recharts `ScatterChart` plotting `embedding_2d[0]` vs `embedding_2d[1]`; points coloured by `cluster_name`; toggle to show cluster centroids instead of individual videos |
| `ClusterStats` | Table showing per-cluster video count, average views, centroid coordinates, and Euclidean distances between centroids |
| `Table` | Sortable and filterable table of individual videos; columns: title, channel, cluster, views, link |
| `ErrorBoundary` | Top-level React error boundary |

`App.jsx` orchestrates state: the full dataset, the selected channel, loading/error states, and derived filtered views passed to each component.

### Running locally

```bash
cd webapp
npm install
# Place data.json in webapp/public/
npm run dev
```

The dev server starts at `http://localhost:5173` by default (Vite).

```bash
npm run build    # production build → webapp/dist/
npm run preview  # preview the production build locally
npm run lint     # ESLint
```

### Deployment

The app is deployed to **Netlify**. The `netlify.toml` at the repository root configures:

- Build base: `webapp/`
- Publish directory: `dist/`
- Build command: `npm install && npm run build`

Branch deploys are disabled. Promote a production deploy by pushing to the default branch.

---

## Predikto

`src/Predikto/` contains two utility notebooks:

| Notebook | Purpose |
|---|---|
| `Download-InfluxDB-Raw.ipynb` | Downloads raw time-series data from InfluxDB |
| `Fetch-Ingested-Videos.ipynb` | Fetches ingested video records for downstream use |

Schema references are in `docs/Finder/` and `docs/Predikto/`.

---

## Coding guidelines

The following conventions apply to all Graphiko notebooks. See `docs/Graphiko/coding_guidelines.md` for the canonical source.

- **Use channel names as display labels.** Store `channel_name` as the primary label in all outputs; use `channel_id` only as secondary metadata.
- **Resolve labels once.** Build a single `channel_id → channel_name` map per run. Append `(<channel_id>)` only when duplicate names exist.
- **Propagate labeled artifacts downstream.** Write labeled adjacency matrices and a label-mapping artifact; downstream notebooks should prefer labeled artifacts.
- **Keep schema explicit.** Use unambiguous column names: `source_channel_name`, `target_channel_name`, `channel_name`. Avoid `node_id` when values are not IDs.
- **Document every code cell.** Precede every code cell with a markdown paragraph describing intent and outputs — not just function names.

---

## Agent context

This section is written for intelligent agents continuing development on this codebase.

### Key invariants

1. The `graphiko.adjacency v1.0.0` schema **must not change** without bumping `schema_version`. Consumers load `metadata.json` to interpret edge weights; breaking the schema silently corrupts downstream analysis.
2. Both graph matrices are **row-stochastic** with a zero diagonal. Any notebook that writes a new adjacency matrix must preserve this property.
3. The residual convention `R = subscriptions − embeddings` is **fixed**. Changing the sign convention breaks the interpretation of positive/negative residual edges across all downstream dashboards.
4. The web app JSON schema is a **stable contract**. Both `view_count` (snake_case) and `viewCount` (camelCase) must be present in every record emitted by `category_quantization.ipynb`.

### Extending the pipeline

- **Adding a new graph kind**: create a new notebook that writes to a new Drive path, uses the `graphiko.adjacency` schema with a new `graph_kind` string registered in `metadata.json`, and document the path in `Development.md`.
- **Adding a new analysis notebook**: read from `latest/` paths; emit outputs to a timestamped run directory with a stable `latest/` mirror; write a `run_summary.json` that records all input paths so downstream notebooks can chain from it.
- **Extending the web app**: add new components under `webapp/src/components/`. Data is loaded once in `App.jsx` and passed as props. To add new fields to the data contract, update `category_quantization.ipynb` to emit them and update this README.

### Where things break

- **Node-universe mismatch**: `graph_similarity_analysis.ipynb` requires at least 3 shared nodes between the two matrices. If a graph is rebuilt with a newer cluster snapshot and the other is stale, the intersection may be too small.
- **Missing `data.json`**: the web app shows a "Failed to load data" error if `/data.json` is absent at the serve root. For Netlify, this file must be included in the build artifact.
- **Pinecone namespace drift**: `Fetch-Business-Cluster-Videos.ipynb` and `Embeddings-Graph.ipynb` both write to Pinecone. If namespaces are renamed, both notebooks must be updated together.
