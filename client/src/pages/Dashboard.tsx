import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { BarChart3, Package, Plus, Trash2 } from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const { products, orders, isLoading } = useData();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    if (products.length > 0) {
      const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const lowStockCount = products.filter(p => p.quantity < 10).length;

      setStats({
        totalProducts: products.length,
        totalValue,
        lowStockCount,
      });
    }
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Pharma Distributor</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
            </div>
            <Package size={40} className="text-blue-500" />
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Stock Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats.totalValue / 1000000).toFixed(1)}M UZS
              </p>
            </div>
            <BarChart3 size={40} className="text-green-500" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.lowStockCount}</p>
            </div>
            <div className="text-3xl font-bold text-red-500">⚠️</div>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Products</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-600">No products yet. Add one from Inventory page.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product) => (
                  <tr key={product._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.price.toLocaleString()} UZS</td>
                    <td className="px-4 py-2">{product.quantity}</td>
                    <td className="px-4 py-2 font-semibold">
                      {(product.price * product.quantity).toLocaleString()} UZS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-gray-600">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">Order {order._id.substring(0, 8)}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-bold text-lg">{order.total.toLocaleString()} UZS</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
