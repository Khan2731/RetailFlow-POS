import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const orderAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getByTable: (tableNo) => api.get(`/orders/table/${tableNo}`),
  getByStatus: (status) => api.get(`/orders/status/${status}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const orderItemAPI = {
  getByOrderId: (orderId) => api.get(`/order-items/order/${orderId}`),
  getById: (id) => api.get(`/order-items/${id}`),
  create: (data) => api.post('/order-items', data),
  update: (id, data) => api.put(`/order-items/${id}`, data),
  delete: (id) => api.delete(`/order-items/${id}`),
};

export const billingAPI = {
  getAll: () => api.get('/billing'),
  getById: (id) => api.get(`/billing/${id}`),
  getByOrderId: (orderId) => api.get(`/billing/order/${orderId}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  delete: (id) => api.delete(`/billing/${id}`),
};

export const staffAPI = {
  getAll: () => api.get('/staff'),
  getById: (id) => api.get(`/staff/${id}`),
  getByRole: (role) => api.get(`/staff/role/${role}`),
  getByShift: (shift) => api.get(`/staff/shift/${shift}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  updatePassword: (id, password) => api.patch(`/staff/${id}/password`, { password }),
  delete: (id) => api.delete(`/staff/${id}`),
};

export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  getLowStock: (threshold) => api.get('/inventory/low-stock', { params: { threshold } }),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  updateQuantity: (id, quantity) => api.patch(`/inventory/${id}/quantity`, { quantity }),
  adjustQuantity: (id, adjustment) => api.patch(`/inventory/${id}/adjust`, { adjustment }),
  delete: (id) => api.delete(`/inventory/${id}`),
};

export const deliveryAPI = {
  getAll: () => api.get('/delivery'),
  getById: (id) => api.get(`/delivery/${id}`),
  getByOrderId: (orderId) => api.get(`/delivery/order/${orderId}`),
  getByStatus: (status) => api.get(`/delivery/status/${status}`),
  getByDriver: (driverName) => api.get(`/delivery/driver/${driverName}`),
  create: (data) => api.post('/delivery', data),
  update: (id, data) => api.put(`/delivery/${id}`, data),
  updateStatus: (id, status, driverName) => api.patch(`/delivery/${id}/status`, { status, driver_name: driverName }),
  assignDriver: (id, driverName) => api.patch(`/delivery/${id}/assign-driver`, { driver_name: driverName }),
  delete: (id) => api.delete(`/delivery/${id}`),
};

export const dealAPI = {
  getAll: () => api.get('/deals'),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  delete: (id) => api.delete(`/deals/${id}`),
};

export const expenseAPI = {
  getAll: () => api.get('/expenses'),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export default api;
