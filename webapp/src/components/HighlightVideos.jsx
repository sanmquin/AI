import { useMemo } from 'react';

function HighlightVideos({ data, selectedX, selectedY }) {
  const highlights = useMemo(() => {
    if (!data || data.length === 0 || selectedX === null || selectedY === null) return [];

    const xNum = parseInt(selectedX, 10);
    const yNum = parseInt(selectedY, 10);

    const validData = data.filter(item => item.embedding_20d && item.embedding_20d.length >= 20);
    if (validData.length === 0) return [];

    // Find min and max for both dimensions
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    validData.forEach(item => {
      const xVal = item.embedding_20d[xNum];
      const yVal = item.embedding_20d[yNum];
      if (xVal < minX) minX = xVal;
      if (xVal > maxX) maxX = xVal;
      if (yVal < minY) minY = yVal;
      if (yVal > maxY) maxY = yVal;
    });

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Define target points in normalized space [0, 1] x [0, 1]
    const targets = [
      { name: `Top ${xNum} & Top ${yNum}`, normX: 1, normY: 1, pointName: 'Top/Top' },
      { name: `Bottom ${xNum} & Bottom ${yNum}`, normX: 0, normY: 0, pointName: 'Bottom/Bottom' },
      { name: `Top ${xNum} & Bottom ${yNum}`, normX: 1, normY: 0, pointName: 'Top/Bottom' },
      { name: `Bottom ${xNum} & Top ${yNum}`, normX: 0, normY: 1, pointName: 'Bottom/Top' }
    ];

    const results = [];

    targets.forEach(target => {
      // Calculate distances to target
      const distances = validData.map(item => {
        const xVal = item.embedding_20d[xNum];
        const yVal = item.embedding_20d[yNum];

        const normItemX = (xVal - minX) / rangeX;
        const normItemY = (yVal - minY) / rangeY;

        const dist = Math.sqrt(Math.pow(normItemX - target.normX, 2) + Math.pow(normItemY - target.normY, 2));

        return { item, dist };
      });

      distances.sort((a, b) => a.dist - b.dist);

      // Take top 10 for this target
      const top10 = distances.slice(0, 10).map(d => ({
        ...d.item,
        category: target.pointName
      }));

      results.push(...top10);
    });

    return results;
  }, [data, selectedX, selectedY]);

  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="box">
      <h2 className="subtitle">Highlighted Videos</h2>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Category</th>
              <th>Video Title</th>
              <th className="has-text-right">Engagement (Views)</th>
              <th className="has-text-right">Dim {selectedX} Value</th>
              <th className="has-text-right">Dim {selectedY} Value</th>
            </tr>
          </thead>
          <tbody>
            {highlights.map((video, idx) => {
              const xNum = parseInt(selectedX, 10);
              const yNum = parseInt(selectedY, 10);
              const xVal = video.embedding_20d[xNum];
              const yVal = video.embedding_20d[yNum];
              const rawViews = typeof video.view_count === 'number' ? video.view_count : (typeof video.viewCount === 'number' ? video.viewCount : 0);

              return (
                <tr key={`${video.video_id}-${idx}`}>
                  <td>{video.category}</td>
                  <td>{video.video_title}</td>
                  <td className="has-text-right">{rawViews.toLocaleString()}</td>
                  <td className="has-text-right">{xVal.toFixed(4)}</td>
                  <td className="has-text-right">{yVal.toFixed(4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HighlightVideos;
