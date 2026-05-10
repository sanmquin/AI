import type { MetricCard as MetricCardType } from '../data/mockAdminData';

type MetricCardProps = {
  metric: MetricCardType;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="column is-6-tablet is-3-desktop">
      <article className="box metric-card h-100">
        <p className="heading has-text-grey">{metric.label}</p>
        <div className="is-flex is-align-items-baseline is-justify-content-space-between">
          <p className="title is-3 mb-2">{metric.value}</p>
          <span className={`tag is-${metric.tone} is-light`}>{metric.delta}</span>
        </div>
      </article>
    </div>
  );
}
