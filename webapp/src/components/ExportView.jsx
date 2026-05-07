import { useMemo } from 'react';

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

function ExportView({ predictions, descriptions, data, selectedChannel }) {
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

    return md;
  }, [predictions, descriptions, data, selectedChannel]);

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
