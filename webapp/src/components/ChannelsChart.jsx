import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isCluster) {
      return (
        <div className="box" style={{ padding: '10px' }}>
          <p><strong>{data.channel_name}</strong></p>
          <p>Cluster: {data.cluster_name}</p>
        </div>
      );
    }
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.channel_name}</strong></p>
      </div>
    );
  }
  return null;
};

function ChannelsChart({ data, videos }) {
  const [showCenters, setShowCenters] = useState(false);
  const [expandedChannels, setExpandedChannels] = useState([]);

  // Compute channel centers
  const channelsData = useMemo(() => {
    if (!videos || videos.length === 0) return { centers: [], channelNames: [] };

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

    const channelNames = Array.from(channelMap.keys()).sort();
    const centers = channelNames.map((channel_name) => {
      const stats = channelMap.get(channel_name);
      return {
        channel_name,
        x: stats.sumX / stats.count,
        y: stats.sumY / stats.count,
        isCluster: false
      };
    });

    return { centers, channelNames };
  }, [videos]);

  // Compute cluster centers for expanded channels
  const expandedClustersData = useMemo(() => {
    if (!videos || videos.length === 0 || expandedChannels.length === 0) return [];

    const clusterMap = new Map(); // key: channel_name + '||' + cluster_name
    videos.forEach(v => {
      if (!expandedChannels.includes(v.channel_name)) return;

      const key = `${v.channel_name}||${v.cluster_name}`;
      if (!clusterMap.has(key)) {
        clusterMap.set(key, { channel_name: v.channel_name, cluster_name: v.cluster_name, sumX: 0, sumY: 0, count: 0 });
      }
      const entry = clusterMap.get(key);
      const x = v.x ?? (v.embedding_2d && v.embedding_2d[0]) ?? 0;
      const y = v.y ?? (v.embedding_2d && v.embedding_2d[1]) ?? 0;
      entry.sumX += x;
      entry.sumY += y;
      entry.count += 1;
    });

    return Array.from(clusterMap.values()).map(stats => ({
      channel_name: stats.channel_name,
      cluster_name: stats.cluster_name,
      x: stats.sumX / stats.count,
      y: stats.sumY / stats.count,
      isCluster: true
    }));
  }, [videos, expandedChannels]);

  // Combine data for display
  const { channelPoints, clusterPoints } = useMemo(() => {
    if (!showCenters) {
      return { channelPoints: data, clusterPoints: [] };
    }

    // showCenters is true
    // channelPoints: channel centers that are NOT expanded
    const channelPoints = channelsData.centers.filter(c => !expandedChannels.includes(c.channel_name));
    return { channelPoints, clusterPoints: expandedClustersData };
  }, [showCenters, data, channelsData, expandedChannels, expandedClustersData]);

  const handleSelectChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setExpandedChannels(options);
  };

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

      {showCenters && channelsData.channelNames.length > 0 && (
        <div className="field">
          <label className="label">Expand Channels into Clusters</label>
          <div className="control">
            <div className="select is-multiple is-fullwidth">
              <select
                multiple
                size={Math.min(5, channelsData.channelNames.length)}
                value={expandedChannels}
                onChange={handleSelectChange}
              >
                {channelsData.channelNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <p className="help">Hold Ctrl/Cmd to select multiple</p>
          </div>
        </div>
      )}

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" name="X" hide={true} />
            <YAxis type="number" dataKey="y" name="Y" hide={true} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              name="Channels"
              data={channelPoints}
              fill="#8884d8"
            />
            {clusterPoints.length > 0 && (
              <Scatter
                name="Clusters"
                data={clusterPoints}
                fill="#82ca9d"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChannelsChart;
