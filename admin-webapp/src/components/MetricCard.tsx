import type { Metric } from '../data/adminData';

type MetricCardProps = {
  metric: Metric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="column is-3-desktop is-6-tablet">
      <article className="box admin-card metric-card">
        <p className="is-size-7 has-text-grey is-uppercase has-text-weight-semibold">{metric.label}</p>
        <div className="is-flex is-align-items-flex-end is-justify-content-space-between mt-3">
          <p className="title is-3 mb-0">{metric.value}</p>
          <span className={`tag is-${metric.tone} is-light`}>{metric.delta}</span>
        </div>
      </article>
    </div>
  );
}
