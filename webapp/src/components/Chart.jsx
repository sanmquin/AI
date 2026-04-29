import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Simple color palette for clusters
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.video_title}</strong></p>
        <p>Channel: {data.channel_name}</p>
        <p>Cluster: {data.cluster_name}</p>
        <p>Views: {data.view_count.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function Chart({ data }) {
  // Format data for Recharts (extract x,y from embedding_2d)
  const chartData = data.map(item => ({
    ...item,
    x: item.embedding_2d[0],
    y: item.embedding_2d[1],
  }));

  // Find unique clusters to map colors and legends
  const uniqueClusters = Array.from(new Set(chartData.map(item => item.cluster_name)));

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" name="PCA 1" />
          <YAxis type="number" dataKey="y" name="PCA 2" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend />

          {uniqueClusters.map((clusterName, index) => {
            const clusterData = chartData.filter(item => item.cluster_name === clusterName);
            return (
              <Scatter
                key={clusterName}
                name={clusterName}
                data={clusterData}
                fill={COLORS[index % COLORS.length]}
              >
              </Scatter>
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Chart;
