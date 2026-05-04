# Semantic Engagement Analysis Artifacts

Web-app contract (no notebook inspection required).

## 1) Semantic engagement bundle

Source notebook: `src/Graphiko/4.Semantic-Engagement.ipynb`

Output file (single export):

- `/content/drive/MyDrive/Graphiko/analysis/semantic_engagement/latest/semantic_engagement_bundle.json`

Top-level object:

- `schema_version: "1.0.0"`
- `artifacts.channel_engagement_metrics: object[]`
- `artifacts.channel_engagement_centers: object[]`
- `artifacts.channel_gradients: object[]`
- `interfaces: object`
- `run_summary: object`

Key interfaces:

- `artifacts.channel_engagement_metrics[]`:
  - `channel_name` (string)
  - `n_videos` (number)
  - `predictability_r2` (number): Adjusted R-squared for predicting engagement from distance to optimal center
  - `distance_coef` (number)
  - `p_value` (number)
  - `gradient_magnitude` (number, optional)
  - `normality_shapiro_w` (number, optional)
  - `gradient_magnitude_normalized` (number, optional): Normalized gradient magnitude on [0, 1] scale

- `artifacts.channel_engagement_centers[]`:
  - `channel_name` (string)
  - `engagement_center_20d` (number[20]): The learned 20D engagement center

- `artifacts.channel_gradients[]`:
  - `channel_name` (string)
  - `gradient_20d` (number[20]): The 20D semantic gradient vector representing optimal engagement direction
