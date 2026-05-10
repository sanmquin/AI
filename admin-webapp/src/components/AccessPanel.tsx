export function AccessPanel() {
  return (
    <div className="box h-100">
      <p className="heading mb-1">Access</p>
      <h2 className="title is-4">Invite admin</h2>
      <div className="field">
        <label className="label" htmlFor="email">Email</label>
        <div className="control">
          <input className="input" id="email" type="email" placeholder="teammate@example.com" />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="role">Role</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select id="role" defaultValue="analyst">
              <option value="analyst">Analyst</option>
              <option value="operator">Operator</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        </div>
      </div>
      <button className="button is-primary is-fullwidth">Send invite</button>
    </div>
  );
}
