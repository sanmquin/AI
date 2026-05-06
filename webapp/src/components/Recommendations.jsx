import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.video_title}</strong></p>
        <p>Channel: {data.channel_name}</p>
        <p>Distance: {data.distance.toFixed(4)}</p>
        <p>Views: {Math.round(data.views).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function Recommendations({ videos, selectedChannel, engagementCenters }) {
  const chartData = useMemo(() => {
    if (!videos || !selectedChannel || !engagementCenters) return [];

    const centerData = engagementCenters.find(c => c.channel_name === selectedChannel);
    if (!centerData || !centerData.engagement_center_20d) return [];

    const center20D = centerData.engagement_center_20d;

    const euclideanDistance20D = (vecA, vecB) => {
      let sumSquare = 0;
      for (let i = 0; i < 20; i++) {
        const diff = vecA[i] - vecB[i];
        sumSquare += diff * diff;
      }
      return Math.sqrt(sumSquare);
    };

    const videosWithDistance = [];
    videos.forEach(v => {
      if (v.embedding_20d && v.embedding_20d.length === 20) {
        const distance = euclideanDistance20D(v.embedding_20d, center20D);
        const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);
        videosWithDistance.push({
          ...v,
          distance,
          views
        });
      }
    });

    videosWithDistance.sort((a, b) => a.distance - b.distance);
    return videosWithDistance.slice(0, 100);
  }, [videos, selectedChannel, engagementCenters]);

  if (!chartData || chartData.length === 0) {
    return <div className="notification">No recommendations available for this channel.</div>;
  }

  // Find unique channels to map colors
  const uniqueChannels = Array.from(new Set(chartData.map(item => item.channel_name)));

  return (
    <div className="box">
      <h2 className="subtitle">Recommended Videos</h2>
      <p className="mb-4">Top 100 videos closest to the engagement center of <strong>{selectedChannel}</strong> across all channels.</p>

      <div style={{ width: '100%', height: 500 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="distance"
              name="Distance"
              label={{ value: 'Distance to Engagement Center (20D)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="views"
              name="Views"
              width={100}
              label={{ value: 'Views', angle: -90, position: 'insideLeft', offset: 0 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            {uniqueChannels.map((channelName, index) => {
              const channelData = chartData.filter(item => item.channel_name === channelName);
              return (
                <Scatter
                  key={channelName}
                  name={channelName}
                  data={channelData}
                  fill={COLORS[index % COLORS.length]}
                >
                  {channelData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Scatter>
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Recommendations;
