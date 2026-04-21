# AI

## Shared Finder subscription artifacts (Google Drive)

To make the common subscription matrix reusable across notebooks and repositories,
`Grafiko.ipynb` persists artifacts to this shared Google Drive folder:

- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/owner_overlap_matrix.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/owner_overlap_matrix.pkl`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/subscriptions_per_channel.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/normalized_distance_matrix.csv`
- `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/normalized_distance_edges.csv`

### Reuse from any notebook
1. Mount Google Drive in Colab:
   `from google.colab import drive; drive.mount('/content/drive')`
2. Read artifacts from:
   `/content/drive/MyDrive/finder_artifacts/common_subscription_matrix/`
