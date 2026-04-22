#!/usr/bin/env python3
"""Compare semantic-embedding and subscription graphs quantitatively and visually.

This module measures how similar two weighted graphs are when both graphs share a
node set (e.g., channels/owners). It is designed for the exact scenario described
in this repository README:

1) A semantic embedding distance/similarity matrix.
2) A subscription-overlap graph / normalized distance matrix.

The implementation intentionally combines *multiple* graph-comparison views, because
no single metric captures all aspects of graph structure.

Scientific foundations referenced in this code:

- Mantel, N. (1967). The detection of disease clustering and a generalized
  regression approach. "Cancer Research".
  -> Basis for Mantel test on matrix correlation under permutation.

- Krackhardt, D. (1987). QAP partialling as a test of spuriousness.
  "Social Networks".
  -> Basis for QAP-style permutation tests for network matrix correlation.

- Borgatti, S. P., Everett, M. G., & Johnson, J. C. (2018).
  "Analyzing Social Networks" (2nd ed.).
  -> Practical interpretation of matrix correlations and network comparison.

- Schieber, T. A., et al. (2017). Quantification of network structural
  dissimilarities. "Nature Communications".
  -> Motivates use of complementary structural dissimilarity measures.

Usage example
-------------
python src/analysis/graph_similarity_analysis.py \
  --embeddings path/to/embedding_matrix.csv \
  --subscriptions path/to/subscription_matrix.csv \
  --output-dir outputs/graph_similarity

Expected input format
---------------------
Both CSVs should be square matrices with row/column labels identifying nodes.
First column may be an index column (recommended). Example:

,nodeA,nodeB,nodeC
nodeA,0.0,0.2,0.7
nodeB,0.2,0.0,0.5
nodeC,0.7,0.5,0.0

If your matrix stores distances (larger = less similar), pass
--distance-to-similarity so the script converts them to similarities.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.spatial.distance import cosine
from scipy.stats import pearsonr, spearmanr


# ----------------------------
# Data classes and core config
# ----------------------------


@dataclass
class SimilarityResult:
    """Container for all numeric outputs from the comparison pipeline."""

    n_nodes: int
    n_pairs: int
    pearson_r: float
    pearson_p: float
    spearman_rho: float
    spearman_p: float
    cosine_similarity: float
    rmse: float
    mae: float
    edge_jaccard: float
    mantel_r: float
    mantel_p: float
    qap_r: float
    qap_p: float


# ----------------------------
# Matrix utility functions
# ----------------------------


def load_square_matrix(csv_path: Path) -> pd.DataFrame:
    """Load a labeled square matrix from CSV and enforce basic validity checks.

    Parameters
    ----------
    csv_path:
        Path to the input CSV.

    Returns
    -------
    pd.DataFrame
        Square matrix with aligned index/columns.
    """

    df = pd.read_csv(csv_path, index_col=0)

    if df.shape[0] != df.shape[1]:
        raise ValueError(f"Matrix at {csv_path} is not square: {df.shape}")

    # Enforce same labels on rows and columns (order may differ and is handled later).
    row_labels = set(map(str, df.index))
    col_labels = set(map(str, df.columns))
    if row_labels != col_labels:
        raise ValueError(
            f"Row/column label mismatch in {csv_path}. "
            f"Rows={len(row_labels)} unique, Cols={len(col_labels)} unique"
        )

    # Normalize to string labels for robust joins.
    df.index = df.index.map(str)
    df.columns = df.columns.map(str)

    # Convert all values to numeric; fail fast if parsing is impossible.
    df = df.apply(pd.to_numeric, errors="raise")

    return df


def align_matrices(a: pd.DataFrame, b: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Restrict and reorder two matrices to their shared node intersection."""

    common = sorted(set(a.index).intersection(b.index))
    if len(common) < 3:
        raise ValueError(
            "Need at least 3 shared nodes between matrices to compute robust "
            "similarity statistics."
        )

    return a.loc[common, common], b.loc[common, common]


def minmax_normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Scale all matrix entries to [0, 1] globally.

    Global scaling supports direct comparison between matrices originating from
    different pipelines (e.g., cosine distances vs overlap-derived distances).
    """

    arr = df.to_numpy(dtype=float)
    v_min = np.nanmin(arr)
    v_max = np.nanmax(arr)
    if np.isclose(v_min, v_max):
        return pd.DataFrame(np.zeros_like(arr), index=df.index, columns=df.columns)
    scaled = (arr - v_min) / (v_max - v_min)
    return pd.DataFrame(scaled, index=df.index, columns=df.columns)


def distances_to_similarity(df: pd.DataFrame) -> pd.DataFrame:
    """Convert a normalized distance matrix to similarity via (1 - d)."""

    # We first min-max normalize to keep this conversion meaningful if raw scale differs.
    d = minmax_normalize(df)
    return 1.0 - d


def upper_triangle_vector(df: pd.DataFrame, include_diagonal: bool = False) -> np.ndarray:
    """Extract upper-triangle values as a 1D vector for matrix-correlation tests."""

    arr = df.to_numpy(dtype=float)
    k = 0 if include_diagonal else 1
    tri = np.triu_indices_from(arr, k=k)
    return arr[tri]


# ----------------------------
# Statistical tests
# ----------------------------


def mantel_test(
    a: pd.DataFrame,
    b: pd.DataFrame,
    permutations: int = 2000,
    random_state: int = 42,
) -> Tuple[float, float]:
    """Compute Mantel correlation with permutation p-value.

    This implementation correlates vectorized upper triangles (excluding diagonal)
    and builds a null distribution by jointly permuting rows/columns of one matrix.
    """

    rng = np.random.default_rng(random_state)
    a_vec = upper_triangle_vector(a)
    b_vec = upper_triangle_vector(b)
    obs_r, _ = pearsonr(a_vec, b_vec)

    n = a.shape[0]
    perm_stats = np.empty(permutations, dtype=float)

    b_arr = b.to_numpy(dtype=float)
    for i in range(permutations):
        p = rng.permutation(n)
        b_perm = b_arr[np.ix_(p, p)]
        b_perm_vec = upper_triangle_vector(pd.DataFrame(b_perm))
        perm_stats[i], _ = pearsonr(a_vec, b_perm_vec)

    # Two-sided p-value with +1 correction to avoid zero p-values.
    p_value = (np.sum(np.abs(perm_stats) >= np.abs(obs_r)) + 1) / (permutations + 1)
    return float(obs_r), float(p_value)


def qap_correlation(
    a: pd.DataFrame,
    b: pd.DataFrame,
    permutations: int = 2000,
    random_state: int = 7,
) -> Tuple[float, float]:
    """Compute QAP-style matrix correlation and permutation significance.

    QAP (Quadratic Assignment Procedure) is widely used in social-network analysis
    to test dyadic matrix associations while respecting network dependencies.
    """

    rng = np.random.default_rng(random_state)
    a_vec = upper_triangle_vector(a)
    b_vec = upper_triangle_vector(b)
    obs_r, _ = pearsonr(a_vec, b_vec)

    n = a.shape[0]
    b_arr = b.to_numpy(dtype=float)
    perm_stats = np.empty(permutations, dtype=float)

    for i in range(permutations):
        p = rng.permutation(n)
        b_perm = b_arr[np.ix_(p, p)]
        b_perm_vec = upper_triangle_vector(pd.DataFrame(b_perm))
        perm_stats[i], _ = pearsonr(a_vec, b_perm_vec)

    # One-sided p-value for positive association; adapt if you need two-sided.
    p_value = (np.sum(perm_stats >= obs_r) + 1) / (permutations + 1)
    return float(obs_r), float(p_value)


# ----------------------------
# Main comparison pipeline
# ----------------------------


def compute_similarity_metrics(
    embeddings_matrix: pd.DataFrame,
    subscriptions_matrix: pd.DataFrame,
    edge_threshold: float,
    permutations: int,
) -> SimilarityResult:
    """Compute a suite of similarity metrics between two aligned matrices."""

    emb_vec = upper_triangle_vector(embeddings_matrix)
    sub_vec = upper_triangle_vector(subscriptions_matrix)

    pear_r, pear_p = pearsonr(emb_vec, sub_vec)
    spr_rho, spr_p = spearmanr(emb_vec, sub_vec)

    # scipy.spatial.distance.cosine returns a distance, so we invert to get similarity.
    cos_sim = 1.0 - cosine(emb_vec, sub_vec)

    rmse = float(np.sqrt(np.mean((emb_vec - sub_vec) ** 2)))
    mae = float(np.mean(np.abs(emb_vec - sub_vec)))

    emb_edge = emb_vec >= edge_threshold
    sub_edge = sub_vec >= edge_threshold
    intersection = np.logical_and(emb_edge, sub_edge).sum()
    union = np.logical_or(emb_edge, sub_edge).sum()
    edge_jaccard = float(intersection / union) if union > 0 else float("nan")

    mantel_r, mantel_p = mantel_test(embeddings_matrix, subscriptions_matrix, permutations)
    qap_r, qap_p = qap_correlation(embeddings_matrix, subscriptions_matrix, permutations)

    return SimilarityResult(
        n_nodes=embeddings_matrix.shape[0],
        n_pairs=emb_vec.size,
        pearson_r=float(pear_r),
        pearson_p=float(pear_p),
        spearman_rho=float(spr_rho),
        spearman_p=float(spr_p),
        cosine_similarity=float(cos_sim),
        rmse=rmse,
        mae=mae,
        edge_jaccard=edge_jaccard,
        mantel_r=mantel_r,
        mantel_p=mantel_p,
        qap_r=qap_r,
        qap_p=qap_p,
    )


def save_visualizations(
    embeddings_matrix: pd.DataFrame,
    subscriptions_matrix: pd.DataFrame,
    output_dir: Path,
) -> Dict[str, str]:
    """Generate and save comparison plots.

    Returns a dict mapping figure purpose to output file path (as string).
    """

    output_dir.mkdir(parents=True, exist_ok=True)
    out_paths: Dict[str, str] = {}

    # 1) Side-by-side heatmaps for instant qualitative pattern comparison.
    fig, axes = plt.subplots(1, 2, figsize=(14, 6), constrained_layout=True)
    sns.heatmap(embeddings_matrix, cmap="viridis", ax=axes[0], cbar=True)
    axes[0].set_title("Embeddings Graph (normalized)")
    sns.heatmap(subscriptions_matrix, cmap="viridis", ax=axes[1], cbar=True)
    axes[1].set_title("Subscriptions Graph (normalized)")
    heatmap_path = output_dir / "heatmaps_side_by_side.png"
    fig.savefig(heatmap_path, dpi=220)
    plt.close(fig)
    out_paths["heatmaps"] = str(heatmap_path)

    # 2) Difference heatmap (embeddings - subscriptions).
    diff = embeddings_matrix - subscriptions_matrix
    fig, ax = plt.subplots(figsize=(7, 6), constrained_layout=True)
    sns.heatmap(diff, cmap="coolwarm", center=0.0, ax=ax)
    ax.set_title("Difference Matrix (Embeddings - Subscriptions)")
    diff_path = output_dir / "difference_heatmap.png"
    fig.savefig(diff_path, dpi=220)
    plt.close(fig)
    out_paths["difference_heatmap"] = str(diff_path)

    # 3) Pairwise scatter to expose linear/nonlinear relation between edge weights.
    emb_vec = upper_triangle_vector(embeddings_matrix)
    sub_vec = upper_triangle_vector(subscriptions_matrix)
    fig, ax = plt.subplots(figsize=(7, 6), constrained_layout=True)
    sns.regplot(x=emb_vec, y=sub_vec, scatter_kws={"alpha": 0.45, "s": 18}, ax=ax)
    ax.set_xlabel("Embeddings edge weight")
    ax.set_ylabel("Subscriptions edge weight")
    ax.set_title("Edge-wise relationship between graphs")
    scatter_path = output_dir / "edge_weight_scatter.png"
    fig.savefig(scatter_path, dpi=220)
    plt.close(fig)
    out_paths["scatter"] = str(scatter_path)

    return out_paths


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--embeddings", type=Path, required=True, help="CSV matrix for embeddings graph")
    parser.add_argument("--subscriptions", type=Path, required=True, help="CSV matrix for subscriptions graph")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("outputs/graph_similarity"),
        help="Directory where numeric outputs and plots are stored",
    )
    parser.add_argument(
        "--distance-to-similarity",
        action="store_true",
        help=(
            "Treat both input matrices as distances and convert to similarities via 1-d "
            "after min-max normalization."
        ),
    )
    parser.add_argument(
        "--edge-threshold",
        type=float,
        default=0.7,
        help="Threshold on normalized edge weight for binary edge-overlap Jaccard",
    )
    parser.add_argument(
        "--permutations",
        type=int,
        default=2000,
        help="Number of permutations for Mantel and QAP tests",
    )
    return parser.parse_args()


def main() -> None:
    """Execute end-to-end graph similarity analysis."""

    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    emb_raw = load_square_matrix(args.embeddings)
    sub_raw = load_square_matrix(args.subscriptions)

    emb_aligned, sub_aligned = align_matrices(emb_raw, sub_raw)

    if args.distance_to_similarity:
        emb_norm = distances_to_similarity(emb_aligned)
        sub_norm = distances_to_similarity(sub_aligned)
    else:
        emb_norm = minmax_normalize(emb_aligned)
        sub_norm = minmax_normalize(sub_aligned)

    result = compute_similarity_metrics(
        emb_norm,
        sub_norm,
        edge_threshold=args.edge_threshold,
        permutations=args.permutations,
    )

    # Persist metrics in machine- and human-friendly formats.
    metrics_dict = result.__dict__
    metrics_json_path = args.output_dir / "similarity_metrics.json"
    metrics_csv_path = args.output_dir / "similarity_metrics.csv"

    with metrics_json_path.open("w", encoding="utf-8") as f:
        json.dump(metrics_dict, f, indent=2)

    pd.DataFrame([metrics_dict]).to_csv(metrics_csv_path, index=False)

    plot_paths = save_visualizations(emb_norm, sub_norm, args.output_dir)

    summary = {
        "inputs": {
            "embeddings": str(args.embeddings),
            "subscriptions": str(args.subscriptions),
            "distance_to_similarity": args.distance_to_similarity,
        },
        "metrics_json": str(metrics_json_path),
        "metrics_csv": str(metrics_csv_path),
        "plots": plot_paths,
    }

    summary_path = args.output_dir / "run_summary.json"
    with summary_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("Graph similarity analysis complete.")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
