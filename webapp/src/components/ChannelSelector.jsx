function ChannelSelector({ channels, selectedChannel, onSelectChannel, isMultiSelect = false }) {
  const selectedValues = Array.isArray(selectedChannel)
    ? selectedChannel
    : (selectedChannel ? [selectedChannel] : []);

  const handleChange = (e) => {
    if (!isMultiSelect) {
      onSelectChannel(e.target.value);
      return;
    }

    const values = Array.from(e.target.selectedOptions, option => option.value);
    onSelectChannel(values);
  };

  return (
    <div className="field">
      <label className="label">Select Channel</label>
      <div className="control">
        <div className="select is-fullwidth">
          <select
            value={selectedValues}
            onChange={handleChange}
            multiple={isMultiSelect}
            size={isMultiSelect ? 8 : undefined}
          >
            {!isMultiSelect && <option value="" disabled>Select a channel...</option>}
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
