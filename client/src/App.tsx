import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Distribute from './pages/Distribute';
import Pharmacies from './pages/Pharmacies';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SupplierAnalytics from './pages/SupplierAnalytics';

// Icons
import {
  Home,
  Package,
  Truck,
  Building2,
  BarChart3,
  Settings as Cog,
  Factory,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/distribute', label: 'Distribute', icon: Truck },
    { to: '/pharmacies', label: 'Pharmacies', icon: Building2 },
    { to: '/suppliers', label: 'Suppliers', icon: Factory },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Cog },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-slate-800 text-white transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">Pharma</h1>
          <p className="text-sm text-gray-400">Distributor</p>
        </div>

        <nav className="mt-8">
          {navItems.map(({ to, label, icon: Icon }) => (
            <a
              key={to}
              href={to}
              className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-slate-700 hover:text-white transition"
            >
              <Icon size={20} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome,</p>
            <p className="font-semibold">{user.username}</p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/distribute" element={<Distribute />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/supplier-analytics" element={<SupplierAnalytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </DataProvider>
    </AuthProvider>
  );
}
