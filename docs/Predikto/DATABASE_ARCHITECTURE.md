# Database Architecture

This document describes the Predikto data model across both MongoDB and InfluxDB: collection/measurement purpose, field definitions, indexes/tags, and relationships.


## Datastores at a glance

| Datastore | Scope | Source of truth for |
|---|---|---|
| MongoDB | Transactional and document data | Channel/video entities, jobs, predictions, comments, model metadata |
| InfluxDB | Time-series analytics | Snapshot metrics, table summaries, inferred per-video feature values |

---

## MongoDB Collections Overview

| Collection | Primary Purpose |
|---|---|
| `TrackedChannel` | Stores public YouTube channel metadata and computed analytics |
| `PublicVideo` | Stores public video metadata for Shorts |
| `PublicVideoSnapshot` | Time-series snapshots of video statistics |
| `IngestionJob` | Tracks full and refresh ingestion background jobs |
| `PredictionJob` | Tracks prediction pipeline background jobs |
| `Prediction` | Individual view-count predictions per video per job |
| `PredictionModel` | Persisted model parameters (e.g. velocity coefficient) |
| `VideoComment` | Top comments extracted from Shorts during ingestion |
| `VideoCommentSummary` | AI-generated summaries of video comments |
| `ChannelSubscription` | Cross-channel subscription relationships from comment authors |
| `ChannelPerformanceExplanation` | AI-generated performance explanations per channel |
| `CronLog` | Execution audit log for scheduled cron pipelines |

---

## Detailed Schema Reference

### `TrackedChannel`

Stores a YouTube channel discovered and tracked by the platform.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `channelId` | String | ✅ | — | YouTube channel ID (e.g. `UCxxxxxx`). Unique. |
| `title` | String | ✅ | — | Channel display name. |
| `subCount` | Number | ✅ | — | Subscriber count at the time of last ingestion. |
| `totalViews` | Number | ✅ | — | All-time total view count at last ingestion. |
| `lastIngestion` | Date | — | `Date.now()` | Timestamp of the most recent successful ingestion run. |
| `hasEmbeddings` | Boolean | — | `false` | `true` when a channel-level vector embedding has been stored in Pinecone. |
| `lastEmbedded` | Date | — | — | Timestamp of the last successful Pinecone embedding upload. |
| `stats.activityPerMonth` | Array | — | — | Array of `{ month: "YYYY-MM", count: Number }` objects representing the number of Shorts published per calendar month. |
| `stats.averageViewsPerShort` | Number | — | — | Mean view count across all ingested Shorts. |
| `stats.avgLikesPer1kViews` | Number | — | — | Average like count per 1,000 views across all Shorts. |
| `stats.avgCommentsPer1kViews` | Number | — | — | Average comment count per 1,000 views across all Shorts. |
| `stats.trendPercentage` | Number | — | — | Percentage difference between the average views of the most-recent 25 Shorts and the preceding 25 Shorts. Positive means growth. |
| `stats.totalVideosProcessed` | Number | — | — | Number of Shorts used when computing the stats block. |
| `statsUpdatedAt` | Date | — | — | Timestamp of the last `compute-stats` run for this channel. |
| `explanationUpdatedAt` | Date | — | — | Timestamp of the last Gemini-generated performance explanation. |
| `createdAt` / `updatedAt` | Date | — | Auto | Mongoose timestamps. |

**Indexes:** unique on `channelId`.

---

### `PublicVideo`

Stores static metadata for a single YouTube Short.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `videoId` | String | ✅ | — | YouTube video ID. Unique. |
| `channelId` | String | ✅ | — | Parent channel's YouTube ID. Foreign key to `TrackedChannel`. |
| `title` | String | ✅ | — | Video title at last ingestion. |
| `duration` | String | ✅ | — | ISO 8601 duration (e.g. `PT30S`). |
| `publishedAt` | Date | ✅ | — | Publication timestamp. |
| `viewCount` | Number | ✅ | — | View count at last ingestion/refresh. |
| `likeCount` | Number | ✅ | — | Like count at last ingestion/refresh. |
| `commentCount` | Number | ✅ | — | Comment count at last ingestion/refresh. |
| `hasEmbeddings` | Boolean | — | `false` | `true` when a vector embedding has been stored in Pinecone for this video. |
| `lastEmbedded` | Date | — | — | Timestamp of the last successful Pinecone embedding. |
| `summaryUpdatedAt` | Date | — | — | Timestamp of the last AI comment summary generated for this video. |

**Indexes:** unique on `videoId`.

**Relationships:** `channelId` → `TrackedChannel.channelId`; `videoId` → `PublicVideoSnapshot.videoId`, `VideoComment.videoId`, `VideoCommentSummary.videoId`, `Prediction.videoId`.

---

### `PublicVideoSnapshot`

A time-series record of a video's statistics at a specific point in time. A new snapshot is created every time the video appears in an ingestion or refresh run.

**⚠️ DEPRECATION NOTICE:** This collection is currently being migrated to InfluxDB (`channel_metrics` measurement) for improved performance and scalability.
**Migration to InfluxDB Status:** The following files still contain references to `PublicVideoSnapshot` and require updates to finalize the migration:
- `netlify/functions/verify-snapshots-background.ts`
- `netlify/functions/utils/db/schema.ts`
- `netlify/functions/utils/verification.ts`
- `netlify/functions/utils/videos.ts`
- `netlify/functions/deprecated/ingest-pipeline-background.ts`
- `netlify/functions/deprecated/ingest-top-subscribed-background.ts`
- `netlify/functions/deprecated/ingest-most-viewed-background.ts`
- `netlify/functions/cleanup-videos.ts`
- `netlify/functions/snapshots.ts` (Mode 1 and Mode 2)
- `netlify/functions/job-recent-snapshots.ts`
- `netlify/functions/predictions.ts`
- `netlify/functions/train-model.ts`
- `netlify/functions/predict-pipeline-background.ts`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `videoId` | String | ✅ | — | YouTube video ID. Foreign key to `PublicVideo`. |
| `channelId` | String | ✅ | — | Parent channel ID. Denormalised for efficient channel-level queries. |
| `viewCount` | Number | ✅ | — | Absolute view count at snapshot time. |
| `likeCount` | Number | ✅ | — | Absolute like count at snapshot time. |
| `commentCount` | Number | ✅ | — | Absolute comment count at snapshot time. |
| `snapshotAt` | Date | ✅ | `Date.now()` | Timestamp of this snapshot. |
| `elapsedMs` | Number | — | — | Milliseconds elapsed since the **previous** snapshot (or `publishedAt` if first). |
| `viewsGained` | Number | — | — | View count delta from the previous snapshot. |
| `relativeViewsGained` | Number | — | — | `viewsGained / previousViewCount`. Captures relative growth rate. |
| `likesGained` | Number | — | — | Like count delta from the previous snapshot. |
| `commentsGained` | Number | — | — | Comment count delta from the previous snapshot. |

**Indexes:**
- Compound `{ videoId: 1, snapshotAt: 1 }` — for efficient chronological retrieval of a video's snapshot history.

**Relationships:** `videoId` → `PublicVideo.videoId`.

---

### `IngestionJob`

Tracks one execution of the full ingestion or channel-refresh pipeline.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `slugOrId` | String | ✅ | — | The channel handle (`@...`) or channel ID submitted by the user. |
| `channelId` | String | — | — | Resolved YouTube channel ID, set once the channel is identified. |
| `status` | Enum | — | `'queued'` | `queued` → `processing` → `done` / `failed`. |
| `progress` | String | — | — | Human-readable description of the current pipeline step. |
| `quotaUsed` | Number | — | `0` | Accumulated YouTube Data API v3 quota units consumed. |
| `createdAt` / `updatedAt` | Date | — | Auto | Mongoose timestamps. |

---

### `PredictionJob`

Tracks one execution of the prediction pipeline, either for a specific channel or for all active channels.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `channelId` | String | — | — | Set when the job targets a single channel; absent for full-run jobs. |
| `type` | Enum | — | `'channel'` | `'channel'` for a per-channel job; `'full'` for a cron-triggered global run. |
| `status` | Enum | — | `'queued'` | `queued` → `processing` → `awaiting_verification` → `verified` → `done` / `failed`. |
| `predictedResults` | Mixed | — | — | Legacy field for arbitrary prediction output (superseded by `Prediction` collection). |
| `isVerified` | Boolean | — | `false` | Set to `true` when all `Prediction` records for this job have been evaluated. |
| `verifiedAt` | Date | — | — | Timestamp when the job was fully verified. |
| `errorAvg` | Number | — | — | Average absolute percentage error across all verified predictions in this job. |
| `createdAt` / `updatedAt` | Date | — | Auto | Mongoose timestamps. |

---

### `Prediction`

One predicted view count for a specific video within the context of a `PredictionJob`.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `jobId` | ObjectId | — | — | Reference to `PredictionJob._id`. |
| `channelId` | String | ✅ | — | YouTube channel ID for the video. |
| `videoId` | String | ✅ | — | YouTube video ID. |
| `originalViews` | Number | — | — | Snapshot of `viewCount` at the time the prediction was made. |
| `predictedViews` | Number | ✅ | — | Model-predicted view count for the next 24 hours. |
| `actualViews` | Number | — | — | Actual view count fetched during verification (set post-prediction). |
| `error` | Number | — | — | Absolute percentage error `|predicted − actual| / actual`. `null` if the video could not be verified. |
| `predictedAt` | Date | ✅ | `Date.now()` | Timestamp when the prediction was made. |
| `modelUsed` | String | ✅ | — | Name of the model (currently `'Baseline-Velocity'`). |

**Indexes:**
- `{ channelId: 1, predictedAt: -1 }` — for channel-specific prediction history.
- `{ jobId: 1 }` — for retrieving all predictions belonging to a job.

**Relationships:** `jobId` → `PredictionJob._id`; `channelId` → `TrackedChannel.channelId`; `videoId` → `PublicVideo.videoId`.

---

### `PredictionModel`

Persists the trained parameters of a statistical model for a channel.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `channelId` | String | ✅ | — | Target channel. |
| `modelType` | String | ✅ | — | Model identifier (e.g. `'Velocity'`, `'S-H'`, `'ML'`). |
| `parameters` | Mixed | ✅ | — | Serialised model coefficients (e.g. `{ a: 1200 }` for the velocity coefficient). |
| `targetDays` | Number | ✅ | — | Prediction horizon in days (e.g. `1` for next-day prediction). |
| `trainedAt` | Date | ✅ | `Date.now()` | Timestamp when the model was last trained/updated. |

**Indexes:**
- `{ channelId: 1, modelType: 1, targetDays: 1 }` — for fast model lookup per channel and model type.

---

### `VideoComment`

A top-level comment extracted from a Short, used to identify engaged viewers and map their subscriptions.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `commentId` | String | ✅ | — | YouTube comment ID. Unique. |
| `videoId` | String | ✅ | — | YouTube video ID the comment belongs to. |
| `authorChannelId` | String | ✅ | — | YouTube channel ID of the comment author. Used to fetch subscriptions. |
| `textOriginal` | String | ✅ | — | Raw comment text. |
| `publishedAt` | Date | ✅ | — | Timestamp of the comment. |
| `likeCount` | Number | — | `0` | Number of likes on the comment. |
| `replyCount` | Number | — | `0` | Number of replies to the comment. |

**Indexes:** unique on `commentId`.

**Relationships:** `videoId` → `PublicVideo.videoId`; `authorChannelId` → `ChannelSubscription.subscriberId`.

---

### `VideoCommentSummary`

An AI-generated summary of the comments for a specific video.

| Field | Type | Required | Description |
|---|---|---|---|
| `videoId` | String | ✅ | YouTube video ID. Unique. |
| `summary` | String | ✅ | Gemini-generated summary text. |
| `createdAt` / `updatedAt` | Date | Auto | Mongoose timestamps. |

**Relationships:** `videoId` → `PublicVideo.videoId`.

---

### `ChannelSubscription`

Records that a YouTube user (`subscriberId`) is publicly subscribed to a channel (`channelId`). Populated by fetching the public subscriptions of comment authors during ingestion.

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriberId` | String | ✅ | YouTube channel ID of the subscriber (comment author). |
| `channelId` | String | ✅ | YouTube channel ID being subscribed to. |

**Indexes:**
- Compound unique `{ subscriberId: 1, channelId: 1 }` — prevents duplicate subscription records.

**Usage:** Aggregated to find the top commonly-followed channels across an audience (subscriber network analysis).

---

### `ChannelPerformanceExplanation`

An AI-generated explanation of why a channel's best and worst Shorts performed as they did.

| Field | Type | Required | Description |
|---|---|---|---|
| `channelId` | String | ✅ | YouTube channel ID. Unique. |
| `explanation` | String | ✅ | Gemini-generated explanation text (1–2 paragraphs). |
| `createdAt` / `updatedAt` | Date | Auto | Mongoose timestamps. |

**Relationships:** `channelId` → `TrackedChannel.channelId`.

---

### `CronLog`

Audit record for each execution of a scheduled pipeline job.

| Field | Type | Required | Description |
|---|---|---|---|
| `jobType` | Enum | ✅ | `'prediction_pipeline'` or `'verification_pipeline'`. |
| `status` | Enum | ✅ | `'success'` or `'error'`. |
| `message` | String | — | Optional detail message (e.g. error text or summary of work done). |
| `createdAt` | Date | — | Defaults to `Date.now()`. |

---

## Entity-Relationship Summary

```
TrackedChannel (channelId)
    │
    ├─── PublicVideo (channelId → TrackedChannel.channelId)
    │         │
    │         ├─── PublicVideoSnapshot (videoId → PublicVideo.videoId)
    │         ├─── VideoComment (videoId → PublicVideo.videoId)
    │         │         └─── ChannelSubscription (subscriberId = authorChannelId)
    │         ├─── VideoCommentSummary (videoId → PublicVideo.videoId)
    │         └─── Prediction (videoId → PublicVideo.videoId)
    │                   └─── PredictionJob (_id → Prediction.jobId)
    │
    ├─── PredictionModel (channelId → TrackedChannel.channelId)
    └─── ChannelPerformanceExplanation (channelId → TrackedChannel.channelId)

IngestionJob (standalone — tracks background ingestion runs)
CronLog (standalone — records scheduled pipeline outcomes)
```

---

## Embedding Lifecycle

For collections that support vector search (`TrackedChannel`, `PublicVideo`), the lifecycle of an embedding is tracked **entirely in MongoDB** to avoid expensive Pinecone queries:

1. `hasEmbeddings: false` — document exists in MongoDB but no vector has been stored in Pinecone.
2. `embedAndStoreText()` is called — vector is upserted to Pinecone using the document's `channelId` or `videoId` as the record ID.
3. On success → MongoDB is updated: `hasEmbeddings = true`, `lastEmbedded = new Date()`.
4. A re-embed resets `lastEmbedded` to allow freshness checks.

See [`EMBEDDINGS_ARCHITECTURE.md`](./EMBEDDINGS_ARCHITECTURE.md) for full design rationale.


---

## InfluxDB Measurement Reference

InfluxDB write/query behavior is implemented in `netlify/functions/utils/influxdb.ts`.

### `channel_metrics`

Primary time-series measurement for video snapshot metrics.

- **Tags**
  - `channelId` (tag): YouTube channel identifier.
- **Fields**
  - `videoId` (string field): Video identifier.
  - `title` (string field): Video title captured at ingestion time.
  - `views` (int field): Absolute views at snapshot time.
  - `likes` (int field): Absolute likes at snapshot time.
  - `comments` (int field): Absolute comments at snapshot time.
  - `viewsGained` (int field): Incremental views since prior snapshot (defaults to `0` when not provided).
  - `velocity` (float field, optional): Computed view velocity.
  - `acceleration` (float field, optional): Computed view acceleration.
- **Timestamp**
  - `snapshotAt` (point timestamp): Event time in nanosecond precision write API mode (`ns`).

### `table_summaries`

Channel-level rollups used by table summary dashboards/jobs.

- **Tags**
  - `channelId` (tag): YouTube channel identifier.
- **Fields**
  - `viewsGained` (int field): Aggregate views gained in the summary interval.
  - `maxViewsGainedSingleVideo` (int field): Max gain among individual videos in interval.
  - `viewsGainedExistingVideos` (int field): Views gained from already-existing videos.
  - `viewsGainedNewVideos` (int field): Views gained from newly discovered videos.
  - `newVideos` (int field): Count of newly discovered videos in interval.
- **Timestamp**
  - `timestamp` argument from writer call.

### `feature_values`

Per-video inferred feature values written by feature inference jobs.

- **Tags**
  - `featureId` (tag): Logical feature identifier (for filtering/grouping by feature).
- **Fields**
  - `channelId` (string field): Channel identifier.
  - `videoId` (string field): Video identifier.
  - `value` (float field): Feature value.
- **Timestamp**
  - Server write time (`new Date()` in write helper).

### InfluxDB query shape used in code

- `queryFeatureValues(channelId, featureId)` filters measurement=`feature_values`, filters by `channelId` and `featureId`, then pivots `_field` values and returns each video's latest `value`.
- `queryAllChannelFeatureValues(channelId)` performs similar pivoting and returns latest values grouped by `(videoId, featureId)`.
