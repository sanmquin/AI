import type { Service } from '../data/adminData';

type ServiceHealthProps = {
  services: Service[];
};

export function ServiceHealth({ services }: ServiceHealthProps) {
  return (
    <section className="box admin-card">
      <p className="heading">Infrastructure</p>
      <h2 className="title is-4">Service health</h2>
      <div className="service-list">
        {services.map((service) => (
          <div className="service-row" key={service.name}>
            <div className="is-flex is-justify-content-space-between mb-2">
              <span className="has-text-weight-semibold">{service.name}</span>
              <span className="has-text-grey">{service.latency}</span>
            </div>
            <progress className={`progress is-${service.tone}`} value={service.health} max="100">
              {service.health}%
            </progress>
          </div>
        ))}
      </div>
    </section>
  );
}
