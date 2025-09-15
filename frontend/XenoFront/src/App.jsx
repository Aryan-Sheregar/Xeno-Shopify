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
          console.log("✅ Dashboard Data Received:", data);
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700 text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Shopify Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* System Status */}
        <section className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Tenant Select
          </h2>
          
          {tenants.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <label className="text-gray-700 font-medium">
                Select Tenant:
              </label>
              <select
                value={selectedTenant || ""}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  syncing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {syncing ? " Syncing..." : " Sync Shopify Data"}
              </button>
            </div>
          )}
        </section>

        {/* Store Overview */}
        {dashboardData && (
          <section className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Store Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-3xl font-bold text-blue-700">
                  {dashboardData.summary?.totalCustomers || 0}
                </h3>
                <p className="text-blue-600 font-medium">Total Customers</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-3xl font-bold text-purple-700">
                  {dashboardData.summary?.totalProducts || 0}
                </h3>
                <p className="text-purple-600 font-medium">Total Products</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products List */}
          {dashboardData?.products?.length > 0 ? (
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Products 
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
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
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Products 
              </h2>
              <div className="text-center py-8 text-gray-500">
                <p>No products found. Try syncing your Shopify data.</p>
              </div>
            </section>
          )}

          {/* Customers List */}
          {dashboardData?.customers?.length > 0 ? (
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Customers
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
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
                      <h3 className="font-semibold text-gray-900 text-lg">
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
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Customers 
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
            <section className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center mt-6">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
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
                {syncing ? " Syncing..." : " Sync Now"}
              </button>
            </section>
          )}
      </main>
    </div>
  );
}

export default App;
