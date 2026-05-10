import { useMemo, useState } from 'react';
import 'bulma/css/bulma.min.css';
import './styles.css';
import { AuditTrail } from './components/AuditTrail';
import { MetricCard } from './components/MetricCard';
import { ReviewQueue } from './components/ReviewQueue';
import { ServiceHealth } from './components/ServiceHealth';
import { auditEvents, metrics, queueItems, services } from './data/adminData';

type NavigationItem = 'overview' | 'users' | 'workflows' | 'settings';

const navigationItems: Array<{ id: NavigationItem; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'settings', label: 'Settings' },
];

function App() {
  const [activeNav, setActiveNav] = useState<NavigationItem>('overview');
  const filteredQueue = useMemo(() => queueItems, []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <span className="brand-mark">A</span>
          <div>
            <p className="has-text-weight-bold mb-0">Admin Console</p>
            <p className="is-size-7 has-text-grey-light">Control plane</p>
          </div>
        </div>

        <nav className="menu mt-6" aria-label="Primary navigation">
          <p className="menu-label">Manage</p>
          <ul className="menu-list">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  className={activeNav === item.id ? 'is-active' : ''}
                  onClick={() => setActiveNav(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <p className="is-size-7 has-text-grey-light">Production</p>
          <span className="tag is-success is-light">All critical jobs online</span>
        </div>
      </aside>

      <main className="admin-main">
        <section className="hero admin-hero">
          <div className="hero-body">
            <div className="level is-align-items-flex-start">
              <div className="level-left">
                <div>
                  <p className="heading has-text-primary">{activeNav}</p>
                  <h1 className="title is-2">Operations dashboard</h1>
                  <p className="subtitle is-6">
                    Monitor service health, review privileged workflows, and audit account activity from one workspace.
                  </p>
                </div>
              </div>
              <div className="level-right hero-actions">
                <button className="button is-white">Export report</button>
                <button className="button is-primary">Invite admin</button>
              </div>
            </div>
          </div>
        </section>

        <section className="section pt-5">
          <div className="columns is-multiline">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className="columns mt-2">
            <div className="column is-8-desktop">
              <ReviewQueue items={filteredQueue} />
            </div>
            <div className="column is-4-desktop">
              <ServiceHealth services={services} />
              <AuditTrail events={auditEvents} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
