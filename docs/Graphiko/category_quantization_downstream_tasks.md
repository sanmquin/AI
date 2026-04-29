# Category Quantization Downstream Tasks Design

This document details the design of three downstream tasks following the category quantization notebook. These tasks aim to evaluate the predictive power of the semantic clusters, visualize channel relationships in different spaces, and unify these modalities into a comprehensive performance model.

## Data Gathering

To execute these tasks, the following artifacts from the Graphiko pipeline will be utilized. These are located in the shared Google Drive mounted at `/content/drive/MyDrive/`.

1.  **Video Embeddings and Engagement Data:**
    *   **Source:** `/content/drive/MyDrive/Graphiko/exports/video_embeddings_reduced/latest/business_cluster_video_embeddings_reduced_20d.csv`
    *   **Description:** Contains video metadata (`video_id`, `channel_name`, `video_title`), engagement metrics (`view_count`, `like_count`, `comment_count`), and 20D reduced embeddings.
2.  **Semantic Distance Graph:**
    *   **Source:** `/content/drive/MyDrive/Graphiko/graphs/embeddings_distance/latest/adjacency_matrix.csv`
    *   **Description:** Adjacency matrix representing the semantic distance between channels based on textual descriptions (row-sum normalized).
3.  **Topological (Subscriptions) Distance Graph:**
    *   **Source:** `/content/drive/MyDrive/Graphiko/graphs/subscriptions_normalized_distance/latest/adjacency_matrix.csv`
    *   **Description:** Adjacency matrix representing the topological distance between channels based on shared subscription owners (audience overlap, row-sum normalized).

*Note: For analysis, you may also utilize the per-channel clustered output produced by the category quantization notebook (e.g., `business_cluster_video_embeddings_clustered_2d.json`) or re-run the k-means clustering dynamically as shown in `category_quantization.ipynb`.*

---

## Task 1: Performance Measurement

**Goal:** Determine how informative the semantic space (clusters/polygons) is in predicting the performance (views) of a given video within a channel.

### Analysis (Code)
1.  **Data Preparation:** Load the video dataset and run the per-channel k-means clustering (as in the category quantization notebook) to assign a `cluster_id` to each video.
2.  **Transformation:** Compute the log-transformed views: `log_views = log(view_count + 1)` to handle right-skewed engagement distributions.
3.  **Modeling:** Fit an Ordinary Least Squares (OLS) regression or ANOVA model per channel, predicting `log_views` using the categorical `cluster_id` as the independent variable.
4.  **Evaluation:** Extract the R-squared ($R^2$) value and the F-statistic p-value to measure the variance explained by the semantic clusters.

### Visualization
*   **Distribution Boxplots:** A set of boxplots for a selected channel where the x-axis represents the `cluster_name` (or ID) and the y-axis represents the `log_views`. This visually demonstrates the performance variation across different semantic topics.
*   **Performance Scatter:** A 2D PCA scatter plot of the channel's videos (similar to the category quantization visualization), but with the point size scaled proportionally to the video's `view_count`.

### Testable Hypothesis
*   $H_1$: The semantic cluster assignment of a video explains a statistically significant portion of the variance in its view count (ANOVA p-value < 0.05).
*   **Results Reporting:** Report the distribution of $R^2$ values across all channels and the percentage of channels where the semantic clusters are a significant predictor of performance.

---

## Task 2: Subscription Topology

**Goal:** For a given set of clusters (a channel/polygon) in a specific category, visually represent its approximate semantic distance and topological (subscription) distance relative to other channels.

### Analysis (Code)
1.  **Graph Alignment:** Load both the embeddings and subscriptions adjacency matrices. Align them to ensure they share the same sorted node (channel) order.
2.  **Distance Extraction:** For a selected "target" channel, extract its outbound distance vector from both matrices (representing its distance to all other channels).
3.  **Transformation for Visualization:** Convert distances to similarities ($similarity = 1 - normalized\_distance$) if necessary to emphasize closeness, and optionally apply min-max scaling for visual comparability.

### Visualization
*   **Two Separate Charts (Semantic vs. Topological):**
    *   Create a horizontal bar chart showing the target channel's similarity to its top $N$ closest neighbors in the **Semantic** space.
    *   Create a second horizontal bar chart showing the target channel's similarity to its top $N$ closest neighbors in the **Topological** (Subscriptions) space.
    *   *Alternative:* Use two separate network ego-graphs (force-directed layouts) centered on the target channel, where edge length/thickness represents similarity in the respective space.

### Testable Hypothesis
*   $H_1$: The rank ordering of neighboring channels in the semantic space is systematically different from the rank ordering in the subscription topology space (measured via Spearman rank correlation on the target channel's distance vectors).
*   **Results Reporting:** Report the pair-level rank correlation (Spearman's $\rho$) between the semantic and topological distance vectors for the target channel.

---

## Task 3: Bring Them Together

**Goal:** Design a unified feature and model where video performance can be measured and correlated with both its local semantic modality (within-channel cluster) and its global topological modality (channel-level subscription network position).

### Analysis (Code)
1.  **Feature Engineering:**
    *   *Semantic Feature:* For each video, use its local `cluster_id` or compute its Euclidean distance to its cluster centroid.
    *   *Topological Feature:* Calculate a network centrality metric (e.g., PageRank or out-degree centrality) for the video's parent channel using the subscriptions adjacency matrix.
2.  **Data Merging:** Combine the video-level data (views, semantic features) with the channel-level topological features.
3.  **Combined Modeling:** Fit a mixed-effects regression model (or a multiple regression) across the entire dataset:
    $log\_views \sim \beta_0 + \beta_1(Semantic\_Distance) + \beta_2(Topological\_Centrality) + \epsilon$

### Visualization
*   **Unified Multi-modal Bubble Chart:**
    *   **X-axis:** Semantic Modality (e.g., distance to cluster centroid, representing content typicality).
    *   **Y-axis:** Topological Modality (e.g., channel subscription centrality).
    *   **Bubble Size:** Performance metric (`view_count`).
    *   **Color:** Channel or Category.
    *   This chart maps how typical/atypical content performs across structurally central vs. peripheral channels.

### Testable Hypothesis
*   $H_1$: A predictive model incorporating both local semantic features and global topological features significantly outperforms a model using either modality in isolation.
*   **Results Reporting:** Compare the Akaike Information Criterion (AIC) or Cross-Validated Mean Squared Error (MSE) of the combined model against the separate baseline models (semantic-only and topological-only).
