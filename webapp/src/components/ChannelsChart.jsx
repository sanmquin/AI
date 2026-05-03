import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isCluster) {
      return (
        <div className="box" style={{ padding: '10px' }}>
          <p><strong>{data.channel_name}</strong></p>
          <p>Cluster: {data.cluster_name}</p>
          <p>Avg Views: {data.avgViews.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      );
    }
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.channel_name}</strong></p>
        {data.isExpanded && <p><em>Expanded</em></p>}
      </div>
    );
  }
  return null;
};

// Interpolates between low (blue) and high (red) using engagement percentage
const getEngagementColor = (percentage) => {
  const p = Math.max(0, Math.min(1, percentage));
  // Simple gradient from Blue (#0000FF) to Red (#FF0000)
  const r = Math.round(255 * p);
  const b = Math.round(255 * (1 - p));
  const g = 0;
  return `rgb(${r},${g},${b})`;
};

function ChannelsChart({ data, videos, selectedChannels = [] }) {
  const [showCenters, setShowCenters] = useState(false);

  // Compute channel centers
  const channelsData = useMemo(() => {
    if (!videos || videos.length === 0) return { centers: [] };

    const channelMap = new Map();
    videos.forEach(v => {
      if (!channelMap.has(v.channel_name)) {
        channelMap.set(v.channel_name, { sumX: 0, sumY: 0, count: 0 });
      }
      const entry = channelMap.get(v.channel_name);
      const x = v.x ?? (v.embedding_2d && v.embedding_2d[0]) ?? 0;
      const y = v.y ?? (v.embedding_2d && v.embedding_2d[1]) ?? 0;
      entry.sumX += x;
      entry.sumY += y;
      entry.count += 1;
    });

    const centers = Array.from(channelMap.entries()).map(([channel_name, stats]) => {
      return {
        channel_name,
        x: stats.sumX / stats.count,
        y: stats.sumY / stats.count,
        isCluster: false,
        isExpanded: selectedChannels.includes(channel_name)
      };
    });

    return { centers };
  }, [videos, selectedChannels]);

  // Compute cluster centers for expanded channels
  const expandedClustersData = useMemo(() => {
    if (!videos || videos.length === 0 || selectedChannels.length === 0) return [];

    const clusterMap = new Map(); // key: channel_name + '||' + cluster_name
    let minViews = Infinity;
    let maxViews = -Infinity;

    videos.forEach(v => {
      if (!selectedChannels.includes(v.channel_name)) return;

      const key = `${v.channel_name}||${v.cluster_name}`;
      if (!clusterMap.has(key)) {
        clusterMap.set(key, { channel_name: v.channel_name, cluster_name: v.cluster_name, sumX: 0, sumY: 0, sumViews: 0, count: 0 });
      }
      const entry = clusterMap.get(key);
      const x = v.x ?? (v.embedding_2d && v.embedding_2d[0]) ?? 0;
      const y = v.y ?? (v.embedding_2d && v.embedding_2d[1]) ?? 0;
      entry.sumX += x;
      entry.sumY += y;
      entry.sumViews += (v.view_count || 0);
      entry.count += 1;
    });

    const clusters = Array.from(clusterMap.values()).map(stats => {
      const avgViews = stats.sumViews / stats.count;
      if (avgViews < minViews) minViews = avgViews;
      if (avgViews > maxViews) maxViews = avgViews;
      return {
        channel_name: stats.channel_name,
        cluster_name: stats.cluster_name,
        x: stats.sumX / stats.count,
        y: stats.sumY / stats.count,
        avgViews,
        isCluster: true
      };
    });

    // Compute color based on log view scale
    const safeMin = Math.log1p(minViews);
    const safeMax = Math.log1p(maxViews);
    const range = safeMax - safeMin || 1; // avoid division by zero

    clusters.forEach(c => {
      const logViews = Math.log1p(c.avgViews);
      const percentage = (logViews - safeMin) / range;
      c.fillColor = getEngagementColor(percentage);
    });

    return clusters;
  }, [videos, selectedChannels]);

  // Combine data for display
  const { channelPoints, clusterPoints } = useMemo(() => {
    if (!showCenters) {
      // Just map normal 2D projection data to retain compatibility,
      // but inject expanded state to highlight selected channels if needed.
      const mappedData = (data || []).map(d => ({
        ...d,
        isExpanded: selectedChannels.includes(d.channel_name)
      }));
      return { channelPoints: mappedData, clusterPoints: [] };
    }

    // showCenters is true
    // all channel centers stay, but are marked if expanded
    return { channelPoints: channelsData.centers, clusterPoints: expandedClustersData };
  }, [showCenters, data, channelsData, selectedChannels, expandedClustersData]);

  if (!data || data.length === 0) return null;

  return (
    <div>
      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showCenters}
              onChange={(e) => setShowCenters(e.target.checked)}
              className="mr-2"
            />
            Show computed channel centers
          </label>
        </div>
      </div>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" name="X" hide={true} />
            <YAxis type="number" dataKey="y" name="Y" hide={true} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

            <Scatter
              name="Channels"
              data={channelPoints}
            >
              {channelPoints.map((entry, index) => {
                // If it's an expanded channel center, make it white with a stroke.
                // Otherwise normal purple.
                const fill = entry.isExpanded && showCenters ? "#ffffff" : "#8884d8";
                const stroke = entry.isExpanded && showCenters ? "#8884d8" : "none";
                const strokeWidth = entry.isExpanded && showCenters ? 2 : 0;
                return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
              })}
            </Scatter>

            {clusterPoints.length > 0 && (
              <Scatter
                name="Clusters"
                data={clusterPoints}
              >
                {clusterPoints.map((entry, index) => (
                   <Cell key={`cluster-cell-${index}`} fill={entry.fillColor} />
                ))}
              </Scatter>
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChannelsChart;
