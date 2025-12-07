import { BarChart3 } from 'lucide-react';

export default function SupplierAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supplier Analytics</h1>
        <p className="text-gray-600 mt-1">View supplier performance analytics</p>
      </div>

      <div className="bg-white rounded-lg shadow p-12 text-center">
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600">Supplier analytics features will be available soon.</p>
      </div>
    </div>
  );
}
