import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isClusterCenter) {
      return (
        <div className="box" style={{ padding: '10px' }}>
          <p><strong>{data.channel_name} - Cluster {data.cluster_name}</strong></p>
          <p>Avg Views: {Math.round(data.avg_views).toLocaleString()}</p>
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

function ChannelsChart({ data, videos, showCenters, setShowCenters, selectedChannels = [] }) {
  const { chartData, links } = useMemo(() => {
    if (!showCenters) return { chartData: data, links: [] };
    if (!videos || videos.length === 0) return { chartData: [], links: [] };

    const channelMap = new Map();
    const clusterMap = new Map();

    videos.forEach(v => {
      const channelName = v.channel_name;
      const clusterName = v.cluster_name;
      const x = v.embedding_2d && v.embedding_2d.length >= 2 ? v.embedding_2d[0] : v.x;
      const y = v.embedding_2d && v.embedding_2d.length >= 2 ? v.embedding_2d[1] : v.y;
      const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);

      // Channel stats
      if (!channelMap.has(channelName)) {
        channelMap.set(channelName, { sumX: 0, sumY: 0, count: 0 });
      }
      const cEntry = channelMap.get(channelName);
      cEntry.sumX += x;
      cEntry.sumY += y;
      cEntry.count += 1;

      // Cluster stats (only needed for selected channels)
      if (selectedChannels.includes(channelName)) {
        const clusterKey = `${channelName}-${clusterName}`;
        if (!clusterMap.has(clusterKey)) {
          clusterMap.set(clusterKey, {
            channel_name: channelName,
            cluster_name: clusterName,
            sumX: 0,
            sumY: 0,
            totalViews: 0,
            count: 0
          });
        }
        const clEntry = clusterMap.get(clusterKey);
        clEntry.sumX += x;
        clEntry.sumY += y;
        clEntry.totalViews += views;
        clEntry.count += 1;
      }
    });

    const resultData = [];
    const linksData = [];

    // Process channels
    channelMap.forEach((stats, channel_name) => {
      const isSelected = selectedChannels.includes(channel_name);

      const cx = stats.sumX / stats.count;
      const cy = stats.sumY / stats.count;

      // Add the channel center
      resultData.push({
        isChannelCenter: true,
        channel_name,
        x: cx,
        y: cy,
        isSelected
      });

      // If selected, add its clusters
      if (isSelected) {
        const channelClusters = Array.from(clusterMap.values()).filter(c => c.channel_name === channel_name);

        const avgViews = channelClusters.map(c => c.totalViews / c.count);
        const minViews = Math.min(...avgViews);
        const maxViews = Math.max(...avgViews);

        channelClusters.forEach(c => {
          const avg = c.totalViews / c.count;
          let ratio = 0;
          if (maxViews > minViews) {
            ratio = (avg - minViews) / (maxViews - minViews);
          }
          const r = Math.round(255 * (1 - ratio));
          const g = Math.round(255 * ratio);
          const b = 0;

          const clx = c.sumX / c.count;
          const cly = c.sumY / c.count;

          linksData.push({
            channel_name: c.channel_name,
            cluster_name: c.cluster_name,
            x1: cx,
            y1: cy,
            x2: clx,
            y2: cly,
            color: `rgb(${r}, ${g}, ${b})`
          });

          resultData.push({
            isClusterCenter: true,
            channel_name: c.channel_name,
            cluster_name: c.cluster_name,
            x: clx,
            y: cly,
            avg_views: avg,
            color: `rgb(${r}, ${g}, ${b})`
          });
        });
      }
    });

    return { chartData: resultData, links: linksData };
  }, [data, videos, showCenters, selectedChannels]);

  if (!chartData || chartData.length === 0) return null;

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
            {showCenters && links && links.map((link, idx) => (
              <ReferenceLine
                key={`link-${idx}`}
                segment={[{ x: link.x1, y: link.y1 }, { x: link.x2, y: link.y2 }]}
                stroke={link.color || "#ccc"}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ))}
            {showCenters ? (
              <Scatter name="Channels" data={chartData}>
                {chartData.map((entry, index) => {
                  let fill = "#8884d8"; // Default channel color
                  if (entry.isChannelCenter && entry.isSelected) {
                    fill = "#ffffff"; // Selected channel center
                  } else if (entry.isClusterCenter) {
                    fill = entry.color; // Cluster color
                  }
                  return <Cell key={`cell-${index}`} fill={fill} stroke="#000000" strokeWidth={entry.isChannelCenter && entry.isSelected ? 1 : 0} />;
                })}
              </Scatter>
            ) : (
              <Scatter
                name="Channels"
                data={chartData}
                fill="#8884d8"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChannelsChart;
