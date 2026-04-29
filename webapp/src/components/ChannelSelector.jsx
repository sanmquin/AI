function ChannelSelector({ channels, selectedChannel, onSelectChannel }) {
  return (
    <div className="field">
      <label className="label">Select Channel</label>
      <div className="control">
        <div className="select is-fullwidth">
          <select
            value={selectedChannel}
            onChange={(e) => onSelectChannel(e.target.value)}
          >
            <option value="">All Channels</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ChannelSelector;
