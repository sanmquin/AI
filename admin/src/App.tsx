import './App.css'

function App() {
  return (
    <div className="container">
      <section className="section">
        <div className="content">
          <h1 className="title is-1">Admin Dashboard</h1>
          <p className="subtitle is-3">Welcome to the administration panel.</p>
          <div className="box">
            <h2 className="title is-4">Dashboard Features</h2>
            <ul>
              <li>User Management</li>
              <li>Settings</li>
              <li>Reports</li>
            </ul>
          </div>
          <button className="button is-primary">Get Started</button>
        </div>
      </section>
    </div>
  )
}

export default App