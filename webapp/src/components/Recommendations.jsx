import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { normalizeVector, euclideanDistance } from '../utils/math';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.video_title}</strong></p>
        <p>Channel: {data.channel_name}</p>
        <p>Distance: {data.distance.toFixed(4)}</p>
        <p>Views: {(data.view_count || -1).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function Recommendations({ allVideos, selectedChannel, engagementCenters }) {
  const [sortConfig, setSortConfig] = useState(null);

  const { chartData, topVideos } = useMemo(() => {
    if (!allVideos || allVideos.length === 0 || !selectedChannel) {
      return { chartData: [], topVideos: [] };
    }

    const center = engagementCenters.find((item) => item.channel_name === selectedChannel);
    if (!center || !Array.isArray(center.engagement_center_20d) || center.engagement_center_20d.length !== 20) {
      return { chartData: [], topVideos: [] };
    }

    const normalizedCenter = normalizeVector(center.engagement_center_20d);

    const dataWithDistance = [];

    allVideos.forEach(v => {
      const embedding = v.embedding_20d;
      if (embedding && embedding.length === 20) {
        const distance = euclideanDistance(embedding, normalizedCenter);
        const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);

        dataWithDistance.push({
          ...v,
          distance,
          view_count: views
        });
      }
    });

    dataWithDistance.sort((a, b) => a.distance - b.distance);

    const top100 = dataWithDistance.slice(0, 100);

    return { chartData: top100, topVideos: top100 };
  }, [allVideos, selectedChannel, engagementCenters]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...topVideos];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'view_count') {
          aValue = aValue || -1;
          bValue = bValue || -1;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [topVideos, sortConfig]);

  if (!allVideos || allVideos.length === 0) {
    return <div className="notification">No videos available.</div>;
  }

  if (topVideos.length === 0) {
    return <div className="notification">Could not calculate recommendations data. Missing engagement center or embeddings.</div>;
  }

  return (
    <div className="box">
      <h2 className="subtitle">Recommendations View</h2>
      <p className="mb-4">Top 100 videos closest to the normalized engagement center of {selectedChannel}.</p>

      <div style={{ width: '100%', height: 400, marginBottom: '2rem' }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="distance"
              name="Distance"
              domain={[0, 'dataMax + 0.05']}
              label={{ value: 'Distance to Normalized Engagement Center (20D)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="view_count"
              name="Views"
              width={80}
              label={{ value: 'Views', angle: -90, position: 'insideLeft', offset: 0 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Videos" data={chartData}>
              {chartData.map((entry, index) => {
                const isSelectedChannel = entry.channel_name === selectedChannel;
                const fill = isSelectedChannel ? '#ffffff' : '#800080'; // White for selected, Purple for others
                const stroke = isSelectedChannel ? '#000000' : 'none';
                return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} strokeWidth={isSelectedChannel ? 1 : 0} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <h3 className="subtitle is-5">Top 100 Videos</h3>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('video_title')}>
                Video Title {sortConfig?.key === 'video_title' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('channel_name')}>
                Channel Name {sortConfig?.key === 'channel_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('distance')}>
                Distance (20D) {sortConfig?.key === 'distance' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('view_count')}>
                Views {sortConfig?.key === 'view_count' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={`${row.video_id}-${idx}`}>
                <td>{row.video_title}</td>
                <td>{row.channel_name}</td>
                <td>{row.distance.toFixed(4)}</td>
                <td>{(row.view_count || -1).toLocaleString()}</td>
                <td>
                  <a href={`https://www.youtube.com/watch?v=${row.video_id}`} target="_blank" rel="noopener noreferrer">
                    Watch
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Recommendations;
