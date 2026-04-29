function Table({ data }) {
  return (
    <div className="table-container">
      <table className="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Video Title</th>
            <th>Channel Name</th>
            <th>Cluster</th>
            <th>Views</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={`${item.video_url}-${index}`}>
              <td>{item.video_title}</td>
              <td>{item.channel_name}</td>
              <td>
                <span className="tag is-info is-light">
                  {item.cluster_name}
                </span>
              </td>
              <td>{item.view_count.toLocaleString()}</td>
              <td>
                <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                  Watch
                </a>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan="5" className="has-text-centered">No videos found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
