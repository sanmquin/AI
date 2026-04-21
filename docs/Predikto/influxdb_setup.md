# InfluxDB Migration Setup

As part of the system simplification, video snapshot data is being gradually migrated from MongoDB to InfluxDB.

## InfluxDB Setup

1. Install InfluxDB locally or provision a cloud instance.
2. Obtain your instance URL, an API Token, Organization name, and Bucket name.
3. Configure the following environment variables in your deployment environment (e.g., `.env` file or Netlify Environment Variables):
   - `INFLUXDB_URL`: The URL of your InfluxDB instance (e.g., `http://localhost:8086`)
   - `INFLUXDB_TOKEN`: Your API token with write access to the bucket
   - `INFLUXDB_ORG`: Your InfluxDB Organization
   - `INFLUXDB_BUCKET`: The destination Bucket for snapshot metrics

## Schema Mapping

InfluxDB schemas currently written by the codebase (`netlify/functions/utils/influxdb.ts`):

### 1) `channel_metrics`
- **Tags**: `channelId`
- **Fields**: `videoId` (string), `title` (string), `views` (int), `likes` (int), `comments` (int), `viewsGained` (int), `velocity` (float, optional), `acceleration` (float, optional)
- **Timestamp**: `snapshotAt`

### 2) `table_summaries`
- **Tags**: `channelId`
- **Fields**: `viewsGained`, `maxViewsGainedSingleVideo`, `viewsGainedExistingVideos`, `viewsGainedNewVideos`, `newVideos`
- **Timestamp**: summary interval timestamp from writer

### 3) `feature_values`
- **Tags**: `featureId`
- **Fields**: `channelId` (string), `videoId` (string), `value` (float)
- **Timestamp**: write time (`new Date()`)

## Migration Status

Currently, write logic in active ingestion pipelines (like Monthly Refresh and Largest Views Gained) writes dual records to both MongoDB and InfluxDB via `netlify/functions/utils/influxdb.ts`. Read logic will be migrated in a future iteration.
