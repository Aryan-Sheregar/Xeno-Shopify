import { useState, useEffect } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test API connection
    fetch(`${API_BASE}/api/health`)
      .then((response) => response.json())
      .then((data) => {
        setHealthStatus(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Error:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Xeno Shopify Insights Dashboard</h1>
        <p>Multi-tenant Shopify Data Analytics Platform</p>
      </header>

      <main className="main-content">
        <section className="status-section">
          <h2>System Status</h2>
          <div
            className={`status-card ${
              healthStatus ? "connected" : "disconnected"
            }`}
          >
            {loading ? (
              <p>🔄 Checking connection...</p>
            ) : healthStatus ? (
              <>
                <p>✅ Backend Connected</p>
                <small>
                  Last checked:{" "}
                  {new Date(healthStatus.timestamp).toLocaleString()}
                </small>
              </>
            ) : (
              <p>❌ Backend Disconnected</p>
            )}
          </div>
        </section>

        <section className="features-section">
          <h2>🎯 Implementation Roadmap</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>✅ Phase 1: Foundation</h3>
              <ul>
                <li>Basic React + Vite setup</li>
                <li>Node.js backend with Express</li>
                <li>MySQL database with Sequelize</li>
                <li>Multi-tenant architecture</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3>🚧 Phase 2: Core Features</h3>
              <ul>
                <li>Shopify API integration</li>
                <li>Customer data ingestion</li>
                <li>Order & product sync</li>
                <li>Webhook handling</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3>📊 Phase 3: Analytics</h3>
              <ul>
                <li>Revenue dashboards</li>
                <li>Customer insights</li>
                <li>Order analytics</li>
                <li>Trend visualizations</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3>🔐 Phase 4: Production</h3>
              <ul>
                <li>Authentication system</li>
                <li>Tenant onboarding</li>
                <li>Data security</li>
                <li>Performance optimization</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
