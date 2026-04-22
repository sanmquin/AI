# Fetch business-cluster videos: reduced embedding export

Notebook: `src/Graphiko/Fetch-Business-Cluster-Videos.ipynb`

## Current notebook scope

The notebook is now intentionally simplified:

1. Discover the latest `business*` cluster and fetch its channels/videos.
2. Build or fetch video-title embeddings from Pinecone (`finder` / `VideoTitles`).
3. Reduce video embeddings to **20 dimensions** using PCA over the full embedded video set in the run.
4. Export a single artifact table (no correlation/cluster analysis).

## Export artifact path

The notebook writes the CSV to:

- `/content/drive/MyDrive/Graphiko/exports/video_embeddings_reduced/latest/business_cluster_video_embeddings_reduced_20d.csv`

## Export schema

The CSV contains:

- Video identifiers and metadata:
  - `video_id`
  - `channel_id`
  - `video_title`
- Engagement metrics:
  - `view_count`
  - `like_count`
  - `comment_count`
- Date fields:
  - `date_created_1` (from `createdAt`, fallback `created_at`)
  - `date_created_2` (from `dateCreated`, fallback `insertedAt`)
  - `date_published` (from `publishedAt`)
- Reduced embedding columns:
  - `embedding_reduced_01` ... `embedding_reduced_20`

If fewer than 20 PCA components are possible (very small sample), remaining reduced columns are included and filled with `NaN` to preserve a stable 20-column embedding schema.
