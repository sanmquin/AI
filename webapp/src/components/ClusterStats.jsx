import { useMemo } from 'react';

function ClusterStats({ data }) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group by cluster
    const clusters = {};
    data.forEach(item => {
      const clusterName = item.cluster_name;
      if (!clusters[clusterName]) {
        clusters[clusterName] = {
          name: clusterName,
          totalViews: 0,
          count: 0,
          sumX: 0,
          sumY: 0,
        };
      }

      const views = typeof item.view_count === 'number' ? item.view_count : (typeof item.viewCount === 'number' ? item.viewCount : 0);
      clusters[clusterName].totalViews += views;
      clusters[clusterName].count += 1;

      if (item.embedding_2d && item.embedding_2d.length >= 2) {
        clusters[clusterName].sumX += item.embedding_2d[0];
        clusters[clusterName].sumY += item.embedding_2d[1];
      }
    });

    // Calculate averages and centers
    const clusterArray = Object.values(clusters).map(c => ({
      ...c,
      avgViews: c.count > 0 ? c.totalViews / c.count : 0,
      centerX: c.count > 0 ? c.sumX / c.count : 0,
      centerY: c.count > 0 ? c.sumY / c.count : 0,
    }));

    // Calculate distances between clusters
    const result = clusterArray.map(cluster => {
      const distances = {};
      clusterArray.forEach(otherCluster => {
        if (cluster.name !== otherCluster.name) {
          const dx = cluster.centerX - otherCluster.centerX;
          const dy = cluster.centerY - otherCluster.centerY;
          distances[otherCluster.name] = Math.sqrt(dx * dx + dy * dy);
        }
      });
      return {
        ...cluster,
        distances
      };
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="box">
      <h2 className="subtitle">Cluster Statistics</h2>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable is-bordered">
          <thead>
            <tr>
              <th>Cluster</th>
              <th>Videos</th>
              <th>Avg Views</th>
              <th>Center (X, Y)</th>
              <th>Distances to Others</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(cluster => (
              <tr key={cluster.name}>
                <td><strong>{cluster.name}</strong></td>
                <td>{cluster.count}</td>
                <td>{Math.round(cluster.avgViews).toLocaleString()}</td>
                <td>
                  ({cluster.centerX.toFixed(4)}, {cluster.centerY.toFixed(4)})
                </td>
                <td>
                  {Object.keys(cluster.distances).length > 0 ? (
                    <ul style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
                      {Object.entries(cluster.distances).map(([otherName, dist]) => (
                        <li key={otherName}>
                          <span className="tag is-light mr-1">{otherName}</span>
                          {dist.toFixed(4)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="has-text-grey-light">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClusterStats;
