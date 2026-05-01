import { useState, useMemo, useEffect } from 'react';
import 'bulma/css/bulma.min.css';
import ChannelSelector from './components/ChannelSelector';
import Chart from './components/Chart';
import Table from './components/Table';
import ClusterStats from './components/ClusterStats';

function App() {
  const [data, setData] = useState([]);
  const [channelsList, setChannelsList] = useState([]);
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
    </div>
  );
}

export default App;
