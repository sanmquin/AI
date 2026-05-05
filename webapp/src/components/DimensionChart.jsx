import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, xIndex, yIndex }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="box" style={{ padding: '10px' }}>
        <p><strong>{data.video_title}</strong></p>
        <p>Views: {(data.view_count || -1).toLocaleString()}</p>
        <p>Dim {xIndex}: {data.x.toFixed(4)}</p>
        <p>Dim {yIndex}: {data.y.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

function DimensionChart({ data, predictions, dimensionDescriptions, selectedX, selectedY, onXChange, onYChange }) {
  const defaultAxes = useMemo(() => {
    if (predictions && predictions.length > 0) {
      let minCoef = Infinity;
      let minIdx = 0;
      let maxCoef = -Infinity;
      let maxIdx = 0;

      predictions.forEach((p) => {
        if (p.coefficient < minCoef) {
          minCoef = p.coefficient;
          minIdx = p.dimension_index;
        }
        if (p.coefficient > maxCoef) {
          maxCoef = p.coefficient;
          maxIdx = p.dimension_index;
        }
      });

      return { x: minIdx.toString(), y: maxIdx.toString() };
    }
    return { x: '0', y: '1' }; // Fallback
  }, [predictions]);

  const xIndex = selectedX !== null ? selectedX : defaultAxes.x;
  const yIndex = selectedY !== null ? selectedY : defaultAxes.y;

  // Format data for Recharts
  const chartData = useMemo(() => {
    if (!data || data.length === 0 || xIndex === '' || yIndex === '') return [];

    const xNum = parseInt(xIndex, 10);
    const yNum = parseInt(yIndex, 10);

    return data
      .filter(item => item.embedding_20d && item.embedding_20d.length >= 20)
      .map(item => ({
        ...item,
        x: item.embedding_20d[xNum],
        y: item.embedding_20d[yNum],
      }));
  }, [data, xIndex, yIndex]);

  // Calculate chart boundaries
  const { minX, maxX, minY, maxY } = useMemo(() => {
      if (chartData.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      const xs = chartData.map(d => d.x);
      const ys = chartData.map(d => d.y);
      return {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
      };
  }, [chartData]);

  // Calculate engagement scale
  const { minViews, maxViews } = useMemo(() => {
    if (chartData.length === 0) return { minViews: 0, maxViews: 0 };

    const views = chartData.map(item => {
      const rawViews = typeof item.view_count === 'number' ? item.view_count : (typeof item.viewCount === 'number' ? item.viewCount : 0);
      return Math.log(Math.max(1, rawViews));
    });
    return {
      minViews: Math.min(...views),
      maxViews: Math.max(...views)
    };
  }, [chartData]);

  // Calculate trendline
  const trendlineSegment = useMemo(() => {
      const xPred = predictions.find(p => p.dimension_index === parseInt(xIndex, 10));
      const yPred = predictions.find(p => p.dimension_index === parseInt(yIndex, 10));

      if (!xPred || !yPred || chartData.length === 0) return null;

      // In a 2D plot, we are predicting engagement based on dimensions.
      // But we need a line representing the gradient of engagement increase.
      // The gradient vector is (coefX, coefY).
      // Let's draw a line through the origin (or center of mass) along the gradient.

      const coefX = xPred.coefficient;
      const coefY = yPred.coefficient;

      // If both coefs are 0, no trend
      if (coefX === 0 && coefY === 0) return null;

      // Center of data
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // We want the line to span the chart
      // Normalizing the direction vector
      const magnitude = Math.sqrt(coefX * coefX + coefY * coefY);
      const dirX = coefX / magnitude;
      const dirY = coefY / magnitude;

      // Find intersection with bounding box
      // Let's use a simple scalar to extend the line beyond the bounds
      const span = Math.max(maxX - minX, maxY - minY);

      // Points for line: center - span*dir to center + span*dir
      // To ensure it covers the area

      const x1 = centerX - span * dirX;
      const y1 = centerY - span * dirY;
      const x2 = centerX + span * dirX;
      const y2 = centerY + span * dirY;

      return [{x: x1, y: y1}, {x: x2, y: y2}];
  }, [predictions, xIndex, yIndex, minX, maxX, minY, maxY, chartData]);

  const xLabel = dimensionDescriptions[parseInt(xIndex, 10)]
      ? `Dim ${xIndex}: ${dimensionDescriptions[parseInt(xIndex, 10)].substring(0, 40)}...`
      : `Dim ${xIndex}`;

  const yLabel = dimensionDescriptions[parseInt(yIndex, 10)]
      ? `Dim ${yIndex}: ${dimensionDescriptions[parseInt(yIndex, 10)].substring(0, 40)}...`
      : `Dim ${yIndex}`;

  if (!data || data.length === 0) {
    return <p>No video data available to plot.</p>;
  }

  const handleXChange = (e) => {
    const val = e.target.value;
    if (onXChange) onXChange(val);
  };

  const handleYChange = (e) => {
    const val = e.target.value;
    if (onYChange) onYChange(val);
  };

  return (
    <div className="box">
      <h2 className="subtitle">Dimension Scatter Plot</h2>

      <div className="columns">
        <div className="column is-half">
          <div className="field">
            <label className="label">X Axis Dimension</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select value={xIndex} onChange={handleXChange}>
                  {dimensionDescriptions.map((desc, idx) => {
                    const prediction = predictions.find(p => p.dimension_index === idx);
                    const coef = prediction ? prediction.coefficient.toFixed(4) : 'N/A';
                    return (
                      <option key={`x-${idx}`} value={idx}>
                        {idx}: {desc.substring(0, 50)}... (Coef: {coef})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column is-half">
          <div className="field">
            <label className="label">Y Axis Dimension</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select value={yIndex} onChange={handleYChange}>
                  {dimensionDescriptions.map((desc, idx) => {
                    const prediction = predictions.find(p => p.dimension_index === idx);
                    const coef = prediction ? prediction.coefficient.toFixed(4) : 'N/A';
                    return (
                      <option key={`y-${idx}`} value={idx}>
                        {idx}: {desc.substring(0, 50)}... (Coef: {coef})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 400, marginTop: '20px' }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" name={xLabel} domain={['auto', 'auto']} />
            <YAxis type="number" dataKey="y" name={yLabel} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip xIndex={xIndex} yIndex={yIndex} />} cursor={{ strokeDasharray: '3 3' }} />

            <Scatter name="Videos" data={chartData}>
              {chartData.map((entry, index) => {
                const rawViews = typeof entry.view_count === 'number' ? entry.view_count : (typeof entry.viewCount === 'number' ? entry.viewCount : 0);
                const logViews = Math.log(Math.max(1, rawViews));
                let ratio = 0;
                if (maxViews > minViews) {
                  ratio = (logViews - minViews) / (maxViews - minViews);
                }
                // Colors: Red (low) to Green (high)
                const r = Math.round(255 * (1 - ratio));
                const g = Math.round(255 * ratio);
                const b = 0;
                return <Cell key={`cell-${index}`} fill={`rgb(${r}, ${g}, ${b})`} />;
              })}
            </Scatter>
            {trendlineSegment && (
              <ReferenceLine
                segment={trendlineSegment}
                stroke="black"
                strokeDasharray="5 5"
                label="Engagement Growth Direction"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
          <h3 className="subtitle is-6">Selected Dimension Descriptions</h3>
          <p><strong>X Axis (Dim {xIndex}):</strong> {dimensionDescriptions[parseInt(xIndex, 10)]}</p>
          <p className="mt-2"><strong>Y Axis (Dim {yIndex}):</strong> {dimensionDescriptions[parseInt(yIndex, 10)]}</p>
      </div>
    </div>
  );
}

export default DimensionChart;
