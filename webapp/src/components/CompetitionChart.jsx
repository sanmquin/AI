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

function CompetitionChart({ videos, channelProjections, selectedChannel }) {
  const [useComputedCenters, setUseComputedCenters] = useState(false);

  const { chartData, selectedChannelStats, maxDistance } = useMemo(() => {
    if (!videos || !selectedChannel) return { chartData: [], selectedChannelStats: null, maxDistance: 0 };

    const channelStats = new Map();
    videos.forEach(v => {
      const channelName = v.channel_name;
      if (!channelStats.has(channelName)) {
        channelStats.set(channelName, { sumX: 0, sumY: 0, count: 0, sumViews: 0 });
      }
      const stats = channelStats.get(channelName);
      const x = v.embedding_2d && v.embedding_2d.length >= 2 ? v.embedding_2d[0] : v.x;
      const y = v.embedding_2d && v.embedding_2d.length >= 2 ? v.embedding_2d[1] : v.y;
      const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);

      if (typeof x === 'number' && typeof y === 'number') {
        stats.sumX += x;
        stats.sumY += y;
      }
      stats.sumViews += views;
      stats.count += 1;
    });

    const getCenter = (channelName) => {
      if (useComputedCenters) {
        const stats = channelStats.get(channelName);
        if (stats && stats.count > 0) {
          return { x: stats.sumX / stats.count, y: stats.sumY / stats.count };
        }
      } else {
        const proj = channelProjections.find(p => p.channel_name === channelName);
        if (proj && typeof proj.x === 'number' && typeof proj.y === 'number') {
          return { x: proj.x, y: proj.y };
        }
      }
      return null;
    };

    const selCenter = getCenter(selectedChannel);
    const selStats = channelStats.get(selectedChannel);
    const selAvgViews = selStats && selStats.count > 0 ? selStats.sumViews / selStats.count : 0;

    if (!selCenter) return { chartData: [], selectedChannelStats: { avgViews: selAvgViews }, maxDistance: 0 };

    const data = [];
    let maxDist = 0;

    channelStats.forEach((stats, channelName) => {
      if (channelName === selectedChannel) return;

      const center = getCenter(channelName);
      if (!center) return;

      const dx = center.x - selCenter.x;
      const dy = center.y - selCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const avgViews = stats.count > 0 ? stats.sumViews / stats.count : 0;

      if (distance > maxDist) maxDist = distance;

      data.push({
        channel_name: channelName,
        distance,
        avgViews
      });
    });

    return { chartData: data, selectedChannelStats: { avgViews: selAvgViews }, maxDistance: maxDist };
  }, [videos, channelProjections, selectedChannel, useComputedCenters]);

  if (!chartData || chartData.length === 0) {
    return <div className="notification">No data available for competition view.</div>;
  }

  // To draw a horizontal line across the scatter chart using the segment prop
  // The X axis is distance, from 0 to maxDistance (plus some padding)
  const maxX = maxDistance * 1.05;

  return (
    <div className="box">
      <h2 className="subtitle">Competition View</h2>
      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={useComputedCenters}
              onChange={(e) => setUseComputedCenters(e.target.checked)}
              className="mr-2"
            />
            Use computed channel centers (vs projections)
          </label>
        </div>
      </div>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="distance"
              name="Distance"
              domain={[0, 'dataMax + 0.05']}
              label={{ value: 'Distance to Selected Channel', position: 'insideBottom', offset: -10 }}
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
            {selectedChannelStats && selectedChannelStats.avgViews > 0 && (
              <ReferenceLine
                segment={[{ x: 0, y: selectedChannelStats.avgViews }, { x: maxX, y: selectedChannelStats.avgViews }]}
                stroke="red"
                strokeDasharray="3 3"
                label={{ position: 'top', value: 'Selected Channel Avg Views', fill: 'red' }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CompetitionChart;
