import { useMemo, useState } from 'react';

const METRIC_CONFIG = {
  predictability_r2: {
    label: 'Predictability (Adj. R²)',
    description:
      'Adjusted R² from a per-channel regression predicting engagement using distance-to-optimal-center. Higher values mean semantic position explains more engagement variance.'
  },
  distance_coef: {
    label: 'Distance Coefficient',
    description:
      'Regression coefficient on distance to the channel\'s optimal engagement center. More negative values indicate engagement drops faster as content moves away from that center.'
  },
  p_value: {
    label: 'Distance p-value',
    description:
      'Statistical significance for the distance coefficient. Smaller values indicate stronger evidence that distance-to-optimal-center is associated with engagement.'
  },
  gradient_magnitude: {
    label: 'Gradient Magnitude',
    description:
      'Length (norm) of the 20D semantic gradient vector for the channel. Larger values indicate a steeper engagement surface in embedding space.'
  },
  normality_shapiro_w: {
    label: 'Normality (Shapiro-W)',
    description:
      'Shapiro-W statistic for normality of projection values used in gradient analysis. Values closer to 1 suggest a distribution closer to normal.'
  },
  gradient_magnitude_normalized: {
    label: 'Normalized Gradient Magnitude',
    description:
      'Min-max normalized gradient magnitude on a [0, 1] scale, enabling easier cross-channel comparison of engagement-surface steepness.'
  }
};

const METRIC_KEYS = Object.keys(METRIC_CONFIG);

function EngagementMetricsTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'predictability_r2', direction: 'desc' });
  const [selectedMetric, setSelectedMetric] = useState('predictability_r2');

  const rows = useMemo(() => {
    const mapped = (data || [])
      .filter((item) => item?.channel_name)
      .map((item) => ({
        channel_name: item.channel_name,
        n_videos: item.n_videos,
        ...Object.fromEntries(METRIC_KEYS.map((key) => [key, item[key]]))
      }));

    const { key, direction } = sortConfig;
    const order = direction === 'asc' ? 1 : -1;

    return mapped.sort((a, b) => {
      if (key === 'channel_name') return a.channel_name.localeCompare(b.channel_name) * order;

      const aVal = a[key];
      const bVal = b[key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      return (aVal - bVal) * order;
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

  const formatValue = (key, value) => {
    if (value == null || Number.isNaN(value)) return 'N/A';
    if (key === 'p_value') return Number(value).toExponential(2);
    return Number(value).toFixed(4);
  };

  if (!rows.length) return null;

  return (
    <>
      <div className="field mb-3">
        <label className="label mb-2">Selected metric context</label>
        <div className="control">
          <div className="select is-small">
            <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value)}>
              {METRIC_KEYS.map((key) => (
                <option key={key} value={key}>
                  {METRIC_CONFIG[key].label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="is-size-7 mt-2">{METRIC_CONFIG[selectedMetric].description}</p>
      </div>

      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable is-bordered is-narrow">
          <thead>
            <tr>
              <th>
                <button type="button" className="button is-ghost p-0" onClick={() => onSort('channel_name')}>
                  Channel
                </button>
              </th>
              <th>
                <button type="button" className="button is-ghost p-0" onClick={() => onSort('n_videos')}>
                  Videos
                </button>
              </th>
              {METRIC_KEYS.map((metricKey) => (
                <th key={metricKey}>
                  <button type="button" className="button is-ghost p-0" onClick={() => onSort(metricKey)}>
                    {METRIC_CONFIG[metricKey].label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.channel_name}>
                <td className="has-text-weight-semibold">{row.channel_name}</td>
                <td>{row.n_videos ?? 'N/A'}</td>
                {METRIC_KEYS.map((metricKey) => (
                  <td key={metricKey}>{formatValue(metricKey, row[metricKey])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default EngagementMetricsTable;
