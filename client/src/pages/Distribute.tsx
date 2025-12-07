import { Package } from 'lucide-react';

export default function Distribute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Distribution</h1>
        <p className="text-gray-600 mt-1">Manage product distributions to pharmacies</p>
      </div>

      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Package size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600">Distribution management features will be available soon.</p>
      </div>
    </div>
  );
}

