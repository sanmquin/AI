# InfluxDB Raw Data (Predikto)

Raw time-series data from InfluxDB is periodically downloaded and archived to Google Drive for offline analysis, model training, and backup purposes.

## Storage Location

The raw data archives are stored in the shared Google Drive directory:

```text
/content/drive/MyDrive/Predikto/influxdb_raw/
```

## Data Partitioning

Data is split by day (UTC). Each daily extract is saved as a CSV file named according to its date:

```text
YYYY-MM-DD.csv
```

The script that downloads the data strictly queries full past days and never queries or downloads the present day to ensure completeness.

## Schema

The data represents the `channel_metrics` measurement, pivoted so that InfluxDB fields become columns. The standard columns include:

| Column | Type | Description |
|---|---|---|
| `_time` | datetime | Timestamp of the snapshot (UTC). |
| `channelId` | string | The YouTube channel identifier (InfluxDB tag). |
| `videoId` | string | The YouTube video identifier (InfluxDB field). |
| `title` | string | Video title (InfluxDB field). |
| `views` | integer | Total view count at the snapshot time (InfluxDB field). |
| `likes` | integer | Total like count at the snapshot time (InfluxDB field). |
| `comments` | integer | Total comment count at the snapshot time (InfluxDB field). |
| `viewsGained` | integer | Incremental views gained since the previous snapshot (InfluxDB field). |
| `velocity` | float | Computed view velocity (InfluxDB field, optional). |
| `acceleration` | float | Computed view acceleration (InfluxDB field, optional). |
