import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
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
        .then((data) => {
          console.log("✅ Dashboard Data Received:", data); // Debug log
          setDashboardData(data);
        })
        .catch(console.error);
    }
  }, [selectedTenant]);

  const handleSync = async () => {
    if (!selectedTenant) return;

    setSyncing(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/shopify/sync/${selectedTenant}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (result.success) {
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

        {/* Store Overview */}
        {dashboardData && (
          <section className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📊 Store Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-3xl font-bold text-blue-700">
                  {dashboardData.summary?.totalCustomers || 0}
                </h3>
                <p className="text-blue-600 font-medium">Total Customers</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-3xl font-bold text-purple-700">
                  {dashboardData.summary?.totalProducts || 0}
                </h3>
                <p className="text-purple-600 font-medium">Total Products</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ✅ Products List - Show Name, Price, and Quantity */}
          {dashboardData?.products?.length > 0 ? (
            <section className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                🛍️ Products ({dashboardData.products.length} items)
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {product.title}
                      </h3>
                      <p className="text-xl text-green-600 font-bold">
                        ${parseFloat(product.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-blue-600">
                        {product.inventory}
                      </p>
                      <p className="text-sm text-gray-500">units in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                🛍️ Products (0 items)
              </h2>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📦</div>
                <p>No products found. Try syncing your Shopify data.</p>
              </div>
            </section>
          )}

          {/* ✅ Customers List - Show Customer Names */}
          {dashboardData?.customers?.length > 0 ? (
            <section className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                👥 Customers ({dashboardData.customers.length} people)
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-600 font-semibold text-lg">
                        {(
                          customer.firstName?.[0] ||
                          customer.email?.[0] ||
                          "?"
                        ).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {customer.firstName || "Unknown"}{" "}
                        {customer.lastName || ""}
                      </h3>
                      <p className="text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                👥 Customers (0 people)
              </h2>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>No customers found. Try syncing your Shopify data.</p>
              </div>
            </section>
          )}
        </div>

        {/* Sync Button when no data */}
        {dashboardData &&
          !dashboardData.products?.length &&
          !dashboardData.customers?.length && (
            <section className="bg-white rounded-xl p-8 shadow-lg text-center mt-6">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Data Found
              </h3>
              <p className="text-gray-600 mb-4">
                Try syncing your Shopify data to see products and customers
                here.
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {syncing ? "🔄 Syncing..." : "🔄 Sync Now"}
              </button>
            </section>
          )}
      </main>
    </div>
  );
}

export default App;
