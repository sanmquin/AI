# Research workflows

This directory contains root-level research notebooks that extend the Graphiko pipeline without changing the production web application.

## Semantic description ↔ point-cloud alignment

Notebook: [`semantic_description_pointcloud_alignment.ipynb`](semantic_description_pointcloud_alignment.ipynb)

This Colab-first notebook evaluates whether LLM-generated channel descriptions preserve the geometry of 20D video-title embedding point clouds.

The workflow:

1. Loads the upstream 20D video embedding artifact first from Google Drive.
2. Uses the Google Colab native Gemini integration (`google.colab.ai`) to generate one cached description per channel and an overall corpus description. No API key is required in Colab.
3. Compares relative channel distances between generated descriptions and video point clouds with multiple metrics.
4. Chunks descriptions into reusable semantic segments, then compares point-cloud volume, overlap, and concentration against segment-embedding shape measures.
5. Measures whether semantically central description segments appear earlier in each channel description.

### Expected Google Drive inputs

The notebook looks for the canonical 20D video embedding export first:

```text
/content/drive/MyDrive/Graphiko/exports/video_embeddings_reduced/latest/business_cluster_video_embeddings_reduced_20d.csv
```

If that file is absent, it falls back to the optimized clustering bundle when available:

```text
/content/drive/MyDrive/Graphiko/exports/video_embeddings_clustered/optimized/business_cluster_video_embeddings_channel_optimized_bundle.json
```

### Output layout in Drive

All generated research artifacts are written below:

```text
/content/drive/MyDrive/Graphiko/research/semantic_description_pointcloud_alignment/
```

Important subdirectories:

- `descriptions/by_channel/` — cached Gemini descriptions, one JSON file per channel.
- `descriptions/overall/` — cached cross-channel synthesis.
- `segments/by_channel/` — cached semantic description chunks.
- `results/latest/tables/` — distance matrices, alignment summaries, shape summaries, and centrality summaries.
- `results/latest/plots/` — heatmaps and scatter/distribution plots.
- `results/latest/manifest.json` — run metadata and artifact inventory.

### Reuse and skip behavior

The notebook checks Drive before every LLM-generation step. Existing channel descriptions, overall descriptions, and semantic segments are reused automatically so metric changes can be rerun without paying the LLM cost again.
