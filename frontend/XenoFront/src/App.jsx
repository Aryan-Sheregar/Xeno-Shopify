import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    // Fetch tenants and health status
    Promise.all([
      fetch(`${API_BASE}/api/health`).then((res) => res.json()),
      fetch(`${API_BASE}/api/tenants`).then((res) => res.json()),
    ])
      .then(([health, tenantsData]) => {
        setHealthStatus(health);
        setTenants(tenantsData);
        if (tenantsData.length > 0) {
          setSelectedTenant(tenantsData[0].id);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Error:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetch(`${API_BASE}/api/dashboard/${selectedTenant}`)
        .then((res) => res.json())
        .then(setDashboardData)
        .catch(console.error);
    }
  }, [selectedTenant]);

  const handleSync = async () => {
    if (!selectedTenant) return;

    setSyncing(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/shopify/sync/${selectedTenant}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();

      if (result.success) {
        // Refresh dashboard data
        const dashboard = await fetch(
          `${API_BASE}/api/dashboard/${selectedTenant}`
        ).then((res) => res.json());
        setDashboardData(dashboard);
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">🔄 Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Header */}
      <header className="text-center py-8 text-white">
        <h1 className="text-4xl font-bold mb-2">
          🚀 Xeno Shopify Insights Dashboard
        </h1>
        <p className="text-blue-100 text-lg">
          Multi-tenant Shopify Data Analytics Platform
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8">
        {/* System Status */}
        <section className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            System Status
          </h2>
          <div
            className={`p-4 rounded-lg ${
              healthStatus?.database === "Connected"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {healthStatus?.database === "Connected" ? (
              <div>
                <p className="text-green-700 font-medium">
                  ✅ Backend Connected
                </p>
                <small className="text-green-600">
                  Database: {healthStatus.database} | Environment:{" "}
                  {healthStatus.environment}
                </small>
              </div>
            ) : (
              <p className="text-red-700 font-medium">
                ❌ Backend Disconnected
              </p>
            )}
          </div>

          {/* Tenant Selection */}
          {tenants.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <label className="text-gray-700 font-medium">
                Select Tenant:
              </label>
              <select
                value={selectedTenant || ""}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.shopifyDomain})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSync}
                disabled={syncing || !selectedTenant}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  syncing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {syncing ? "🔄 Syncing..." : "🔄 Sync Shopify Data"}
              </button>
            </div>
          )}
        </section>

        {/* Dashboard Metrics */}
        {dashboardData && (
          <section className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📊 Store Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-3xl font-bold text-blue-700">
                  {dashboardData.totalCustomers || 0}
                </h3>
                <p className="text-blue-600 font-medium">Total Customers</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="text-3xl font-bold text-green-700">
                  {dashboardData.totalOrders || 0}
                </h3>
                <p className="text-green-600 font-medium">Total Orders</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-3xl font-bold text-purple-700">
                  {dashboardData.totalProducts || 0}
                </h3>
                <p className="text-purple-600 font-medium">Total Products</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg border-l-4 border-yellow-500">
                <h3 className="text-3xl font-bold text-yellow-700">
                  ${(dashboardData.totalRevenue || 0).toFixed(2)}
                </h3>
                <p className="text-yellow-600 font-medium">Total Revenue</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          {dashboardData?.topCustomers?.length > 0 && (
            <section className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                👥 Top Customers
              </h2>
              <div className="space-y-3">
                {dashboardData.topCustomers.map((customer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${customer.totalSpent}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Orders */}
          {dashboardData?.recentOrders?.length > 0 && (
            <section className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                📦 Recent Orders
              </h2>
              <div className="space-y-3">
                {dashboardData.recentOrders.slice(0, 5).map((order, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        #{order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        ${order.totalAmount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
