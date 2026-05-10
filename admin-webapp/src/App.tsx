import 'bulma/css/bulma.min.css';
import './styles.css';

function App() {
  return (
    <main className="admin-page">
      <section className="hero is-fullheight admin-hero">
        <div className="hero-body">
          <div className="container has-text-centered">
            <div className="admin-card box mx-auto">
              <span className="admin-badge tag is-primary is-light">Admin</span>
              <h1 className="title is-1 mt-4">Welcome to Admin</h1>
              <p className="subtitle is-5 has-text-grey">
                This lightweight React, TypeScript, and Bulma app is ready for future admin features.
              </p>
              <a className="button is-primary is-medium" href="/">
                Back to main app
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
