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

## Clustered 2D JSON export for web applications

Notebook: `src/Graphiko/category_quantization.ipynb`

After per-channel clustering, the notebook produces a web-consumable JSON file that:

- uses the original video rows,
- replaces the 20D embedding with a 2D embedding (`embedding_2d`),
- includes per-video cluster assignments (`cluster_id`, `cluster_name`), and
- carries video-level identifiers/engagement metadata required by the web app, including view counts.

JSON schema per record (stable contract):

- `channel_name` (string)
- `video_title` (string)
- `video_url` (string)
- `video_id` (string)
- `channel_id` (string)
- `view_count` (number, snake_case canonical)
- `viewCount` (number, camelCase alias for existing web-app schema compatibility)
- `cluster_id` (number)
- `cluster_name` (string)
- `embedding_2d` (`[x, y]`, number array length 2)

Output path:

- `/content/drive/MyDrive/Graphiko/exports/video_embeddings_clustered/latest/business_cluster_video_embeddings_clustered_2d.json`

Suggested web-app integration path alias (stable pointer):

- `Graphiko/exports/video_embeddings_clustered/latest/business_cluster_video_embeddings_clustered_2d.json`
