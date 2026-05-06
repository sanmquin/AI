# Finder — Pitch Deck
### The Intelligence Layer for the Creator Economy

---

## Slide 1 — Cover

**Finder**
*Know what content wins, before you make it.*

Seed Round — Confidential

---

## Slide 2 — The Problem

**The creator economy is a $500B market flying blind.**

YouTube alone hosts 800 million videos across 50 million active channels. Yet the tools available to creators, brands, and media companies for deciding *what to make next* are nearly a decade old — subscriber counts, trend dashboards, and gut instinct.

Three compounding failures define the status quo:

**1. Discovery is broken.**
Brand partnerships are negotiated based on follower counts, not on whether two channels genuinely share an audience. Sponsorship dollars flow to the wrong channels. Influencer marketing campaigns underperform because the audience-overlap signal is missing.

**2. Performance prediction is shallow.**
Every existing platform treats content prediction as a keyword or topic-matching problem. They ask: *is this video semantically similar to high-performing content?* They never ask: *does this channel's position in the broader creator ecosystem make this content likely to win?*

**3. The topology is invisible.**
YouTube channels do not exist in isolation. They form a dense relational network — channels that share audiences are structurally connected even when their content looks nothing alike. That topology contains predictive signal that no current platform captures.

---

## Slide 3 — The Insight

**Semantic similarity and audience topology are two independent signals. The gap between them is where alpha lives.**

We can represent any set of YouTube channels in two completely different ways:

| Signal | Method | What it captures |
|---|---|---|
| **Content semantics** | Pairwise Euclidean distance of PCA-reduced `multilingual-e5-large` channel-description embeddings | What a channel *talks about* |
| **Audience topology** | Normalised inverse of shared-subscriber-channel overlap | Who a channel *actually reaches* |

These two graphs are independently derived over the same channel universe. When they **agree**, semantic recommendations are trustworthy — content similarity predicts audience overlap. When they **disagree**, that divergence is the signal: a channel that talks like its neighbours but attracts a different audience is either an untapped partnership opportunity or a performance outlier waiting to be explained.

Our core research result — *Topology-Induced Anisotropic Prediction in Semantic Spaces* — formalises this: value (views) does not decay uniformly with semantic distance from a category optimum. The decay is **directional**, and the preferred and penalised directions are predicted by the inter-channel relational graph.

That is the proprietary engine. No competitor has built it.

---

## Slide 4 — The Solution

**Finder is a content intelligence platform that fuses semantic understanding with audience topology to tell creators and brands exactly what content will win.**

Three products. One platform.

### 🔍 Finder Discover
*For brand partnerships and talent agencies.*

Map every channel in a vertical against two axes: semantic distance (content similarity) and audience distance (subscriber overlap). Surface partnership opportunities that a keyword search would never find — channels with divergent content but convergent audiences are underpriced, high-fit sponsorship targets.

### 📈 Finder Predict
*For creators and content studios.*

Before publishing, score a proposed video title or topic against the channel's position in the audience-topology graph. Predict view count not just from semantic fit to past high-performers, but from the structural neighbourhood of related channels that are likely to surface the content algorithmically.

### 📊 Finder Intelligence
*For media companies and investor-backed creator funds.*

Track the evolving topology of entire content verticals over time. Identify cluster formation, fragmentation, and whitespace — the semantic and topological gaps where new channels can capture underserved audiences.

---

## Slide 5 — How It Works

**The Graphiko engine: dual-graph construction, comparison, and prediction.**

```
MongoDB (subscriptions, channel metadata)
    │
    ▼
Subscription Overlap Graph
(shared-subscriber-channel overlap matrix → normalised distance → row-stochastic)
    │
    ├──────────────────────────────────┐
    │                                  │
Pinecone (multilingual-e5-large       │
          channel description         │
          embeddings)                 │
    │                                  │
    ▼                                  ▼
Embeddings Distance Graph ←──── Graph Similarity Analysis
(PCA-reduced pairwise Euclidean       (Pearson r, Spearman ρ,
 → normalised distance →              Mantel test, QAP test,
 row-stochastic)                      residual decomposition)
                                       │
                                       ▼
                               Anisotropic Prediction Model
                               (topology-aware content scoring)
                                       │
                                       ▼
                                   Finder API
                                       │
                               ┌───────┴────────┐
                               ▼                ▼
                         Finder Web App    Partner Integrations
                     (React + Vite,         (Influencer platforms,
                      2D cluster maps,       agency dashboards,
                      per-channel stats,     CMS plugins)
                      sortable video table)
```

**Data sources already integrated:**
- MongoDB `finder` database — channels, videos, comments, subscriptions, authors
- Pinecone `finder` index — channel-description and video-title embeddings
- InfluxDB — raw time-series telemetry (Predikto module)
- YouTube Data API v3

---

## Slide 6 — Technology Moat

**Three layers of defensibility, compounding over time.**

### Layer 1 — Proprietary data infrastructure
The `finder` MongoDB database captures subscriber-level channel topology — not just subscriber *counts*, but the graph of which channels subscribe to which other channels. This data is not available through any public API at scale. It is the result of years of ingestion work.

### Layer 2 — Multi-view representation learning pipeline (Graphiko)
Our pipeline constructs, aligns, and compares two independently derived channel-relationship graphs. The comparison methodology — Mantel permutation tests, QAP-style permutation tests, directed residual decomposition (`R = subscriptions − embeddings`) — is peer-reviewed statistical network science applied to a commercial dataset. Each run produces versioned, schema-validated artifacts (`graphiko.adjacency v1.0.0`) that chain deterministically into downstream analysis.

### Layer 3 — Anisotropic prediction model
The core scientific contribution formalised in our research — that value in semantic space decays directionally, not radially, and that the inter-category relational graph explains the preferred directions — is a novel prediction framework. No existing recommender system models content performance this way. As we accumulate more channels and more temporal snapshots, the model improves nonlinearly: the topology graph becomes denser and the anisotropic directions become more precisely localised.

---

## Slide 7 — Product

**The Finder web application — live today.**

Our production React + Vite application (deployed to Netlify) provides:

| Feature | Description |
|---|---|
| **2D Semantic Map** | Per-channel scatter plot of all videos in 2D embedding space, coloured by cluster. Visualises the semantic structure of a channel's content at a glance. |
| **Cluster Analytics** | Per-cluster video count, average view count, centroid coordinates, and inter-centroid Euclidean distances. |
| **Video Intelligence Table** | Sortable, filterable table of every video in the dataset — title, channel, cluster assignment, view count, direct link. |
| **Channel Selector** | Instant filter across the full channel universe. |

The application consumes a structured JSON data contract produced by the Graphiko pipeline (`category_quantization.ipynb`) and scales to any channel set without code changes.

---

## Slide 8 — Market Size

**The creator economy is large, growing, and structurally underserved by intelligence tools.**

| Segment | TAM | Finder Entry Point |
|---|---|---|
| Influencer marketing platforms | $84B by 2028 (CAGR 32%) | Finder Discover — audience-topology-driven channel matching |
| Creator tools and analytics | $13B by 2027 | Finder Predict — pre-publish performance scoring |
| Media intelligence / brand safety | $9B by 2027 | Finder Intelligence — vertical topology tracking |
| **Combined addressable market** | **~$106B** | |

**Immediate beachhead:** The business-content vertical on YouTube — the cluster already instrumented in our production pipeline. This segment spans finance, entrepreneurship, marketing, SaaS, and e-commerce content: channels with measurable commercial intent and paying sponsors.

---

## Slide 9 — Business Model

**SaaS with an intelligence data flywheel.**

### Pricing tiers

| Tier | Target | Price | What they get |
|---|---|---|---|
| **Creator** | Individual YouTubers (100K–1M subs) | $49/mo | Predict scores for new video ideas; semantic map of their channel cluster |
| **Studio** | Content studios, MCNs | $499/mo | Full cluster analytics; competitive topology dashboards; batch scoring via API |
| **Agency** | Talent agencies, brand partnership teams | $1,999/mo | Audience-overlap discovery across verticals; partnership recommendation engine |
| **Enterprise** | Media companies, creator funds | Custom | Full platform access; dedicated topology snapshots; white-label reporting |

### Why the flywheel compounds
Every new channel ingested improves the topology graph for all existing customers. Every sponsored campaign tracked adds a ground-truth performance signal that tightens the anisotropic prediction model. Data network effects compound in a way that pure SaaS tools cannot replicate.

---

## Slide 10 — Competitive Landscape

**No one fuses semantic and topological signals. We have the field to ourselves.**

| Platform | Semantic analysis | Audience overlap | Topology graph | Anisotropic prediction |
|---|---|---|---|---|
| Finder | ✅ | ✅ | ✅ | ✅ |
| Social Blade | ❌ | ❌ | ❌ | ❌ |
| Creator.co / Grin | Partial (keyword) | ❌ | ❌ | ❌ |
| Tubular Labs | Partial (topic tags) | Partial (panel-based) | ❌ | ❌ |
| Semrush / Ahrefs for video | Partial (SEO signals) | ❌ | ❌ | ❌ |
| Pathmatics / Nielsen | ❌ | Partial (ad intel) | ❌ | ❌ |

**Key moat question:** Can incumbents replicate the subscription topology graph?

No — obtaining subscriber-level channel data at scale requires direct ingestion from YouTube's API under creator permissions, years of relationship-building to grow the subscriber network, and purpose-built infrastructure (our `finder` MongoDB schema, Pinecone vector store, and Graphiko pipeline). Audience panel approaches (like Tubular's) are statistical approximations; ours is a direct structural measurement.

---

## Slide 11 — Go-to-Market

**Land in the business content vertical; expand horizontally across YouTube; cross-platform to Instagram, TikTok, and podcasts.**

### Phase 1 — Business cluster (now)
The production pipeline is already instrumented on the business-content cluster. The web app is live. First 50 paying customers come from direct outreach to:
- Business YouTubers with active sponsorship revenue (200K–2M subs)
- Boutique influencer marketing agencies (5–50 person teams)
- VC-backed DTC brands with active YouTube sponsorship budgets

### Phase 2 — Vertical expansion (months 6–18)
Apply the Graphiko pipeline to adjacent verticals — tech, personal finance, health and wellness, gaming. Each vertical is a self-contained topology graph and a new ICP segment.

### Phase 3 — Cross-platform intelligence (year 2+)
The Graphiko engine is platform-agnostic. The same dual-graph architecture (semantic embeddings + behavioural topology) applies to Instagram Reels, TikTok, Spotify podcasts, and Substack newsletters. The data flywheel already built on YouTube becomes the training set for cross-platform generalisation.

---

## Slide 12 — Traction

**Research-validated. Pipeline-complete. First data already live.**

- ✅ Full Graphiko pipeline operational: subscription overlap graph, embeddings distance graph, graph similarity analysis, residual disagreement analysis — all producing versioned artifacts
- ✅ Production web application deployed to Netlify — live visualisation of the business-cluster video embedding space
- ✅ Dual-graph comparison implemented with peer-reviewed statistical methodology (Mantel test, QAP permutation test — Mantel 1967, Krackhardt 1987)
- ✅ Anisotropic prediction hypothesis formalised as a research paper (*Topology-Induced Anisotropic Prediction in Semantic Spaces*)
- ✅ Full data infrastructure: MongoDB `finder` database, Pinecone `finder` vector index, InfluxDB time-series store, Google Drive versioned artifact store
- ✅ Stable data contracts and schema versioning (`graphiko.adjacency v1.0.0`) — production-grade, not research prototype

**Next milestone:** 10 paying design partners from the business-content vertical, generating $15K MRR within 90 days of seed close.

---

## Slide 13 — Team

**Built at the intersection of representation learning, graph theory, and full-stack product engineering.**

### Santiago Marquínez — Founder & CEO

Architect of the Finder platform and the Graphiko research pipeline. Background spans:

- **Multi-view representation learning** — designed and implemented the dual-graph construction, comparison, and residual decomposition pipeline that underpins the core product
- **Probabilistic and geometric modelling** — formalised the anisotropic prediction framework; built the directed residual decomposition methodology connecting semantic geometry to topological structure
- **MLOps and data engineering** — versioned artifact pipelines across MongoDB, Pinecone, InfluxDB, and Google Drive; production React applications consuming ML pipeline outputs at scale
- **Full-stack product engineering** — built and deployed the Finder web application end-to-end; production experience with React, Vite, Netlify, and Mongoose

*[github.com/sanmquin](https://github.com/sanmquin)*

---

**Hiring:** Seed funding will be used to hire two founding engineers — one focused on the ML pipeline (graph neural networks, survival analysis, probabilistic forecasting) and one on full-stack product (React/TypeScript, real-time dashboards, API infrastructure).

---

## Slide 14 — The Ask

**Raising $2.5M seed to achieve product-market fit in the business-content vertical and expand to three additional verticals.**

### Use of funds

| Allocation | % | Purpose |
|---|---|---|
| Engineering | 55% | 2 founding engineers; ML infrastructure; API development |
| Data infrastructure | 15% | Pinecone, MongoDB, InfluxDB scale-out; YouTube API quota expansion |
| Go-to-market | 20% | Design partner acquisition; influencer marketing agency BD |
| Operations | 10% | Legal, finance, office |

### 18-month milestones

| Month | Milestone |
|---|---|
| 3 | 10 paying design partners; $15K MRR |
| 6 | Finder Predict in closed beta; 50 paying customers; $60K MRR |
| 12 | 3 verticals live; 200 paying customers; $250K MRR |
| 18 | Series A readiness: $500K MRR, 18-month payback period demonstrated |

### Why now

The creator economy is at an inflection point: brand spend on YouTube has doubled in three years, yet the intelligence tooling has not kept pace. Multi-view graph learning is maturing as a field. Large-scale multilingual embeddings are cheap and fast. The subscription topology data is already collected. The research is done. What remains is building the distribution layer — and that is what this round finances.

---

*Finder — Confidential. Not for distribution.*

*Contact: Santiago Marquínez · github.com/sanmquin*
