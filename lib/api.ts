import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = Cookies.get('vendor_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('vendor_token');
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  registerVendor: (data: any) => api.post('/auth/register/vendor', data),
  login: (data: any) => api.post('/auth/login', data),
};

export const productsApi = {
  getMyProducts: (params?: any) => api.get('/products/vendor/my-products', { params }),
  getById: (id: string) => api.get(`/products/vendor/${id}`),
  create: (data: any) => api.post('/products/vendor', data),
  update: (id: string, data: any) => api.put(`/products/vendor/${id}`, data),
  delete: (id: string) => api.delete(`/products/vendor/${id}`),
  uploadImage: (id: string, formData: FormData) =>
    api.post(`/products/vendor/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const ordersApi = {
  getMyOrders: (params?: any) => api.get('/orders/vendor', { params }),
  getStats: () => api.get('/orders/vendor/stats'),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

export const vendorApi = {
  getProfile: () => api.get('/vendors/my-profile'),
  updateProfile: (data: any) => api.put('/vendors/my-profile', data),
};

export default api;
