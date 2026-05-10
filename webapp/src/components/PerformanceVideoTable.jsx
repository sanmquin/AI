import { useState, useMemo } from 'react';
import { scaleCenterToMaxDistance } from '../utils/math';

function PerformanceVideoTable({ data, selectedX, selectedY, engagementCenters, selectedChannel }) {
  const [sortConfig, setSortConfig] = useState(null);

  const tableData = useMemo(() => {
    if (!data || data.length === 0 || selectedX === null || selectedY === null) return [];

    const xNum = parseInt(selectedX, 10);
    const yNum = parseInt(selectedY, 10);

    const validData = data.filter(item => item.embedding_20d && item.embedding_20d.length >= 20);

    let scaledCenter = null;
    if (engagementCenters && selectedChannel) {
      const centerData = engagementCenters.find(c => c.channel_name === selectedChannel);
      if (centerData && Array.isArray(centerData.engagement_center_20d) && centerData.engagement_center_20d.length >= 20) {
        const rawX = centerData.engagement_center_20d[xNum];
        const rawY = centerData.engagement_center_20d[yNum];

        const maxVideoDistance = validData.reduce((maxDist, item) => {
          const px = item.embedding_20d[xNum];
          const py = item.embedding_20d[yNum];
          const pointDist = Math.sqrt(px * px + py * py);
          return Math.max(maxDist, pointDist);
        }, 0);

        scaledCenter = scaleCenterToMaxDistance(rawX, rawY, maxVideoDistance);
      }
    }


    return validData.map(item => {
      const xVal = item.embedding_20d[xNum];
      const yVal = item.embedding_20d[yNum];
      const views = typeof item.view_count === 'number' ? item.view_count : (typeof item.viewCount === 'number' ? item.viewCount : 0);

      let distance = null;
      if (scaledCenter) {
        const dx = xVal - scaledCenter[0];
        const dy = yVal - scaledCenter[1];
        distance = Math.sqrt(dx * dx + dy * dy);
      }

      return {
        ...item,
        dim_x: xVal,
        dim_y: yVal,
        views: views,
        distance: distance
      };
    });
  }, [data, selectedX, selectedY, engagementCenters, selectedChannel]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...tableData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

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
  }, [tableData, sortConfig]);

  const getSortIndicator = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  if (!sortedData || sortedData.length === 0) return null;

  return (
    <div className="box">
      <h2 className="subtitle">Video List</h2>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('video_title')}>
                Video Title{getSortIndicator('video_title')}
              </th>
              <th style={{ cursor: 'pointer' }} className="has-text-right" onClick={() => handleSort('views')}>
                Views{getSortIndicator('views')}
              </th>
              <th style={{ cursor: 'pointer' }} className="has-text-right" onClick={() => handleSort('dim_x')}>
                Dim {selectedX} Value{getSortIndicator('dim_x')}
              </th>
              <th style={{ cursor: 'pointer' }} className="has-text-right" onClick={() => handleSort('dim_y')}>
                Dim {selectedY} Value{getSortIndicator('dim_y')}
              </th>
              <th style={{ cursor: 'pointer' }} className="has-text-right" onClick={() => handleSort('distance')}>
                Distance to Center{getSortIndicator('distance')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((video, idx) => (
              <tr key={`${video.video_id}-${idx}`}>
                <td>{video.video_title}</td>
                <td className="has-text-right">{video.views.toLocaleString()}</td>
                <td className="has-text-right">{video.dim_x.toFixed(4)}</td>
                <td className="has-text-right">{video.dim_y.toFixed(4)}</td>
                <td className="has-text-right">{video.distance !== null ? video.distance.toFixed(4) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PerformanceVideoTable;
