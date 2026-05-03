import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.channel_name}</strong></p>
      </div>
    );
  }
  return null;
};

const engagementColor = (normalizedValue) => {
  const clamped = Math.max(0, Math.min(1, normalizedValue));
  const red = Math.round(255 * clamped);
  const green = Math.round(255 * (1 - clamped));
  return `rgb(${red}, ${green}, 0)`;
};

function ChannelsChart({ data, videos, showCenters, setShowCenters, selectedChannels }) {

  const centersData = useMemo(() => {
    if (!videos || videos.length === 0) return [];

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

    return Array.from(channelMap.entries()).map(([channel_name, stats]) => ({
      channel_name,
      x: stats.sumX / stats.count,
      y: stats.sumY / stats.count,
    }));
  }, [videos]);

  const displayData = showCenters ? centersData : data;

  const channelClusterPoints = useMemo(() => {
    if (!showCenters || !Array.isArray(selectedChannels) || selectedChannels.length === 0) {
      return [];
    }

    return selectedChannels.flatMap((channelName) => {
      const channelVideos = videos.filter(v => v.channel_name === channelName);
      if (channelVideos.length === 0) return [];

      const clusterMap = new Map();
      channelVideos.forEach((video) => {
        if (!clusterMap.has(video.cluster_id)) {
          clusterMap.set(video.cluster_id, {
            channel_name: channelName,
            cluster_id: video.cluster_id,
            sumX: 0,
            sumY: 0,
            engagement: 0,
            count: 0,
          });
        }

        const cluster = clusterMap.get(video.cluster_id);
        cluster.sumX += video.x ?? (video.embedding_2d && video.embedding_2d[0]) ?? 0;
        cluster.sumY += video.y ?? (video.embedding_2d && video.embedding_2d[1]) ?? 0;
        cluster.engagement += video.view_count ?? 0;
        cluster.count += 1;
      });

      const clusters = Array.from(clusterMap.values()).map(cluster => ({
        ...cluster,
        x: cluster.sumX / cluster.count,
        y: cluster.sumY / cluster.count,
        engagementAvg: cluster.engagement / cluster.count,
      }));

      const minEngagement = Math.min(...clusters.map(c => c.engagementAvg));
      const maxEngagement = Math.max(...clusters.map(c => c.engagementAvg));
      const engagementRange = maxEngagement - minEngagement;

      return clusters.map(cluster => ({
        ...cluster,
        engagementNormalized: engagementRange > 0
          ? (cluster.engagementAvg - minEngagement) / engagementRange
          : 0.5,
      }));
    });
  }, [showCenters, selectedChannels, videos]);

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
              data={displayData}
              fill={showCenters ? '#ffffff' : '#8884d8'}
            />
            <Scatter
              name="Clusters"
              data={channelClusterPoints}
              shape={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={engagementColor(payload.engagementNormalized)}
                    stroke="#111"
                    strokeWidth={0.5}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChannelsChart;
