function ChannelStatsTable({ data, onSelectChannel }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-striped is-hoverable is-bordered">
        <thead>
          <tr>
            <th>Channel</th>
            <th>Optimal Clusters</th>
            <th>Adjusted R²</th>
          </tr>
        </thead>
        <tbody>
          {data.map((stat, index) => (
            <tr key={index}>
              <td>
                <button
                  type="button"
                  className="button is-text p-0 has-text-weight-semibold"
                  onClick={() => onSelectChannel?.(stat.channel_name)}
                >
                  {stat.channel_name}
                </button>
              </td>
              <td>{stat.best_k_for_channel}</td>
              <td>{stat.best_adj_r2_for_channel !== undefined ? stat.best_adj_r2_for_channel.toFixed(4) : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ChannelStatsTable;
