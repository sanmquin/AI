import type { QueueItem } from '../data/adminData';

const priorityClass: Record<QueueItem['priority'], string> = {
  Low: 'is-light',
  Medium: 'is-info is-light',
  High: 'is-warning is-light',
  Critical: 'is-danger is-light',
};

type ReviewQueueProps = {
  items: QueueItem[];
};

export function ReviewQueue({ items }: ReviewQueueProps) {
  return (
    <section className="box admin-card">
      <div className="level mb-4">
        <div className="level-left">
          <div>
            <p className="heading">Operations</p>
            <h2 className="title is-4 mb-0">Review queue</h2>
          </div>
        </div>
        <div className="level-right">
          <button className="button is-primary is-light">Create task</button>
        </div>
      </div>

      <div className="table-container">
        <table className="table is-fullwidth is-hoverable admin-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Request</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><span className="has-text-weight-semibold">{item.id}</span></td>
                <td>{item.title}</td>
                <td>{item.owner}</td>
                <td>{item.status}</td>
                <td><span className={`tag ${priorityClass[item.priority]}`}>{item.priority}</span></td>
                <td className="has-text-grey">{item.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
