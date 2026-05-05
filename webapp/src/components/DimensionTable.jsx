import { useState, useMemo } from 'react';

function DimensionTable({ descriptions, predictions }) {
  const [sortConfig, setSortConfig] = useState({ key: 'dimension_index', direction: 'asc' });

  const data = useMemo(() => {
    return descriptions.map((desc, idx) => {
      const pred = predictions.find(p => p.dimension_index === idx) || {};
      return {
        dimension_index: idx,
        description: desc,
        coefficient: pred.coefficient ?? null,
        intercept: pred.intercept ?? null,
        p_value: pred.p_value ?? null,
        is_significant: pred.is_significant ?? null,
        r2_adj: pred.r2_adj ?? null
      };
    });
  }, [descriptions, predictions]);

  const sortedData = useMemo(() => {
    const sortable = [...data];
    sortable.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="box">
      <h2 className="subtitle">Dimensions Metrics</h2>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th className="is-clickable" onClick={() => requestSort('dimension_index')}>Dim{getSortIcon('dimension_index')}</th>
              <th>Description</th>
              <th className="is-clickable has-text-right" onClick={() => requestSort('coefficient')}>Coefficient{getSortIcon('coefficient')}</th>
              <th className="is-clickable has-text-right" onClick={() => requestSort('intercept')}>Intercept{getSortIcon('intercept')}</th>
              <th className="is-clickable has-text-right" onClick={() => requestSort('p_value')}>p-value{getSortIcon('p_value')}</th>
              <th className="is-clickable has-text-centered" onClick={() => requestSort('is_significant')}>Significant{getSortIcon('is_significant')}</th>
              <th className="is-clickable has-text-right" onClick={() => requestSort('r2_adj')}>R² Adj{getSortIcon('r2_adj')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => {
              const coefClass = row.coefficient > 0 ? 'has-text-info' : row.coefficient < 0 ? 'has-text-danger' : '';
              return (
                <tr key={row.dimension_index}>
                  <td>{row.dimension_index}</td>
                  <td>{row.description}</td>
                  <td className={`has-text-right has-text-weight-semibold ${coefClass}`}>
                    {row.coefficient !== null ? row.coefficient.toFixed(4) : 'N/A'}
                  </td>
                  <td className="has-text-right">
                    {row.intercept !== null ? row.intercept.toFixed(4) : 'N/A'}
                  </td>
                  <td className="has-text-right">
                    {row.p_value !== null ? row.p_value.toExponential(4) : 'N/A'}
                  </td>
                  <td className="has-text-centered">
                    {row.is_significant !== null ? (row.is_significant ? 'Yes' : 'No') : 'N/A'}
                  </td>
                  <td className="has-text-right">
                    {row.r2_adj !== null ? row.r2_adj.toFixed(4) : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DimensionTable;
