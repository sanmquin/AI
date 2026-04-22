# Graphiko Coding Guidelines

## Use canonical display labels in analysis outputs
- When analytics are consumed by humans (tables, plots, CSV exports), store and display channel **names** rather than opaque channel IDs.
- If IDs are needed for lineage/debugging, store them as secondary metadata columns (`channel_id`) and keep `channel_name` as the primary label.

## Resolve labels once and apply consistently
- Build a single `channel_id -> channel_name` map once per run.
- Ensure labels are unique and deterministic (for example, append `(<channel_id>)` only when duplicate names appear).
- Apply the same ordered labels to every aligned matrix before computing downstream artifacts.

## Propagate labeled artifacts downstream
- Write labeled adjacency matrices and a label mapping artifact in the similarity-analysis run outputs.
- Downstream notebooks (for example residual disagreement analysis) should prefer those labeled artifacts, and only fall back to raw ID matrices when required.

## Keep schema explicit in output tables
- Use unambiguous column names like `source_channel_name`, `target_channel_name`, and `channel_name`.
- Avoid ambiguous names such as `node_id` when the values are not IDs.

## Documentation expectations for notebooks
- Every code cell must be preceded by a short markdown paragraph explaining what the code is about to do.
- The explanation should describe intent and outputs, not just restate function names.
