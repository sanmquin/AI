import { useState, useMemo, useEffect } from 'react';
import 'bulma/css/bulma.min.css';
import ChannelSelector from './components/ChannelSelector';
import Chart from './components/Chart';
import Table from './components/Table';
import ClusterStats from './components/ClusterStats';
import ChannelsChart from './components/ChannelsChart';
import ChannelStatsTable from './components/ChannelStatsTable';
import EngagementMetricsTable from './components/EngagementMetricsTable';
import DimensionChart from './components/DimensionChart';

function App() {
  const [data, setData] = useState([]);
  const [channelsList, setChannelsList] = useState([]);
  const [channelProjections, setChannelProjections] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedChannelsMulti, setSelectedChannelsMulti] = useState([]);
  const [showCenters, setShowCenters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [engagementCenters, setEngagementCenters] = useState([]);
  const [engagementMetrics, setEngagementMetrics] = useState([]);
  const [dimensionDescriptions, setDimensionDescriptions] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

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
      }),
      fetch('/engagement.json').then(res => {
        if (!res.ok) throw new Error('Failed to load engagement.json');
        return res.json();
      }),
      fetch('/descriptions.json').then(res => {
        if (!res.ok) throw new Error('Failed to load descriptions.json');
        return res.json();
      }),
      fetch('/predictions.json').then(res => {
        if (!res.ok) throw new Error('Failed to load predictions.json');
        return res.json();
      })
    ])
      .then(([clustersData, channelsData, engagementData, descriptionsData, predictionsData]) => {
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

          const centers = engagementData?.artifacts?.channel_engagement_centers || [];
          setEngagementCenters(centers);

          const metrics = engagementData?.artifacts?.channel_engagement_metrics || [];
          setEngagementMetrics(metrics);

          const descriptions = descriptionsData?.artifacts?.dimension_interpretations || [];
          setDimensionDescriptions(descriptions);

          const channelModels = predictionsData?.artifacts?.channel_models || [];
          setPredictions(channelModels);

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

  const channelPredictions = useMemo(() => {
    if (!selectedChannel) return [];
    return predictions.filter(p => p.channel_name === selectedChannel);
  }, [predictions, selectedChannel]);

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
    setSelectedChannelsMulti([]);
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
          selectedChannel={showCenters ? selectedChannelsMulti : selectedChannel}
          onSelectChannel={showCenters ? setSelectedChannelsMulti : setSelectedChannel}
          isMulti={showCenters}
        />
      </div>

      {selectedChannel && !showCenters && (
        <div className="tabs is-boxed">
          <ul>
            <li className={activeTab === 'overview' ? 'is-active' : ''}>
              <a onClick={() => setActiveTab('overview')}>Overview</a>
            </li>
            <li className={activeTab === 'dimensions' ? 'is-active' : ''}>
              <a onClick={() => setActiveTab('dimensions')}>Dimensions</a>
            </li>
          </ul>
        </div>
      )}

      {!selectedChannel || showCenters ? (
        <>
          <div className="box">
            <h2 className="subtitle">Channels Overview (2D Projection)</h2>
            <ChannelsChart
              data={channelProjections}
              videos={data}
              showCenters={showCenters}
              setShowCenters={setShowCenters}
              selectedChannels={selectedChannelsMulti}
            />
          </div>

          <div className="box">
            <h2 className="subtitle">Channel Cluster Performance</h2>
            <ChannelStatsTable data={channelStats} onSelectChannel={setSelectedChannel} />
          </div>

          <div className="box">
            <h2 className="subtitle">Engagement Metrics Overview</h2>
            <EngagementMetricsTable data={engagementMetrics} />
          </div>
        </>
      ) : activeTab === 'overview' ? (
        <>
          <div className="columns">
            <div className="column is-full">
              <div className="box">
                <h2 className="subtitle">Cluster Visualization (2D Embeddings)</h2>
                <Chart data={filteredData} selectedChannel={selectedChannel} engagementCenters={engagementCenters} />
              </div>
            </div>
          </div>

          <ClusterStats data={filteredData} />

          <div className="box">
            <h2 className="subtitle">Video List</h2>
            <Table data={filteredData} />
          </div>
        </>
      ) : (
        <>
          <DimensionChart
            data={filteredData}
            predictions={channelPredictions}
            dimensionDescriptions={dimensionDescriptions}
          />

          <div className="box">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Description</th>
                  <th>Coefficient</th>
                </tr>
              </thead>
              <tbody>
                {dimensionDescriptions.map((desc, idx) => {
                  const prediction = channelPredictions.find(p => p.dimension_index === idx);
                  const coef = prediction ? prediction.coefficient : null;
                  const coefClass = coef > 0 ? 'has-text-info' : coef < 0 ? 'has-text-danger' : '';
                  return (
                    <tr key={idx}>
                      <td>{idx}</td>
                      <td>{desc}</td>
                      <td className={`has-text-right has-text-weight-semibold ${coefClass}`}>
                        {coef !== null ? coef.toFixed(4) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
