import { useState, useMemo } from 'react';
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

function ChannelsChart({ data, videos }) {
  const [showCenters, setShowCenters] = useState(false);

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
              fill="#8884d8"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChannelsChart;
