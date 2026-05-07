import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import Select from 'react-select';
import { ckmeans } from 'simple-statistics';
import { normalizeVector, euclideanDistance } from '../utils/math';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.video_title}</strong></p>
        <p>Channel: {data.channel_name}</p>
        <p>Distance: {data.distance.toFixed(4)}</p>
        <p>Views: {(data.view_count || -1).toLocaleString()}</p>
        {data.cluster !== undefined && <p>Cluster: {data.cluster}</p>}
      </div>
    );
  }
  return null;
};

// A simple color palette for clusters
const CLUSTER_COLORS = [
  '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D'
];

function Recommendations({ allVideos, selectedChannel, engagementCenters, predictions, }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedDimensions, setSelectedDimensions] = useState([]);
  const [isClustered, setIsClustered] = useState(false);

  // Prepare dimension options sorted by p_value
  const dimensionOptions = useMemo(() => {
    if (!predictions) return [];

    // Sort predictions by p_value ascending
    const sortedPredictions = [...predictions].sort((a, b) => a.p_value - b.p_value);

    return sortedPredictions.map(p => {
      const pValueRounded = p.p_value.toExponential(2);
      return {
        value: p.dimension_index,
        label: `Dim ${p.dimension_index} (p=${pValueRounded})`
      };
    });
  }, [predictions]);

  const { chartData, topVideos } = useMemo(() => {
    if (!allVideos || allVideos.length === 0 || !selectedChannel) {
      return { chartData: [], topVideos: [] };
    }

    const center = engagementCenters.find((item) => item.channel_name === selectedChannel);
    if (!center || !Array.isArray(center.engagement_center_20d) || center.engagement_center_20d.length !== 20) {
      return { chartData: [], topVideos: [] };
    }

    const normalizedCenter = normalizeVector(center.engagement_center_20d);

    const dataWithDistance = [];

    const selectedIndices = selectedDimensions.length > 0
      ? selectedDimensions.map(opt => opt.value)
      : null;

    allVideos.forEach(v => {
      const embedding = v.embedding_20d;
      if (embedding && embedding.length === 20) {
        let distance;

        if (selectedIndices) {
          const subsetEmbedding = selectedIndices.map(idx => embedding[idx]);
          const subsetCenter = selectedIndices.map(idx => normalizedCenter[idx]);
          distance = euclideanDistance(subsetEmbedding, subsetCenter);
        } else {
          distance = euclideanDistance(embedding, normalizedCenter);
        }

        const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);

        dataWithDistance.push({
          ...v,
          distance,
          view_count: Math.max(1, views) // prevent log(0)
        });
      }
    });

    dataWithDistance.sort((a, b) => a.distance - b.distance);

    let top100 = dataWithDistance.slice(0, 100);

    let clustersSummary = [];

    if (isClustered && top100.length >= 10) {
      const distances = top100.map(v => v.distance);
      const clusters = ckmeans(distances, 10);

      // Assign cluster index based on the ckmeans output
      top100 = top100.map(v => {
        const clusterIndex = clusters.findIndex(clusterArray => clusterArray.includes(v.distance));
        return { ...v, cluster: clusterIndex !== -1 ? clusterIndex : 0 };
      });

      // Calculate summary statistics
      for (let i = 0; i < 10; i++) {
        const clusterVideos = top100.filter(v => v.cluster === i);
        if (clusterVideos.length > 0) {
          const sumDistance = clusterVideos.reduce((acc, v) => acc + v.distance, 0);
          const sumViews = clusterVideos.reduce((acc, v) => acc + v.view_count, 0);
          clustersSummary.push({
            cluster_id: i,
            count: clusterVideos.length,
            avg_distance: sumDistance / clusterVideos.length,
            avg_views: sumViews / clusterVideos.length
          });
        }
      }
    }

    return { chartData: top100, topVideos: top100, clustersSummary };
  }, [allVideos, selectedChannel, engagementCenters, selectedDimensions, isClustered]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...topVideos];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'view_count') {
          aValue = aValue || -1;
          bValue = bValue || -1;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [topVideos, sortConfig]);

  if (!allVideos || allVideos.length === 0) {
    return <div className="notification">No videos available.</div>;
  }

  if (topVideos.length === 0) {
    return <div className="notification">Could not calculate recommendations data. Missing engagement center or embeddings.</div>;
  }

  return (
    <div className="box">
      <h2 className="subtitle">Recommendations View</h2>
      <p className="mb-4">Top 100 videos closest to the normalized engagement center of {selectedChannel}.</p>

      <div className="field">
        <label className="label">Filter by Dimensions</label>
        <div className="control">
          <Select
            isMulti
            options={dimensionOptions}
            value={selectedDimensions}
            onChange={setSelectedDimensions}
            placeholder="Select dimensions to compute distance..."
          />
        </div>
      </div>

      <div className="buttons">
        <button
          className={`button ${isClustered ? 'is-danger' : 'is-primary'}`}
          onClick={() => setIsClustered(!isClustered)}
        >
          {isClustered ? 'Remove Clusters' : 'Cluster Videos'}
        </button>
      </div>

      <div style={{ width: '100%', height: 400, marginBottom: '2rem' }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="distance"
              name="Distance"
              domain={['auto', 'auto']}
              label={{ value: 'Distance to Normalized Engagement Center', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              scale="log"
              domain={['auto', 'auto']}
              dataKey="view_count"
              name="Views"
              width={80}
              label={{ value: 'Views', angle: -90, position: 'insideLeft', offset: 0 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Videos" data={chartData}>
              {chartData.map((entry, index) => {
                const isSelectedChannel = entry.channel_name === selectedChannel;

                let fill = '#800080'; // Purple for others
                if (isClustered && entry.cluster !== undefined) {
                  fill = CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length];
                }
                if (isSelectedChannel && !isClustered) {
                  fill = '#ffffff'; // White for selected if not clustered
                }

                const stroke = (isSelectedChannel || isClustered) ? '#000000' : 'none';
                return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} strokeWidth={stroke !== 'none' ? 1 : 0} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {isClustered && chartData.clustersSummary && chartData.clustersSummary.length > 0 && (
        <div className="mb-5">
          <h3 className="subtitle is-5">Cluster Summary</h3>
          <div className="table-container">
            <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
              <thead>
                <tr>
                  <th>Cluster Label</th>
                  <th>Number of Videos</th>
                  <th>Avg Distance</th>
                  <th>Avg Views</th>
                </tr>
              </thead>
              <tbody>
                {chartData.clustersSummary.map((cluster) => (
                  <tr key={cluster.cluster_id}>
                    <td>
                      <span className="tag" style={{ backgroundColor: CLUSTER_COLORS[cluster.cluster_id % CLUSTER_COLORS.length] }}>
                        C{cluster.cluster_id}
                      </span>
                    </td>
                    <td>{cluster.count}</td>
                    <td>{cluster.avg_distance.toFixed(4)}</td>
                    <td>{Math.round(cluster.avg_views).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h3 className="subtitle is-5">Top 100 Videos</h3>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('video_title')}>
                Video Title {sortConfig?.key === 'video_title' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('channel_name')}>
                Channel Name {sortConfig?.key === 'channel_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('distance')}>
                Distance (20D) {sortConfig?.key === 'distance' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('view_count')}>
                Views {sortConfig?.key === 'view_count' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={`${row.video_id}-${idx}`}>
                <td>{row.video_title}</td>
                <td>{row.channel_name}</td>
                <td>{row.distance.toFixed(4)}</td>
                <td>{(row.view_count || -1).toLocaleString()}</td>
                <td>
                  <a href={`https://www.youtube.com/watch?v=${row.video_id}`} target="_blank" rel="noopener noreferrer">
                    Watch
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Recommendations;
