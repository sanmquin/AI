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
  const [dataSource, setDataSource] = useState('clusters.json');

  useEffect(() => {
    let isMounted = true;

    fetch(`/${dataSource}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load data from ${dataSource}`);
        }
        return response.json();
      })
      .then(jsonData => {
        if (isMounted) {
          setData(jsonData);
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
  }, [dataSource]);

  const handleDataSourceChange = (newSource) => {
    setLoading(true);
    setDataSource(newSource);
  };

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
        <div className="field mb-4">
          <label className="label">Data Source</label>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="dataSource"
                value="clusters.json"
                checked={dataSource === 'clusters.json'}
                onChange={() => handleDataSourceChange('clusters.json')}
                className="mr-2"
              />
              clusters.json
            </label>
            <label className="radio">
              <input
                type="radio"
                name="dataSource"
                value="data.json"
                checked={dataSource === 'data.json'}
                onChange={() => handleDataSourceChange('data.json')}
                className="mr-2"
              />
              data.json
            </label>
          </div>
        </div>

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
