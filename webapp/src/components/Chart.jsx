import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// Simple color palette for clusters
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isCenter) {
      return (
        <div className="box" style={{ padding: '10px' }}>
          <p><strong>Cluster: {data.cluster_name}</strong></p>
          <p>Videos: {data.video_count}</p>
          <p>Avg Views: {Math.round(data.avg_views).toLocaleString()}</p>
        </div>
      );
    }
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.video_title}</strong></p>
        <p>Channel: {data.channel_name}</p>
        <p>Cluster: {data.cluster_name}</p>
        <p>Views: {(data.view_count || -1).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function Chart({ data, selectedChannel, engagementData }) {
  const [showCenters, setShowCenters] = useState(false);
  const [showEngagement, setShowEngagement] = useState(false);

  const clusterStats = useMemo(() => {
    const clusters = {};
    data.forEach(item => {
      const clusterName = item.cluster_name;
      if (!clusters[clusterName]) {
        clusters[clusterName] = {
          cluster_name: clusterName,
          sumX: 0,
          sumY: 0,
          totalViews: 0,
          count: 0,
        };
      }

      const views = typeof item.view_count === 'number' ? item.view_count : (typeof item.viewCount === 'number' ? item.viewCount : 0);
      clusters[clusterName].totalViews += views;
      clusters[clusterName].count += 1;

      if (item.embedding_2d && item.embedding_2d.length >= 2) {
        clusters[clusterName].sumX += item.embedding_2d[0];
        clusters[clusterName].sumY += item.embedding_2d[1];
      } else if (item.x !== undefined && item.y !== undefined) {
        clusters[clusterName].sumX += item.x;
        clusters[clusterName].sumY += item.y;
      }
    });

    return Object.values(clusters).map(c => ({
      isCenter: true,
      cluster_name: c.cluster_name,
      x: c.count > 0 ? c.sumX / c.count : 0,
      y: c.count > 0 ? c.sumY / c.count : 0,
      video_count: c.count,
      avg_views: c.count > 0 ? c.totalViews / c.count : 0,
    }));
  }, [data]);

  // Format data for Recharts (extract x,y from embedding_2d or compute cluster centers)
  const chartData = useMemo(() => {
    if (showCenters) {
      return clusterStats;
    }

    return data.map(item => ({
      ...item,
      x: item.embedding_2d && item.embedding_2d.length >= 2 ? item.embedding_2d[0] : item.x,
      y: item.embedding_2d && item.embedding_2d.length >= 2 ? item.embedding_2d[1] : item.y,
    }));
  }, [data, showCenters, clusterStats]);

  // Find unique clusters to map colors and legends
  const uniqueClusters = Array.from(new Set(chartData.map(item => item.cluster_name)));

  const engagementCenter = useMemo(() => {
    if (!showEngagement || !engagementData || !selectedChannel) return null;

    const artifacts = engagementData.artifacts || {};
    const candidates = [
      artifacts.channel_engagement_centers,
      artifacts.engagement_centers,
      engagementData.channel_engagement_centers,
      engagementData.engagement_centers,
    ].find(Array.isArray);

    if (!candidates) return null;

    const center = candidates.find((item) => item.channel_name === selectedChannel);
    if (!center) return null;

    const x = center.x ?? center.center_x;
    const y = center.y ?? center.center_y;
    if (typeof x !== 'number' || typeof y !== 'number') return null;

    return {
      channel_name: selectedChannel,
      x,
      y,
      label: 'Engagement Center',
    };
  }, [engagementData, selectedChannel, showEngagement]);

  // Calculate engagement scale
  const { minViews, maxViews } = useMemo(() => {
    if (!showEngagement || chartData.length === 0) return { minViews: 0, maxViews: 0 };

    if (showCenters) {
      const averages = clusterStats.map(c => c.avg_views);
      return {
        minViews: Math.min(...averages),
        maxViews: Math.max(...averages)
      };
    } else {
      const views = chartData.map(item => {
        const rawViews = typeof item.view_count === 'number' ? item.view_count : (typeof item.viewCount === 'number' ? item.viewCount : 0);
        return Math.log(Math.max(1, rawViews));
      });
      return {
        minViews: Math.min(...views),
        maxViews: Math.max(...views)
      };
    }
  }, [chartData, clusterStats, showEngagement, showCenters]);

  return (
    <div>
      <div className="field mb-4">
        <label className="checkbox mr-4">
          <input
            type="checkbox"
            checked={showCenters}
            onChange={(e) => setShowCenters(e.target.checked)}
            className="mr-2"
          />
          Show Cluster Centers Only
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={showEngagement}
            onChange={(e) => setShowEngagement(e.target.checked)}
            className="mr-2"
          />
          Show Engagement
        </label>
      </div>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" name="PCA 1" />
            <YAxis type="number" dataKey="y" name="PCA 2" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            {!(showEngagement && !showCenters) && <Legend />}

            {uniqueClusters.map((clusterName, index) => {
              const clusterData = chartData.filter(item => item.cluster_name === clusterName);

              let fillData = COLORS[index % COLORS.length];
              let displayName = clusterName;

              if (showEngagement && showCenters) {
                const stat = clusterStats.find(c => c.cluster_name === clusterName);
                if (stat) {
                  const avg = stat.avg_views;
                  let ratio = 0;
                  if (maxViews > minViews) {
                    ratio = (avg - minViews) / (maxViews - minViews);
                  }

                  const r = Math.round(255 * (1 - ratio));
                  const g = Math.round(255 * ratio);
                  const b = 0;
                  fillData = `rgb(${r}, ${g}, ${b})`;

                  displayName = `${Math.round(avg).toLocaleString()} Avg Views`;
                }
              } else if (showEngagement && !showCenters) {
                displayName = "Views";
              }

              return (
                <Scatter
                  key={clusterName}
                  name={displayName}
                  data={clusterData}
                  fill={fillData}
                >
                  {showEngagement && !showCenters && clusterData.map((entry, index) => {
                    const rawViews = typeof entry.view_count === 'number' ? entry.view_count : (typeof entry.viewCount === 'number' ? entry.viewCount : 0);
                    const logViews = Math.log(Math.max(1, rawViews));
                    let ratio = 0;
                    if (maxViews > minViews) {
                      ratio = (logViews - minViews) / (maxViews - minViews);
                    }
                    const r = Math.round(255 * (1 - ratio));
                    const g = Math.round(255 * ratio);
                    const b = 0;
                    return <Cell key={`cell-${index}`} fill={`rgb(${r}, ${g}, ${b})`} />;
                  })}
                </Scatter>
              );
            })}

            {showEngagement && engagementCenter && (
              <Scatter name="Engagement Center" data={[engagementCenter]}>
                <Cell fill="#ffffff" stroke="#000000" strokeWidth={1} />
              </Scatter>
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Chart;
