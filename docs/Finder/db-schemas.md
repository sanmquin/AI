# Database Schemas

This document is the canonical schema reference for the two data owners in this project:

1. **Finder** (local Netlify functions + Mongoose models).
2. **MM-DP** (`mm-dp.netlify.app` external ML platform writing raw MongoDB collections).

## 1) Finder-owned schemas (Mongoose)

Source of truth: `netlify/utils/models.ts`.

> Notes
> - Collections are created by Mongoose model names (`Channel`, `Video`, etc.), which map to pluralized collection names (`channels`, `videos`, etc.).
> - `timestamps: true` adds `createdAt` and `updatedAt` where shown.

### `channels`

| Field | Type | Required | Unique | Default | Description |
|---|---|---:|---:|---|---|
| `channelId` | `String` | ✅ | ✅ | — | YouTube channel ID. |
| `title` | `String` | — | — | — | Channel title. |
| `description` | `String` | — | — | — | Channel description text. |
| `publishedAt` | `Date` | — | — | — | Channel publish date from YouTube. |
| `thumbnails` | `Object` | — | — | — | Thumbnail payload from YouTube. |
| `subscriberCount` | `Number` | — | — | — | Subscriber count snapshot. |
| `videoCount` | `Number` | — | — | — | Video count snapshot. |
| `viewCount` | `Number` | — | — | — | Total channel views snapshot. |
| `ignored` | `Boolean` | — | — | `false` | Marked skipped during batch fetch. |
| `lastFetched` | `Date` | — | — | — | Last successful ingestion time. |
| `rootNode` | `Boolean` | — | — | `false` | True for directly requested channels. |
| `createdAt` | `Date` | auto | — | auto | Mongoose timestamp. |
| `updatedAt` | `Date` | auto | — | auto | Mongoose timestamp. |

### `videos`

| Field | Type | Required | Unique | Description |
|---|---|---:|---:|---|
| `videoId` | `String` | ✅ | ✅ | YouTube video ID. |
| `channelId` | `String` | ✅ | — | Parent channel ID. |
| `title` | `String` | — | — | Video title. |
| `description` | `String` | — | — | Video description. |
| `publishedAt` | `Date` | — | — | Video publish date. |
| `thumbnails` | `Object` | — | — | Thumbnail payload from YouTube. |
| `viewCount` | `Number` | — | — | View count snapshot. |
| `likeCount` | `Number` | — | — | Like count snapshot. |
| `commentCount` | `Number` | — | — | Comment count snapshot. |
| `durationSeconds` | `Number` | — | — | Parsed duration in seconds. |
| `createdAt` | `Date` | auto | — | Mongoose timestamp. |
| `updatedAt` | `Date` | auto | — | Mongoose timestamp. |

### `comments`

| Field | Type | Required | Unique | Description |
|---|---|---:|---:|---|
| `commentId` | `String` | ✅ | ✅ | YouTube comment ID. |
| `videoId` | `String` | ✅ | — | Parent video ID. |
| `channelId` | `String` | ✅ | — | Root channel/video owner ID. |
| `authorDisplayName` | `String` | — | — | Display name of comment author. |
| `authorChannelId` | `String` | — | — | Comment author channel ID. |
| `authorProfileImageUrl` | `String` | — | — | Author avatar URL. |
| `textDisplay` | `String` | — | — | Rich display text. |
| `textOriginal` | `String` | — | — | Plain comment text. |
| `likeCount` | `Number` | — | — | Comment likes. |
| `replyCount` | `Number` | — | — | Reply count. |
| `publishedAt` | `Date` | — | — | Comment publish time. |
| `updatedAt` | `Date` | — | — | Comment update time from API payload. |
| `createdAt` | `Date` | auto | — | Mongoose timestamp. |

### `subscriptions`

| Field | Type | Required | Unique | Description |
|---|---|---:|---:|---|
| `subscriptionId` | `String` | ✅ | ✅ | YouTube subscription ID. |
| `subscriberChannelId` | `String` | ✅ | — | Subscriber channel ID (comment author account). |
| `channelId` | `String` | ✅ | — | Subscribed-to channel ID. |
| `title` | `String` | — | — | Subscribed-to channel title. |
| `description` | `String` | — | — | Subscribed-to channel description. |
| `publishedAt` | `Date` | — | — | Subscription publish date from YouTube. |
| `thumbnails` | `Object` | — | — | Thumbnail payload from YouTube. |
| `createdAt` | `Date` | auto | — | Mongoose timestamp. |
| `updatedAt` | `Date` | auto | — | Mongoose timestamp. |

### `authors`

| Field | Type | Required | Unique | Description |
|---|---|---:|---:|---|
| `channelId` | `String` | ✅ | — | Comment author channel ID. |
| `originChannelId` | `String` | ✅ | — | Root channel where that author was discovered. |
| `createdAt` | `Date` | auto | — | Mongoose timestamp. |
| `updatedAt` | `Date` | auto | — | Mongoose timestamp. |

---

## 2) MM-DP-owned schemas (raw MongoDB)

These collections are not defined via local Mongoose schemas in Finder. They are written by external MM-DP functions (called from `src/api/api.ts`) and read by Finder reporting endpoints.

### `ChannelDescriptions_clusters`

Created by MM-DP clustering/refinement jobs.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Cluster document ID. |
| `name` | `String` | AI-generated cluster name. |
| `summary` | `String` | AI-generated cluster summary. |
| `description` | `String` (optional) | Extended human-readable cluster description. |
| `centroid` | `Number[]` | Vector centroid for the cluster. |
| `version` | `Number` | Clustering run version (Finder reads latest). |
| `createdAt` | `Date` | Write timestamp. |

### `ChannelDescriptions_items`

Maps source text/channel IDs to cluster IDs.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Document ID. |
| `textId` | `String` | Source item ID (for Finder usage, channel ID). |
| `clusterId` | `ObjectId` | Reference to `ChannelDescriptions_clusters._id`. |
| `createdAt` | `Date` | Write timestamp. |

### `VideoTitles_features`

Feature model metadata produced by MM-DP.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Document ID. |
| `categoryId` | `String` | Scope key (channel ID or cluster ID string). |
| `name` | `String` | Feature name. |
| `description` | `String` | Feature description. |
| `modelBuffer` | `Binary \| Object` | Serialized regression model payload. |
| `averageValue` | `Number` | Average training score. |
| `error` | `Number` | Model error metric (typically MSE). |
| `createdAt` | `Date` | Write timestamp. |

### `VideoTitles_evaluations`

Per-text feature scores/predictions.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Document ID. |
| `categoryId` | `String` | Scope key used with features. |
| `textId` | `String` | Source text ID (for Finder usage, video ID). |
| `text` | `String` | Source text (video title). |
| `evaluations` | `Array<{ featureName: string; score?: number; inferenceValue?: number }>` | Feature values generated during training and/or inference. |
| `createdAt` | `Date` | Write timestamp. |

### `VideoTitles_performance`

Feature-to-performance correlations.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Document ID. |
| `categoryId` | `String` | Scope key used with features/evaluations. |
| `featureName` | `String` | Feature being evaluated. |
| `correlation` | `Number` | Pearson correlation with video view count. |
| `createdAt` | `Date` | Write timestamp. |

---

## 3) Ownership boundary and how to interpret it

- **Finder owns ingestion schemas** (`channels`, `videos`, `comments`, `subscriptions`, `authors`) and writes them from local background functions.
- **MM-DP owns ML artifact schemas** (`ChannelDescriptions_*`, `VideoTitles_*`) and writes them through external endpoints.
- Finder's local read endpoints (e.g., channel clusters, features, evaluations, performance) assume the MM-DP collection shapes above when querying raw MongoDB collections.
