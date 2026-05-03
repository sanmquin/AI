function ChannelSelector({ channels, selectedChannel, onSelectChannel, isMulti }) {
  if (isMulti) {
    return (
      <div className="field">
        <label className="label">Select Channels</label>
        <div className="control">
          <div className="select is-multiple is-fullwidth">
            <select
              multiple
              value={selectedChannel || []}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions, option => option.value);
                onSelectChannel(opts);
              }}
              size={Math.min(channels.length, 5) || 5}
            >
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

  return (
    <div className="field">
      <label className="label">Select Channel</label>
      <div className="control">
        <div className="select is-fullwidth">
          <select
            value={selectedChannel}
            onChange={(e) => onSelectChannel(e.target.value)}
          >
            <option value="" disabled>Select a channel...</option>
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
