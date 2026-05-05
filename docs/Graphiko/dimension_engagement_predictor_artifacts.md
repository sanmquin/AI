# Dimension Engagement Predictor Artifacts

Web-app contract (no notebook inspection required).

## 1) Dimension engagement models bundle

Source notebook: `src/Graphiko/5.Dimension-Engagement-Predictor.ipynb`

Output file (single export):

- `/content/drive/MyDrive/Graphiko/analysis/dimension_engagement_predictor/latest/dimension_engagement_models.json`

Top-level object:

- `schema_version: "1.0.0"`
- `artifacts.global_model: object[]`
- `artifacts.channel_models: object[]`

Key interfaces:

- `artifacts.global_model[]` and `artifacts.channel_models[]`:
  - `channel_name` (string): 'Global' for the global model, or the specific channel's name for per-channel models.
  - `dimension` (string): The dimension identifier (e.g., 'embedding_reduced_01').
  - `dimension_index` (number): The 0-based index of the dimension.
  - `coefficient` (number): The learned coefficient for this dimension.
  - `intercept` (number): The intercept of the linear model.
  - `p_value` (number): The p-value indicating statistical significance of the coefficient.
  - `is_significant` (boolean): Whether the p-value is below the alpha threshold (e.g., 0.05).
  - `r2_adj` (number): The adjusted R-squared value of the model.
