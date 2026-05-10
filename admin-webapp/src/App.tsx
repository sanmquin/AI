import 'bulma/css/bulma.min.css';
import './styles.css';
import { AccessPanel } from './components/AccessPanel';
import { AdminQueue } from './components/AdminQueue';
import { AuditFeed } from './components/AuditFeed';
import { MetricCard } from './components/MetricCard';
import { auditEvents, metricCards, queueItems } from './data/mockAdminData';

function App() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar p-5">
        <div className="mb-6">
          <p className="title is-4 has-text-white mb-1">Graphiko Admin</p>
          <p className="has-text-grey-light is-size-7">Control center</p>
        </div>
        <nav className="menu">
          <p className="menu-label has-text-grey-light">Manage</p>
          <ul className="menu-list">
            <li><a className="is-active">Dashboard</a></li>
            <li><a>Channels</a></li>
            <li><a>Models</a></li>
            <li><a>Exports</a></li>
          </ul>
          <p className="menu-label has-text-grey-light mt-5">System</p>
          <ul className="menu-list">
            <li><a>Access control</a></li>
            <li><a>Audit logs</a></li>
            <li><a>Settings</a></li>
          </ul>
        </nav>
      </aside>

      <main className="admin-main">
        <section className="hero is-link is-small admin-hero">
          <div className="hero-body">
            <div className="is-flex is-flex-wrap-wrap is-justify-content-space-between is-align-items-center gap-4">
              <div>
                <p className="heading">Admin dashboard</p>
                <h1 className="title is-2">Monitor analytics operations</h1>
                <p className="subtitle is-6">Review queues, platform health, access requests, and recent activity from one Bulma-powered interface.</p>
              </div>
              <button className="button is-white is-medium">Run health check</button>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="columns is-multiline">
            {metricCards.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className="columns mt-2">
            <div className="column is-8-desktop">
              <AdminQueue items={queueItems} />
            </div>
            <div className="column is-4-desktop">
              <AccessPanel />
            </div>
          </div>

          <div className="columns">
            <div className="column is-7-desktop">
              <AuditFeed events={auditEvents} />
            </div>
            <div className="column is-5-desktop">
              <div className="box h-100">
                <p className="heading mb-1">Deployment</p>
                <h2 className="title is-4">Netlify readiness</h2>
                <p className="mb-4">This app includes a dedicated Netlify config for static Vite deployment.</p>
                <progress className="progress is-success" value="100" max="100">100%</progress>
                <div className="tags">
                  <span className="tag is-success is-light">React</span>
                  <span className="tag is-info is-light">TypeScript</span>
                  <span className="tag is-primary is-light">Bulma</span>
                  <span className="tag is-link is-light">Vite</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
