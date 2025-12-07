import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading, error } = useData();
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
  });

  useEffect(() => {
    setItems(products);
  }, [products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || form.price <= 0) {
      alert('Name and price are required');
      return;
    }

    try {
      if (editingId) {
        await updateProduct(editingId, form);
        setEditingId(null);
      } else {
        await addProduct(form);
      }
      setForm({ name: '', description: '', price: 0, quantity: 0 });
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (product: any) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteProduct(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage your products</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ name: '', description: '', price: 0, quantity: 0 });
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Paracetamol 500mg"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (UZS) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-600">Loading products...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No products yet. Click "Add Product" to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Value</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-600">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {product.price.toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4 text-gray-900">{product.quantity}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {(product.price * product.quantity).toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded transition"
                        disabled={isLoading}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                        disabled={isLoading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
