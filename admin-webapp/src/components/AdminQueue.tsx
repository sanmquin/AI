import type { QueueItem } from '../data/mockAdminData';

const statusClass: Record<QueueItem['status'], string> = {
  Ready: 'is-success',
  Review: 'is-warning',
  Blocked: 'is-danger',
  Running: 'is-info',
};

type AdminQueueProps = {
  items: QueueItem[];
};

export function AdminQueue({ items }: AdminQueueProps) {
  return (
    <div className="box">
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
        <div>
          <p className="heading mb-1">Operations</p>
          <h2 className="title is-4 mb-0">Work queue</h2>
        </div>
        <button className="button is-link is-light">Create job</button>
      </div>

      <div className="table-container">
        <table className="table is-fullwidth is-hoverable is-middle-aligned">
          <thead>
            <tr>
              <th>Job</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.id}</strong>
                  <p className="has-text-grey is-size-7">{item.title}</p>
                </td>
                <td>{item.owner}</td>
                <td>
                  <span className={`tag ${statusClass[item.status]} is-light`}>{item.status}</span>
                </td>
                <td>{item.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
