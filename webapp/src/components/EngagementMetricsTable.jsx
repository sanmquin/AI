import { useMemo, useState } from 'react';

const METRIC_COLUMNS = [
  {
    key: 'mean',
    label: 'Average Engagement Signal',
    tooltip: 'Mean value across the 20-dimensional engagement center for each channel. Higher values indicate an overall positive engagement tendency.'
  },
  {
    key: 'meanAbs',
    label: 'Engagement Intensity',
    tooltip: 'Average absolute value across dimensions. This reflects how strongly a channel deviates from neutral engagement regardless of direction.'
  },
  {
    key: 'stdDev',
    label: 'Engagement Variability',
    tooltip: 'Standard deviation of engagement-center dimensions. Higher values indicate less consistent engagement behavior across dimensions.'
  },
  {
    key: 'maxVal',
    label: 'Strongest Positive Dimension',
    tooltip: 'Largest positive value in the engagement center. This captures the single most dominant positive engagement dimension.'
  },
  {
    key: 'minVal',
    label: 'Strongest Negative Dimension',
    tooltip: 'Lowest (most negative) value in the engagement center. This captures the strongest negative engagement dimension.'
  }
];

function computeMetrics(vector) {
  if (!Array.isArray(vector) || vector.length === 0) {
    return null;
  }

  const mean = vector.reduce((acc, n) => acc + n, 0) / vector.length;
  const meanAbs = vector.reduce((acc, n) => acc + Math.abs(n), 0) / vector.length;
  const variance = vector.reduce((acc, n) => acc + (n - mean) ** 2, 0) / vector.length;
  const stdDev = Math.sqrt(variance);
  const maxVal = Math.max(...vector);
  const minVal = Math.min(...vector);

  return { mean, meanAbs, stdDev, maxVal, minVal };
}

function EngagementMetricsTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'meanAbs', direction: 'desc' });

  const rows = useMemo(() => {
    const mapped = (data || [])
      .map((item) => {
        const metrics = computeMetrics(item.engagement_center_20d);
        if (!metrics) return null;

        return {
          channel_name: item.channel_name,
          ...metrics
        };
      })
      .filter(Boolean);

    const { key, direction } = sortConfig;
    const order = direction === 'asc' ? 1 : -1;

    return mapped.sort((a, b) => {
      if (key === 'channel_name') {
        return a.channel_name.localeCompare(b.channel_name) * order;
      }

      return (a[key] - b[key]) * order;
    });
  }, [data, sortConfig]);

  const onSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { key, direction: key === 'channel_name' ? 'asc' : 'desc' };
    });
  };

  if (!rows.length) return null;

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-striped is-hoverable is-bordered is-narrow">
        <thead>
          <tr>
            <th>
              <button type="button" className="button is-ghost p-0" onClick={() => onSort('channel_name')}>
                Channel
              </button>
            </th>
            {METRIC_COLUMNS.map((column) => (
              <th key={column.key}>
                <button
                  type="button"
                  className="button is-ghost p-0"
                  onClick={() => onSort(column.key)}
                  title={column.tooltip}
                >
                  {column.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.channel_name}>
              <td className="has-text-weight-semibold">{row.channel_name}</td>
              {METRIC_COLUMNS.map((column) => (
                <td key={column.key}>{row[column.key].toFixed(4)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EngagementMetricsTable;
