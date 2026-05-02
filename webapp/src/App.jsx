import { useState, useMemo, useEffect } from 'react';
import 'bulma/css/bulma.min.css';
import ChannelSelector from './components/ChannelSelector';
import Chart from './components/Chart';
import Table from './components/Table';
import ClusterStats from './components/ClusterStats';
import ChannelsChart from './components/ChannelsChart';
import ChannelStatsTable from './components/ChannelStatsTable';

function App() {
  const [data, setData] = useState([]);
  const [channelsList, setChannelsList] = useState([]);
  const [channelProjections, setChannelProjections] = useState([]);
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
          setData(videos);

          const centroids = channelsData?.artifacts?.channel_centroids_20d || [];
          const extractedChannels = centroids.map(c => c.channel_name);
          // Fallback if channels.json is somehow empty but videos exist
          if (extractedChannels.length === 0 && videos.length > 0) {
             const channelSet = new Set(videos.map(item => item.channel_name));
             setChannelsList(Array.from(channelSet));
          } else {
             setChannelsList(extractedChannels);
          }

          const projections = channelsData?.artifacts?.channel_projection_2d || [];
          setChannelProjections(projections);

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

  // Filter data based on selected channel
  const filteredData = useMemo(() => {
    if (!selectedChannel) return [];
    return data.filter(item => item.channel_name === selectedChannel);
  }, [data, selectedChannel]);

  const channelStats = useMemo(() => {
    const statsMap = new Map();
    data.forEach(item => {
      if (!statsMap.has(item.channel_name)) {
        statsMap.set(item.channel_name, {
          channel_name: item.channel_name,
          best_k_for_channel: item.best_k_for_channel,
          best_adj_r2_for_channel: item.best_adj_r2_for_channel
        });
      }
    });
    const statsArray = Array.from(statsMap.values());
    statsArray.sort((a, b) => {
      const aVal = a.best_adj_r2_for_channel ?? -Infinity;
      const bVal = b.best_adj_r2_for_channel ?? -Infinity;
      return bVal - aVal;
    });
    return statsArray;
  }, [data]);

  if (loading) {
    return <div className="container p-4"><p>Loading data...</p></div>;
  }

  if (error) {
    return <div className="container p-4"><div className="notification is-danger">{error}</div></div>;
  }

  const handleHomeClick = () => {
    setSelectedChannel('');
  };

  return (
    <div className="container p-4">
      <nav className="navbar mb-4" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <a className="title is-4 mb-0 navbar-item" onClick={handleHomeClick}>
            Video & Cluster Visualization
          </a>
        </div>
      </nav>

      <div className="box">
        <ChannelSelector
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      </div>

      {!selectedChannel ? (
        <>
          <div className="box">
            <h2 className="subtitle">Channels Overview (2D Projection)</h2>
            <ChannelsChart data={channelProjections} />
          </div>
          <div className="box">
            <h2 className="subtitle">Channel Cluster Performance</h2>
            <ChannelStatsTable data={channelStats} onSelectChannel={setSelectedChannel} />
          </div>
        </>
      ) : (
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
