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
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const shiftAPI = {
  getActive: () => api.get('/shifts/active'),
  start: (data) => api.post('/shifts/start', data),
  close: (data) => api.post('/shifts/close', data),
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

export const attendanceAPI = {
  getDaily: (date) => api.get('/attendance/daily', { params: { date } }),
  getAll: (params) => api.get('/attendance', { params }),
  getMonthlyReport: (params) => api.get('/attendance/monthly-report', { params }),
  getTodayStats: () => api.get('/attendance/stats/today'),
  upsert: (data) => api.post('/attendance', data),
  bulkUpsert: (records) => api.post('/attendance/bulk', { records }),
  delete: (id) => api.delete(`/attendance/${id}`),
};

export const salaryAdvanceAPI = {
  getAll: (params) => api.get('/salary-advances', { params }),
  getById: (id) => api.get(`/salary-advances/${id}`),
  getPending: () => api.get('/salary-advances/pending'),
  getStats: () => api.get('/salary-advances/stats'),
  create: (data) => api.post('/salary-advances', data),
  update: (id, data) => api.put(`/salary-advances/${id}`, data),
  recover: (id, recover_amount) => api.post(`/salary-advances/${id}/recover`, { recover_amount }),
  delete: (id) => api.delete(`/salary-advances/${id}`),
};

export const payrollAPI = {
  getAll: (params) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  getStats: () => api.get('/payroll/stats'),
  generate: (data) => api.post('/payroll/generate', data),
  update: (id, data) => api.put(`/payroll/${id}`, data),
  markPaid: (id, paid_date) => api.patch(`/payroll/${id}/mark-paid`, { paid_date }),
  delete: (id) => api.delete(`/payroll/${id}`),
};

export const vendorAPI = {
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  getStats: () => api.get('/vendors/stats'),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
  getPayments: (id) => api.get(`/vendors/${id}/payments`),
  createPayment: (id, data) => api.post(`/vendors/${id}/payments`, data),
  deletePayment: (id) => api.delete(`/vendors/payments/${id}`),
  getPurchases: (id) => api.get(`/vendors/${id}/purchases`),
  createPurchase: (id, data) => api.post(`/vendors/${id}/purchases`, data),
};

export const inventoryMovementAPI = {
  getAll: (params) => api.get('/inventory-movements', { params }),
  getStats: () => api.get('/inventory-movements/stats'),
  create: (data) => api.post('/inventory-movements', data),
};

export default api;
