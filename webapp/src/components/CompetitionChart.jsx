import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isCluster) {
      return (
        <div className="box" style={{ padding: '10px' }}>
          <p><strong>{data.channel_name} - Cluster {data.cluster_name}</strong></p>
          <p>Distance: {data.distance.toFixed(4)}</p>
          <p>Avg Views: {Math.round(data.avgViews).toLocaleString()}</p>
        </div>
      );
    }
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

const CustomYAxisTick = ({ x, y, payload, targetAvgViews }) => {
  const isTarget = Math.round(payload.value) === Math.round(targetAvgViews);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill={isTarget ? "red" : "#666"} fontSize={12}>
        {payload.value.toLocaleString()}
      </text>
    </g>
  );
};

function CompetitionChart({ videos, selectedChannel }) {
  const [selectedClusterState, setSelectedCluster] = useState('');
  const [prevSelectedChannel, setPrevSelectedChannel] = useState(selectedChannel);
  const [expandedChannel, setExpandedChannel] = useState('');

  // Derive selectedCluster based on channel change to avoid useEffect
  let selectedCluster = selectedClusterState;
  let expandedChannelLocal = expandedChannel;
  if (selectedChannel !== prevSelectedChannel) {
    selectedCluster = '';
    expandedChannelLocal = '';
    setPrevSelectedChannel(selectedChannel);
    setSelectedCluster('');
    setExpandedChannel('');
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

  const { chartData, selectedTargetStats, maxDistance, links } = useMemo(() => {
    if (!videos || !selectedChannel) return { chartData: [], selectedTargetStats: null, maxDistance: 0, links: [] };

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

    if (!targetCenter20D) return { chartData: [], selectedTargetStats: { avgViews: targetAvgViews }, maxDistance: 0, links: [] };

    const data = [];
    const linkData = [];
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

    // Calculate Expanded Channel Clusters

    if (expandedChannelLocal) {
        const expCenter20D = getChannelCenter20D(expandedChannelLocal);
        const expStats = channelStats.get(expandedChannelLocal);
        if (expCenter20D && expStats && expStats.count > 0) {
           const expDist = euclideanDistance20D(expCenter20D, targetCenter20D);
           const expAvgViews = expStats.sumViews / expStats.count;


           // Group videos of expanded channel by cluster
           const clusterMap = new Map();
           videos.forEach(v => {
             if (v.channel_name === expandedChannelLocal && v.cluster_name) {
                if (!clusterMap.has(v.cluster_name)) {
                   clusterMap.set(v.cluster_name, { sumViews: 0, count: 0, sumEmbedding: new Array(20).fill(0) });
                }
                const clEntry = clusterMap.get(v.cluster_name);
                const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);
                const embedding = v.embedding_20d;

                if (embedding && embedding.length === 20) {
                  for (let i = 0; i < 20; i++) {
                    clEntry.sumEmbedding[i] += embedding[i];
                  }
                  clEntry.sumViews += views;
                  clEntry.count += 1;
                }
             }
           });

           // Add clusters to data and links
           clusterMap.forEach((stats, clusterName) => {
             if (stats.count > 0) {
                const clusterCenter20D = stats.sumEmbedding.map(sum => sum / stats.count);
                const clusterDist = euclideanDistance20D(clusterCenter20D, targetCenter20D);
                const clusterAvgViews = Math.max(1, stats.sumViews / stats.count);

                if (clusterDist > maxDist) maxDist = clusterDist;

                data.push({
                   isCluster: true,
                   channel_name: expandedChannelLocal,
                   cluster_name: clusterName,
                   distance: clusterDist,
                   avgViews: clusterAvgViews,
                   color: "#8884d8" // Default cluster color, can be randomized
                });

                linkData.push({
                   x1: expDist,
                   y1: Math.max(1, expAvgViews),
                   x2: clusterDist,
                   y2: clusterAvgViews,
                   color: "#ccc"
                });
             }
           });
        }
    }


    channelStats.forEach((stats, channelName) => {
      if (channelName === selectedChannel) return; // Skip selected channel itself

      const channelCenter20D = getChannelCenter20D(channelName);
      if (!channelCenter20D) return;

      const distance = euclideanDistance20D(channelCenter20D, targetCenter20D);
      const avgViews = Math.max(1, stats.count > 0 ? stats.sumViews / stats.count : 0);

      if (distance > maxDist) maxDist = distance;

      data.push({
        channel_name: channelName,
        distance,
        avgViews,
        isExpandedCenter: channelName === expandedChannelLocal
      });
    });

    return { chartData: data, selectedTargetStats: { avgViews: Math.max(1, targetAvgViews) }, maxDistance: maxDist, links: linkData };
  }, [videos, selectedChannel, selectedCluster, expandedChannelLocal]);

  const [sortConfig, setSortConfig] = useState(null);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...chartData].filter(d => !d.isCluster);
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

  // Compute log ticks and include targetAvgViews
  let ticks = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];
  if (selectedTargetStats && selectedTargetStats.avgViews > 0) {
      // Create a new array and sort it so Recharts doesn't get confused
      ticks = Array.from(new Set([...ticks, selectedTargetStats.avgViews])).sort((a,b) => a - b);
  }

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
              <ScatterChart margin={{ top: 20, right: 60, bottom: 20, left: 40 }}>
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
                  scale="log"
                  domain={['auto', 'auto']}
                  allowDataOverflow={true}
                  ticks={ticks}
                  tick={<CustomYAxisTick targetAvgViews={selectedTargetStats?.avgViews} />}
                  label={{ value: 'Average Views', angle: -90, position: 'insideLeft', offset: -20 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                {links && links.map((link, idx) => (
                   <ReferenceLine
                     key={`link-${idx}`}
                     segment={[{ x: link.x1, y: link.y1 }, { x: link.x2, y: link.y2 }]}
                     stroke={link.color || "#ccc"}
                     strokeWidth={1}
                     strokeDasharray="3 3"
                   />
                ))}

                <Scatter
                   name="Channels"
                   data={chartData}
                   onClick={(e) => {
                     if (!e) return;
                     if (e.channel_name === expandedChannelLocal && !e.isCluster) {
                        setExpandedChannel('');
                     } else if (!e.isCluster) {
                        setExpandedChannel(e.channel_name);
                     }
                   }}
                >
                  {chartData.map((entry, index) => {
                     const fill = entry.isExpandedCenter ? "#ffffff" : (entry.isCluster ? (entry.color || "#8884d8") : (entry.avgViews > (selectedTargetStats?.avgViews || 0) ? "#2ca02c" : "#d62728"));
                     const stroke = entry.isExpandedCenter ? "#000000" : "none";
                     return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} strokeWidth={entry.isExpandedCenter ? 1 : 0} style={{ cursor: entry.isCluster ? "default" : "pointer" }} />;
                  })}
                </Scatter>
                {selectedTargetStats && selectedTargetStats.avgViews > 0 && (
                  <ReferenceLine
                    segment={[{ x: 0, y: selectedTargetStats.avgViews }, { x: maxX, y: selectedTargetStats.avgViews }]}
                    stroke="red"
                    strokeDasharray="3 3"
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
