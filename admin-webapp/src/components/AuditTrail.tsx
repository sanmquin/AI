import type { AuditEvent } from '../data/adminData';

type AuditTrailProps = {
  events: AuditEvent[];
};

export function AuditTrail({ events }: AuditTrailProps) {
  return (
    <section className="box admin-card">
      <p className="heading">Governance</p>
      <h2 className="title is-4">Audit trail</h2>
      <div className="timeline">
        {events.map((event) => (
          <article className="media" key={event.id}>
            <figure className="media-left">
              <span className="timeline-dot" aria-hidden="true" />
            </figure>
            <div className="media-content">
              <p>
                <strong>{event.actor}</strong> {event.action} <strong>{event.target}</strong>
              </p>
              <p className="is-size-7 has-text-grey">Today at {event.time}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
