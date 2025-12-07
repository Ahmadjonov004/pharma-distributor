import React, { createContext, useContext, useEffect, useState } from 'react';
import { productsAPI, ordersAPI } from '../api';
import { useAuth } from './AuthContext';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  owner: string;
}

interface Order {
  _id: string;
  products: Product[];
  total: number;
  user: string;
  createdAt: string;
}

interface DataContextType {
  products: Product[];
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  
  // Products
  addProduct: (data: { name: string; description?: string; price: number; quantity?: number }) => Promise<void>;
  updateProduct: (id: string, data: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Orders
  addOrder: (data: { products: string[]; total: number }) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchProducts: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Fetch products on mount or when token changes
  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchOrders();
    } else {
      setProducts([]);
      setOrders([]);
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch products';
      setError(errorMsg);
      console.error('Fetch products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data);
    } catch (err: any) {
      console.error('Fetch orders error:', err);
    }
  };

  const addProduct = async (data: { name: string; description?: string; price: number; quantity?: number }) => {
    try {
      setIsLoading(true);
      setError(null);
      await productsAPI.create(data);
      await fetchProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to add product';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      await productsAPI.update(id, data);
      await fetchProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update product';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await productsAPI.delete(id);
      await fetchProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete product';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const addOrder = async (data: { products: string[]; total: number }) => {
    try {
      setIsLoading(true);
      setError(null);
      await ordersAPI.create(data);
      await fetchOrders();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create order';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{
      products,
      orders,
      isLoading,
      error,
      addProduct,
      updateProduct,
      deleteProduct,
      addOrder,
      fetchOrders,
      fetchProducts,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
