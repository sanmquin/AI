function ChannelSelector({ channels, selectedChannels, onSelectChannels }) {
  const handleChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    onSelectChannels(options);
  };

  return (
    <div className="field">
      <label className="label">Select Channels</label>
      <div className="control">
        <div className="select is-multiple is-fullwidth">
          <select
            multiple
            size={Math.min(5, channels.length || 1)}
            value={selectedChannels}
            onChange={handleChange}
          >
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </div>
        <p className="help">Hold Ctrl/Cmd to select multiple. Expanding channels displays their respective cluster centers colored by relative engagement (blue to red).</p>
      </div>
    </div>
  );
}

export default ChannelSelector;
