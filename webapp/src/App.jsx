import { useState, useMemo, useEffect } from 'react';
import 'bulma/css/bulma.min.css';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChannelSelector from './components/ChannelSelector';
import Chart from './components/Chart';
import Table from './components/Table';
import ClusterStats from './components/ClusterStats';

const HOME_CHART_COLOR = '#3273dc';

const HomeProjectionTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  return (
    <div className="box" style={{ padding: '10px' }}>
      <p><strong>{point.channel_name}</strong></p>
      <p>Projection: ({point.x.toFixed(3)}, {point.y.toFixed(3)})</p>
    </div>
  );
};

function App() {
  const [data, setData] = useState([]);
  const [channelsList, setChannelsList] = useState([]);
  const [channelProjection, setChannelProjection] = useState([]);
  const [channelMetrics, setChannelMetrics] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch('/clusters.json').then(res => {
        if (!res.ok) throw new Error('Failed to load clusters.json');
        return res.json();
      }),
      fetch('/channels.json').then(res => {
        if (!res.ok) throw new Error('Failed to load channels.json');
        return res.json();
      })
    ])
      .then(([clustersData, channelsData]) => {
        if (isMounted) {
          const videos = clustersData?.artifacts?.videos_clustered || [];
          const metrics = clustersData?.artifacts?.channel_metrics || [];
          const projections = channelsData?.artifacts?.channel_projection_2d || [];
          setData(videos);
          setChannelMetrics(metrics);
          setChannelProjection(projections);

          const extractedChannels = projections.map(c => c.channel_name);
          if (extractedChannels.length === 0 && videos.length > 0) {
             const channelSet = new Set(videos.map(item => item.channel_name));
             setChannelsList(Array.from(channelSet));
          } else {
             setChannelsList(extractedChannels);
          }

          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const channels = useMemo(() => channelsList, [channelsList]);

  const filteredData = useMemo(() => {
    if (!selectedChannel) return [];
    return data.filter(item => item.channel_name === selectedChannel);
  }, [data, selectedChannel]);

  const orderedChannelMetrics = useMemo(
    () => [...channelMetrics].sort((a, b) => (b.best_adj_r2 ?? Number.NEGATIVE_INFINITY) - (a.best_adj_r2 ?? Number.NEGATIVE_INFINITY)),
    [channelMetrics]
  );

  if (loading) {
    return <div className="container p-4"><p>Loading data...</p></div>;
  }

  if (error) {
    return <div className="container p-4"><div className="notification is-danger">{error}</div></div>;
  }

  return (
    <div className="container p-4">
      <h1 className="title">Video & Cluster Visualization</h1>

      <div className="box">
        <ChannelSelector
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      </div>

      {!selectedChannel && (
        <>
          <div className="box">
            <h2 className="subtitle">Channel Projection (2D)</h2>
            <div style={{ width: '100%', height: 420 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis type="number" dataKey="x" name="Projection X" />
                  <YAxis type="number" dataKey="y" name="Projection Y" />
                  <Tooltip content={<HomeProjectionTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={channelProjection} fill={HOME_CHART_COLOR} name="Channels" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="box">
            <h2 className="subtitle">Cluster Performance by Channel</h2>
            <div className="table-container">
              <table className="table is-fullwidth is-striped is-hoverable">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Primary Metric (Adj R²)</th>
                    <th>Best K</th>
                    <th>Videos</th>
                    <th>Eligible</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedChannelMetrics.map((metric) => (
                    <tr key={metric.channel_name}>
                      <td>{metric.channel_name}</td>
                      <td>{(metric.best_adj_r2 ?? 0).toFixed(4)}</td>
                      <td>{metric.best_k ?? 'N/A'}</td>
                      <td>{metric.n_videos ?? 0}</td>
                      <td>{metric.eligible ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedChannel && (
        <>
          <div className="columns">
            <div className="column is-full">
              <div className="box">
                <h2 className="subtitle">Cluster Visualization (2D Embeddings)</h2>
                <Chart data={filteredData} />
              </div>
            </div>
          </div>

          <ClusterStats data={filteredData} />

          <div className="box">
            <h2 className="subtitle">Video List</h2>
            <Table data={filteredData} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
