import { useState, useMemo, useEffect } from 'react';
import 'bulma/css/bulma.min.css';
import ChannelSelector from './components/ChannelSelector';
import Chart from './components/Chart';
import Table from './components/Table';
import ClusterStats from './components/ClusterStats';

function App() {
  const [data, setData] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load data');
        }
        return response.json();
      })
      .then(jsonData => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Extract unique channels
  const channels = useMemo(() => {
    const channelSet = new Set(data.map(item => item.channel_name));
    return Array.from(channelSet);
  }, [data]);

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
