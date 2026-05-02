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

function ChannelsChart({ data, onSelectChannel }) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" name="X" hide={true} />
          <YAxis type="number" dataKey="y" name="Y" hide={true} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter
            name="Channels"
            data={data}
            fill="#8884d8"
            onClick={(e) => {
              if (e && e.channel_name) {
                onSelectChannel(e.channel_name);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ChannelsChart;
