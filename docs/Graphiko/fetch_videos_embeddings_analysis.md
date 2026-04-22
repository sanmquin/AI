# Fetch videos embeddings analysis (business cluster)

Notebook: `src/Graphiko/Fetch-Business-Cluster-Videos.ipynb`

## What the notebook now does

1. Connects to MongoDB (`finder`) and discovers the latest `business*` channel-description cluster.
2. Fetches cluster channels and videos.
3. Connects to Pinecone index `finder`.
4. Reuses the **fetch-or-embed** pattern for:
   - `ChannelDescriptions` namespace (channel descriptions)
   - `VideoTitles` namespace (video titles)
5. Computes cosine distance per video title to its channel description embedding.
6. Computes per-channel summary metrics and correlations of `distance` vs `viewCount`.
7. Saves artifacts to Google Drive.

## Drive artifacts

Artifacts are written to:

- `/content/drive/MyDrive/Graphiko/analysis/video_title_to_channel_description_distance/latest/video_distances.csv`
- `/content/drive/MyDrive/Graphiko/analysis/video_title_to_channel_description_distance/latest/channel_correlations.csv`
- `/content/drive/MyDrive/Graphiko/analysis/video_title_to_channel_description_distance/latest/summary.json`

## Documentation gaps identified in this repo

The following details were previously missing or scattered:

1. **Pinecone namespace convention for this workflow**
   - This notebook requires both `ChannelDescriptions` and `VideoTitles` namespaces in the `finder` index.
2. **Reusable fetch-or-embed contract**
   - Expected behavior (fetch existing vectors first, embed only missing ids, then upsert) was not documented in one place for re-use across notebooks.
3. **Output artifact schema for video-distance analysis**
   - The output CSV and summary JSON columns/paths were not previously listed in project docs.
4. **Interpretation guidance for channel-level correlations**
   - How to interpret negative/positive `distance vs viewCount` correlations by channel was not documented.

## Interpretation guidance

- Lower cosine distance = video title is more semantically aligned with the channel description.
- Negative correlation (`distance` vs `viewCount`) indicates more aligned titles are associated with higher views.
- Positive correlation indicates less aligned titles are associated with higher views.
- Near-zero correlation indicates weak or no monotonic relationship in that channel.
