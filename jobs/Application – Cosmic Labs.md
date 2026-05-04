# Application — Cosmic Labs
## Research Engineer – AI/ML

**To:** [team@cosmiclabs.io](mailto:team@cosmiclabs.io)
**Subject:** Research Engineer – AI/ML | Application

---

### 1. Name

Santiago Marquínez

---

### 2. Why this role and why Cosmic Labs

Cosmic Labs is solving the hardest version of the observability problem: not software metrics in a managed cloud, but raw physical machines — GPUs, InfiniBand fabrics, bare-metal nodes — that have no runtime to introspect them. The engineering challenge is exceptional, but what makes it genuinely interesting from a research perspective is the failure-prediction problem. Hardware failures are rare, heterogeneous, and causally entangled with topology (which node is connected to which, at what bandwidth, under what thermal load). That is exactly the class of problem I have been working on: predicting structured outcomes over entities whose relational structure matters as much as their individual features.

The Research Engineer – AI/ML role sits at the centre of that. Probabilistic forecasting, survival analysis, and calibrated failure models are the tools I want to build and deploy in a production context. Cosmic Labs is one of the few places where those models have direct, measurable consequences at hardware scale.

---

### 3. What I bring technically

#### Multi-view representation learning and graph-based prediction

The core research project in this repository — **Graphiko** — is a direct application of multi-view representation learning to relational prediction. The system builds two independently derived graphs over the same set of entities (YouTube channels in a business cluster): one from **content semantics** (PCA-reduced `multilingual-e5-large` embeddings from Pinecone, pairwise Euclidean distances, row-stochastic normalisation) and one from **audience behaviour** (shared-subscriber overlap matrices from MongoDB, inverse-distance normalisation). Comparing the two graphs rigorously — using Pearson r, Spearman ρ, cosine similarity, RMSE/MAE, edge Jaccard, Mantel permutation tests, and QAP-style permutation tests — is the empirical foundation for testing whether semantic space alone is sufficient for value prediction or whether the relational topology adds explanatory power.

This is precisely the inference pattern that hardware failure prediction requires: sensor telemetry encodes one view; the physical and network topology of the cluster (which nodes share a fabric, which are co-located, which share a job queue) encodes another. Fusing those views — knowing when they agree, when they conflict, and which direction of disagreement predicts failure — is the right framing for building calibrated probabilistic models.

#### Probabilistic and geometric modelling

The research problem formalised in `Research.md` — **Topology-Induced Anisotropic Prediction in Semantic Spaces** — is about understanding why value prediction fails uniformly: two items equally distant from a category optimum exhibit different observed values, and the hypothesis is that the preferred and penalised directions in semantic space are aligned with the inter-category relational graph. This is a rigorous formulation of anisotropic prediction. Translating that lens to hardware: two nodes equally distant from a cluster's average telemetry signature may have different failure rates, and the network topology (latency, hop count, shared fabric segment) may explain which direction is safe and which is not. The modelling approach — decomposing residuals directionally, separating what the semantic/feature view explains from what the topology explains — is transferable directly.

The `residual_disagreement_analysis.ipynb` notebook implements this decomposition: it computes directed residuals `R = subscriptions − embeddings` and decomposes disagreement at pair, node, and meso levels, generating artifact contracts (`similarity_output_artifacts.md`) that downstream dashboards consume. Building a failure-prediction analogue — directed residuals between sensor-predicted and topology-predicted failure risk — is a natural next step.

#### MLOps, data engineering, and production pipelines

The pipeline is built for reproducibility and downstream consumption: versioned schema exports (`graphiko.adjacency v1.0.0`), stable `latest/` symlinks alongside timestamped versioned directories, `run_summary.json` provenance files that allow downstream notebooks to chain from the correct inputs, and an explicit data contract between the analytics pipeline and the React web application. Data sources span MongoDB (subscriptions, channel metadata, cluster membership), Pinecone (vector store for channel-description and video-title embeddings), InfluxDB (raw time-series ingestion in the Predikto module), and Google Drive as the artifact store for a Colab-based pipeline.

For Cosmic Labs, the equivalent is telemetry pipelines from GPU clusters and network fabrics into a model serving layer that produces calibrated predictions — the same pattern of ingestion, feature construction, versioned model artifacts, and stable serving contracts.

#### Full-stack and real-time systems

The `webapp/` is a production React + Vite application deployed to Netlify that visualises per-channel video clustering: 2D scatter plots of embedding space, per-cluster statistics (centroid coordinates, Euclidean distances, average engagement), and a sortable/filterable video table. It is built to a stable data contract (`data.json` schema with both `view_count` and `viewCount` fields for backward compatibility) and is the delivery surface for the research outputs. This is relevant to Spades — a hardware-aware desktop environment that must present real-time device state to engineers in a legible form. Building interactive, data-dense interfaces over live telemetry is something I have done end-to-end.

---

### 4. Soonest available start date

Immediately.

---

### 5. GitHub profile

[github.com/sanmquin](https://github.com/sanmquin)

---

### 6. U.S. work authorization

Yes — I confirm I am authorised to work in the United States.

---

### 7. In-person, San Francisco

Yes — I confirm I am willing and able to work full-time, in-person in San Francisco.

---

*PDF resume attached.*
