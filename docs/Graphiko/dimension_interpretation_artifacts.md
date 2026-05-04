# Dimension Interpretation Artifacts

Web-app contract for the dimension interpretations.

## 1) Dimension Interpretation Bundle

Source notebook: `src/Graphiko/6.Dimension-Interpretation.ipynb`

Output file:

- `/content/drive/MyDrive/Graphiko/analysis/dimension_interpretation/latest/dimension_interpretations.json`

Top-level object:

- `schema_version: "1.0.0"`
- `artifacts.dimension_interpretations: object[]`
- `run_summary: object`

Key interfaces:

- `artifacts.dimension_interpretations[]`:
  - `dimension_index` (number): The 0-based index of the PCA dimension (e.g., 0 for `dim_0`)
  - `dimension_name` (string): The string identifier (e.g., `"dim_0"`)
  - `definition` (string): The semantic definition derived from Gemini, mutually exclusive from previous dimensions.
  - `top_20_sample` (string[]): A list of formatted strings representing the top scoring videos.
  - `bottom_20_sample` (string[]): A list of formatted strings representing the bottom scoring videos.

- `run_summary`:
  - `model` (string): The Gemini model used for inference (e.g., "gemini-1.5-flash").
  - `dimensions_processed` (number): The number of dimensions successfully processed.
  - `timestamp` (string): ISO formatted timestamp of when the generation occurred.

## Generation Details
To avoid repetitive definitions, the script progressively feeds previously defined dimensions into the Gemini prompt context, ensuring a collectively exhaustive and mutually exclusive interpretation of the 20D PCA space.
