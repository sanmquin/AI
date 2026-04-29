import { useState, useMemo } from 'react';

function Table({ data }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [filterCluster, setFilterCluster] = useState('');

  // Extract unique clusters for the filter dropdown
  const uniqueClusters = useMemo(() => {
    const clusters = new Set(data.map(item => item.cluster_name).filter(Boolean));
    return Array.from(clusters).sort();
  }, [data]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let filteredData = data;
    if (filterCluster) {
      filteredData = filteredData.filter(item => item.cluster_name === filterCluster);
    }

    if (sortConfig !== null) {
      filteredData = [...filteredData].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle view_count for sorting correctly, default to -1 if missing
        if (sortConfig.key === 'view_count') {
          aValue = aValue || -1;
          bValue = bValue || -1;
        } else {
          aValue = aValue || '';
          bValue = bValue || '';
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

    return filteredData;
  }, [data, sortConfig, filterCluster]);

  const getSortIndicator = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <div className="table-wrapper">
      <div className="field is-horizontal mb-4">
        <div className="field-label is-normal">
          <label className="label">Filter by Cluster</label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">
              <div className="select">
                <select
                  value={filterCluster}
                  onChange={(e) => setFilterCluster(e.target.value)}
                >
                  <option value="">All Clusters</option>
                  {uniqueClusters.map(cluster => (
                    <option key={cluster} value={cluster}>
                      {cluster}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('video_title')}>
                Video Title{getSortIndicator('video_title')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('channel_name')}>
                Channel Name{getSortIndicator('channel_name')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('cluster_name')}>
                Cluster{getSortIndicator('cluster_name')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('view_count')}>
                Views{getSortIndicator('view_count')}
              </th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, index) => (
              <tr key={`${item.video_url}-${index}`}>
                <td>{item.video_title}</td>
                <td>{item.channel_name}</td>
                <td>
                  <span className="tag is-info is-light">
                    {item.cluster_name}
                  </span>
                </td>
                <td>{(item.view_count || -1).toLocaleString()}</td>
                <td>
                  <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                    Watch
                  </a>
                </td>
              </tr>
            ))}
            {processedData.length === 0 && (
              <tr>
                <td colSpan="5" className="has-text-centered">No videos found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
