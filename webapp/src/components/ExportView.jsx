import { useMemo } from 'react';
import { euclideanDistance, normalizeVector } from '../utils/math';

function humanizeViews(views) {
  if (views >= 1000000000) {
    return (views / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return views.toString();
}

function getStats(videos) {
  let sumViews = 0;
  let count = 0;
  let sumEmbedding = new Array(20).fill(0);

  videos.forEach(v => {
    const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);
    const embedding = v.embedding_20d;

    if (embedding && embedding.length === 20) {
      for (let i = 0; i < 20; i++) {
        sumEmbedding[i] += embedding[i];
      }
      sumViews += views;
      count += 1;
    }
  });

  if (count > 0) {
    return {
      center: sumEmbedding.map(sum => sum / count),
      avgViews: sumViews / count,
      count
    };
  }
  return null;
}

function ExportView({ predictions, descriptions, data, selectedChannel, allVideos, engagementCenters }) {
  const markdownContent = useMemo(() => {
    if (!predictions || predictions.length === 0 || !data || data.length === 0) {
      return 'No data available for export.';
    }

    // Sort predictions by p-value ascending
    const sortedPredictions = [...predictions]
      .filter(p => p.p_value !== null && p.p_value !== undefined)
      .sort((a, b) => a.p_value - b.p_value);

    // Take top 3
    const top3 = sortedPredictions.slice(0, 3);

    let md = `# Export for ${selectedChannel}\n\n`;

    top3.forEach((pred, index) => {
      const dimIdx = pred.dimension_index;
      const desc = descriptions[dimIdx] || 'No description available.';
      const coef = pred.coefficient;
      const impactText = coef > 0 ? 'Increases engagement' : 'Deters engagement';

      md += `### Dimension ${dimIdx} (${impactText}, Coefficient: ${coef.toFixed(4)})\n\n`;
      md += `**Description:**\n${desc}\n\n`;

      // Sort data by this dimension
      const validData = data.filter(item => item.embedding_20d && item.embedding_20d.length > dimIdx);
      const sortedData = [...validData].sort((a, b) => a.embedding_20d[dimIdx] - b.embedding_20d[dimIdx]);

      const bottom5 = sortedData.slice(0, 5);
      const top5 = sortedData.slice(-5).reverse();

      md += `**Top 5 Representative Videos:**\n`;
      top5.forEach((video, i) => {
        const rawViews = typeof video.view_count === 'number' ? video.view_count : (typeof video.viewCount === 'number' ? video.viewCount : 0);
        md += `${i + 1}. ${video.video_title} (${humanizeViews(rawViews)} views)\n`;
      });
      md += `\n`;

      md += `**Bottom 5 Videos:**\n`;
      bottom5.forEach((video, i) => {
        const rawViews = typeof video.view_count === 'number' ? video.view_count : (typeof video.viewCount === 'number' ? video.viewCount : 0);
        md += `${i + 1}. ${video.video_title} (${humanizeViews(rawViews)} views)\n`;
      });
      md += `\n`;

      if (index < top3.length - 1) {
        md += `---\n\n`;
      }
    });

    // ---------------------------------------------------------
    // Competitor Analysis Section
    // ---------------------------------------------------------
    if (allVideos && allVideos.length > 0) {
      md += `---\n\n`;
      md += `## Competitor Analysis\n\n`;

      // 1. Find the selected channel's cluster with the most engagement
      const clustersForChannel = {};
      data.forEach(v => {
        if (!v.cluster_name) return;
        if (!clustersForChannel[v.cluster_name]) {
          clustersForChannel[v.cluster_name] = [];
        }
        clustersForChannel[v.cluster_name].push(v);
      });

      let bestClusterStats = null;
      let maxAvgViews = -1;

      Object.entries(clustersForChannel).forEach(([, videos]) => {
        const stats = getStats(videos);
        if (stats && stats.avgViews > maxAvgViews) {
          maxAvgViews = stats.avgViews;
          bestClusterStats = stats;
        }
      });

      // Calculate overall channel average views for the selected channel
      const selectedChannelStats = getStats(data);

      if (bestClusterStats && selectedChannelStats) {
        // Group all other channels
        const otherChannels = {};
        allVideos.forEach(v => {
          if (v.channel_name === selectedChannel) return;
          if (!otherChannels[v.channel_name]) {
            otherChannels[v.channel_name] = [];
          }
          otherChannels[v.channel_name].push(v);
        });

        // 2. Find closest channels with *greater* engagement than the selected channel's overall average
        const channelCandidates = [];
        Object.entries(otherChannels).forEach(([channelName, videos]) => {
          const stats = getStats(videos);
          if (stats && stats.avgViews > selectedChannelStats.avgViews) {
            const distance = euclideanDistance(bestClusterStats.center, stats.center);
            channelCandidates.push({
              channelName,
              videos,
              distance,
              avgViews: stats.avgViews
            });
          }
        });

        // Sort by distance ascending and take top 3
        channelCandidates.sort((a, b) => a.distance - b.distance);
        const top3Competitors = channelCandidates.slice(0, 3);

        if (top3Competitors.length > 0) {
          md += `Closest channels with greater overall engagement than **${selectedChannel}** (based on its highest engagement cluster):\n\n`;

          top3Competitors.forEach((competitor, idx) => {
            md += `### ${idx + 1}. ${competitor.channelName}\n`;

            // Group competitor's videos by cluster
            const compClusters = {};
            competitor.videos.forEach(v => {
              const cName = v.cluster_name || 'Unclustered';
              if (!compClusters[cName]) {
                compClusters[cName] = [];
              }
              compClusters[cName].push(v);
            });

            // Find competitor's cluster closest to the selected channel's best cluster
            let closestCompClusterName = null;
            let minDistance = Infinity;
            let closestCompVideos = [];

            Object.entries(compClusters).forEach(([cName, videos]) => {
              const stats = getStats(videos);
              if (stats) {
                const dist = euclideanDistance(bestClusterStats.center, stats.center);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestCompClusterName = cName;
                  closestCompVideos = videos;
                }
              }
            });

            if (closestCompClusterName) {
              // Sort videos in the closest cluster by view count descending
              const sortedVideos = [...closestCompVideos].sort((a, b) => {
                const viewsA = typeof a.view_count === 'number' ? a.view_count : (typeof a.viewCount === 'number' ? a.viewCount : 0);
                const viewsB = typeof b.view_count === 'number' ? b.view_count : (typeof b.viewCount === 'number' ? b.viewCount : 0);
                return viewsB - viewsA;
              });

              // Take top 10
              const top10 = sortedVideos.slice(0, 10);

              md += `**Closest Cluster:** ${closestCompClusterName}\n`;
              md += `**Top Videos:**\n`;
              top10.forEach((video) => {
                const rawViews = typeof video.view_count === 'number' ? video.view_count : (typeof video.viewCount === 'number' ? video.viewCount : 0);
                md += `- ${video.video_title} (${humanizeViews(rawViews)} views)\n`;
              });
              md += `\n`;
            }
          });
        } else {
          md += `No other channels found with greater engagement.\n\n`;
        }
      }
    }

    // ---------------------------------------------------------
    // Top Engagement Videos Section
    // ---------------------------------------------------------
    if (allVideos && allVideos.length > 0 && engagementCenters && engagementCenters.length > 0) {
      const centerData = engagementCenters.find(item => item.channel_name === selectedChannel);

      if (centerData && Array.isArray(centerData.engagement_center_20d) && centerData.engagement_center_20d.length === 20) {
        const normalizedCenter = normalizeVector(centerData.engagement_center_20d);

        const videosWithDistance = [];
        allVideos.forEach(v => {
          const embedding = v.embedding_20d;
          if (embedding && embedding.length === 20) {
            // Distance calculated against normalized engagement center per memory instruction
            const distance = euclideanDistance(embedding, normalizedCenter);
            // Engagement metric currently uses views, though could use predicted engagement
            const views = typeof v.view_count === 'number' ? v.view_count : (typeof v.viewCount === 'number' ? v.viewCount : 0);
            videosWithDistance.push({ ...v, distance, view_count: views });
          }
        });

        // Select closest 100 videos by distance
        videosWithDistance.sort((a, b) => a.distance - b.distance);
        const closest100 = videosWithDistance.slice(0, 100);

        // Select top 20 by engagement (views) from the closest 100, then order them by views
        closest100.sort((a, b) => b.view_count - a.view_count);
        const top20Engagement = closest100.slice(0, 20);

        if (top20Engagement.length > 0) {
          md += `---\n\n`;
          md += `## Top 20 Engagement Videos (Closest to Engagement Center)\n\n`;

          top20Engagement.forEach((video, i) => {
            md += `${i + 1}. **${video.video_title}** (${humanizeViews(video.view_count)} views, Distance: ${video.distance.toFixed(4)})\n`;
            md += `   - Channel: ${video.channel_name}\n`;
            md += `   - Link: https://www.youtube.com/watch?v=${video.video_id}\n\n`;
          });
        }
      }
    }

    return md;
  }, [predictions, descriptions, data, selectedChannel, allVideos, engagementCenters]);

  return (
    <div className="box">
      <h2 className="subtitle">Markdown Export</h2>
      <p className="mb-2">Copy the markdown below to export the top 3 most significant dimensions and their representative videos.</p>
      <div className="control">
        <textarea
          className="textarea is-family-code"
          readOnly
          value={markdownContent}
          rows={20}
        />
      </div>
    </div>
  );
}

export default ExportView;
