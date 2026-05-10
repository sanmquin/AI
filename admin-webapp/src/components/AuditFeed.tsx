import type { AuditEvent } from '../data/mockAdminData';

type AuditFeedProps = {
  events: AuditEvent[];
};

export function AuditFeed({ events }: AuditFeedProps) {
  return (
    <div className="box h-100">
      <p className="heading mb-1">Security</p>
      <h2 className="title is-4">Audit feed</h2>
      <div className="timeline-list">
        {events.map((event) => (
          <article className="media" key={event.id}>
            <div className="media-left">
              <span className="audit-dot" aria-hidden="true" />
            </div>
            <div className="media-content">
              <p className="mb-1">
                <strong>{event.actor}</strong> {event.action}
              </p>
              <p className="is-size-7 has-text-grey">Today at {event.time}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
