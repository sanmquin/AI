import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

function DimensionChart({ data, predictions, dimensionDescriptions }) {
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

  const [selectedX, setSelectedX] = useState(null);
  const [selectedY, setSelectedY] = useState(null);

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

  const xLabel = dimensionDescriptions[parseInt(xIndex, 10)]
      ? `Dim ${xIndex}: ${dimensionDescriptions[parseInt(xIndex, 10)].substring(0, 40)}...`
      : `Dim ${xIndex}`;

  const yLabel = dimensionDescriptions[parseInt(yIndex, 10)]
      ? `Dim ${yIndex}: ${dimensionDescriptions[parseInt(yIndex, 10)].substring(0, 40)}...`
      : `Dim ${yIndex}`;

  if (!data || data.length === 0) {
    return <p>No video data available to plot.</p>;
  }

  return (
    <div className="box">
      <h2 className="subtitle">Dimension Scatter Plot</h2>

      <div className="columns">
        <div className="column is-half">
          <div className="field">
            <label className="label">X Axis Dimension</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select value={xIndex} onChange={(e) => setSelectedX(e.target.value)}>
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
                <select value={yIndex} onChange={(e) => setSelectedY(e.target.value)}>
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
            <XAxis type="number" dataKey="x" name={xLabel} />
            <YAxis type="number" dataKey="y" name={yLabel} />
            <Tooltip content={<CustomTooltip xIndex={xIndex} yIndex={yIndex} />} cursor={{ strokeDasharray: '3 3' }} />

            <Scatter name="Videos" data={chartData}>
              {chartData.map((entry, index) => {
                const rawViews = typeof entry.view_count === 'number' ? entry.view_count : (typeof entry.viewCount === 'number' ? entry.viewCount : 0);
                const logViews = Math.log(Math.max(1, rawViews));
                let ratio = 0;
                if (maxViews > minViews) {
                  ratio = (logViews - minViews) / (maxViews - minViews);
                }
                // Blueish color gradient based on ratio
                // Following the pattern in Chart.jsx:
                const r = Math.round(255 * (1 - ratio));
                const g = Math.round(255 * ratio);
                const b = 0;
                return <Cell key={`cell-${index}`} fill={`rgb(${r}, ${g}, ${b})`} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DimensionChart;
