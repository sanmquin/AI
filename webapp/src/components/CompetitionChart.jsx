import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.channel_name}</strong></p>
        <p>Distance: {data.distance.toFixed(4)}</p>
        <p>Avg Views: {Math.round(data.avgViews).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function CompetitionChart({ videos, selectedChannel }) {
  const [selectedClusterState, setSelectedCluster] = useState('');
  const [prevSelectedChannel, setPrevSelectedChannel] = useState(selectedChannel);

  // Derive selectedCluster based on channel change to avoid useEffect
  let selectedCluster = selectedClusterState;
  if (selectedChannel !== prevSelectedChannel) {
    selectedCluster = '';
    setPrevSelectedChannel(selectedChannel);
    setSelectedCluster('');
  }

  // Extract unique clusters for the selected channel
  const availableClusters = useMemo(() => {
    if (!videos || !selectedChannel) return [];
    const clusters = new Set();
    videos.forEach(v => {
      if (v.channel_name === selectedChannel && v.cluster_name) {
        clusters.add(v.cluster_name);
      }
    });
    return Array.from(clusters).sort();
  }, [videos, selectedChannel]);

  const { chartData, selectedTargetStats, maxDistance } = useMemo(() => {
    if (!videos || !selectedChannel) return { chartData: [], selectedTargetStats: null, maxDistance: 0 };

    const channelStats = new Map();

    // First pass: Calculate 20D centers and avg views for ALL channels
    videos.forEach(v => {
      const channelName = v.channel_name;
      if (!channelStats.has(channelName)) {
        channelStats.set(channelName, {
          sumViews: 0,
          count: 0,
          sumEmbedding: new Array(20).fill(0)
        });
      }

      const stats = channelStats.get(channelName);
      const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);
      const embedding = v.embedding_20d;

      if (embedding && embedding.length === 20) {
        for (let i = 0; i < 20; i++) {
          stats.sumEmbedding[i] += embedding[i];
        }
        stats.sumViews += views;
        stats.count += 1;
      }
    });

    const getChannelCenter20D = (channelName) => {
      const stats = channelStats.get(channelName);
      if (stats && stats.count > 0) {
        return stats.sumEmbedding.map(sum => sum / stats.count);
      }
      return null;
    };

    // Determine target center (either whole channel or specific cluster)
    let targetCenter20D = null;
    let targetAvgViews = 0;

    if (selectedCluster) {
      // Calculate center and avg views specifically for the selected cluster
      let sumViews = 0;
      let count = 0;
      let sumEmbedding = new Array(20).fill(0);

      videos.forEach(v => {
        if (v.channel_name === selectedChannel && v.cluster_name === selectedCluster) {
          const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);
          const embedding = v.embedding_20d;

          if (embedding && embedding.length === 20) {
            for (let i = 0; i < 20; i++) {
              sumEmbedding[i] += embedding[i];
            }
            sumViews += views;
            count += 1;
          }
        }
      });

      if (count > 0) {
        targetCenter20D = sumEmbedding.map(sum => sum / count);
        targetAvgViews = sumViews / count;
      }
    } else {
      // Use the whole channel's center and avg views
      targetCenter20D = getChannelCenter20D(selectedChannel);
      const selStats = channelStats.get(selectedChannel);
      if (selStats && selStats.count > 0) {
        targetAvgViews = selStats.sumViews / selStats.count;
      }
    }

    if (!targetCenter20D) return { chartData: [], selectedTargetStats: { avgViews: targetAvgViews }, maxDistance: 0 };

    const data = [];
    let maxDist = 0;

    // Calculate Euclidean distance in 20D space
    const euclideanDistance20D = (vecA, vecB) => {
      let sumSquare = 0;
      for (let i = 0; i < 20; i++) {
        const diff = vecA[i] - vecB[i];
        sumSquare += diff * diff;
      }
      return Math.sqrt(sumSquare);
    };

    channelStats.forEach((stats, channelName) => {
      if (channelName === selectedChannel) return; // Skip selected channel itself

      const channelCenter20D = getChannelCenter20D(channelName);
      if (!channelCenter20D) return;

      const distance = euclideanDistance20D(channelCenter20D, targetCenter20D);
      const avgViews = stats.count > 0 ? stats.sumViews / stats.count : 0;

      if (distance > maxDist) maxDist = distance;

      data.push({
        channel_name: channelName,
        distance,
        avgViews
      });
    });

    return { chartData: data, selectedTargetStats: { avgViews: targetAvgViews }, maxDistance: maxDist };
  }, [videos, selectedChannel, selectedCluster]);

  const [sortConfig, setSortConfig] = useState(null);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...chartData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [chartData, sortConfig]);

  if (!videos || videos.length === 0) {
    return <div className="notification">No data available for competition view.</div>;
  }

  // To draw a horizontal line across the scatter chart using the segment prop
  // The X axis is distance, from 0 to maxDistance (plus some padding)
  const maxX = maxDistance * 1.05;

  return (
    <div className="box">
      <h2 className="subtitle">Competition View</h2>

      <div className="field">
        <label className="label">Select Target</label>
        <div className="control">
          <div className="select">
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
            >
              <option value="">Channel Center (All Videos)</option>
              {availableClusters.map((clusterName, idx) => (
                <option key={idx} value={clusterName}>{clusterName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <div style={{ width: '100%', height: 400, marginBottom: '2rem' }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="distance"
                  name="Distance"
                  domain={[0, 'dataMax + 0.05']}
                  label={{ value: 'Distance to Target Center (20D)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="avgViews"
                  name="Average Views"
                  width={80}
                  label={{ value: 'Average Views', angle: -90, position: 'insideLeft', offset: 0 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Channels" data={chartData} fill="#8884d8">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#8884d8" />
                  ))}
                </Scatter>
                {selectedTargetStats && selectedTargetStats.avgViews > 0 && (
                  <ReferenceLine
                    segment={[{ x: 0, y: selectedTargetStats.avgViews }, { x: maxX, y: selectedTargetStats.avgViews }]}
                    stroke="red"
                    strokeDasharray="3 3"
                    label={{ position: 'top', value: 'Target Avg Views', fill: 'red' }}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <h3 className="subtitle is-5">Competitors</h3>
          <div className="table-container">
            <table className="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('channel_name')}>
                    Channel Name {sortConfig?.key === 'channel_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('distance')}>
                    Distance (20D) {sortConfig?.key === 'distance' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('avgViews')}>
                    Average Views {sortConfig?.key === 'avgViews' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.channel_name}</td>
                    <td>{row.distance.toFixed(4)}</td>
                    <td>{Math.round(row.avgViews).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="notification">Could not calculate competition data.</div>
      )}
    </div>
  );
}

export default CompetitionChart;
