import axios from 'axios';

const API_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - token qo'shish
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - token refresh qilish
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Agar 403 xatosi bo'lsa va refresh qilmagan bo'lsa
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { token } = response.data;

        localStorage.setItem('token', token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authAPI = {
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),

  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// ===== PRODUCTS API =====
export const productsAPI = {
  getAll: () => api.get('/products'),

  create: (data: { name: string; description?: string; price: number; quantity?: number }) =>
    api.post('/products', data),

  update: (id: string, data: any) =>
    api.put(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};

// ===== ORDERS API =====
export const ordersAPI = {
  getAll: () => api.get('/orders'),

  create: (data: { products: string[]; total: number }) =>
    api.post('/orders', data),
};

export default api;
