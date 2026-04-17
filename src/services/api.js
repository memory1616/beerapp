/**
 * Beer POS Mobile - API Service Layer
 * Kết nối đến backend Beer POS có sẵn
 * 
 * Base URL: http://localhost:3000 (thay đổi theo cấu hình server)
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== CẤU HÌNH ====================

// URL server - có thể thay đổi trong settings
const DEFAULT_BASE_URL = 'http://localhost:3000';

// ==================== AXIOS INSTANCE ====================

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động thêm base URL từ storage nếu có
api.interceptors.request.use(async (config) => {
  const savedBaseUrl = await AsyncStorage.getItem('serverBaseUrl');
  if (savedBaseUrl) {
    config.baseURL = savedBaseUrl;
  }
  return config;
});

// Interceptor: Xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[API Error]', error.message);
    return Promise.reject(error);
  }
);

// ==================== PRODUCTS API ====================

const ProductsAPI = {
  // Lấy danh sách sản phẩm (không bao gồm archived)
  getAll: async () => {
    const res = await api.get('/api/products');
    return res.data;
  },

  // Lấy chi tiết sản phẩm theo ID hoặc slug
  getById: async (id) => {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  },

  // Tạo sản phẩm mới
  create: async (productData) => {
    const res = await api.post('/api/products', productData);
    return res.data;
  },

  // Cập nhật sản phẩm
  update: async (id, productData) => {
    const res = await api.put(`/api/products/${id}`, productData);
    return res.data;
  },

  // Xóa mềm sản phẩm
  delete: async (id) => {
    const res = await api.delete(`/api/products/${id}`);
    return res.data;
  },

  // Lấy giá theo khách hàng
  getPrices: async (customerId) => {
    const res = await api.get('/api/products/prices', {
      params: { customerId }
    });
    return res.data;
  },

  // Cập nhật giá cho khách hàng
  setPrice: async (customerId, productId, price) => {
    const res = await api.post('/api/products/prices', {
      customerId,
      productId,
      price
    });
    return res.data;
  },
};

// ==================== SALES API ====================

const SalesAPI = {
  // Tạo đơn hàng mới
  create: async ({ customerId, items, deliverKegs = 0, returnKegs = 0 }) => {
    const res = await api.post('/api/sales', {
      customerId,
      items,
      deliverKegs,
      returnKegs,
    });
    return res.data;
  },

  // Lấy danh sách hóa đơn
  getAll: async ({ page = 1, limit = 20, month, status } = {}) => {
    const res = await api.get('/api/sales', {
      params: { page, limit, month, status }
    });
    return res.data;
  },

  // Lấy chi tiết hóa đơn
  getById: async (id) => {
    const res = await api.get(`/api/sales/${id}`);
    return res.data;
  },

  // Cập nhật vỏ cho hóa đơn
  updateKegs: async (saleId, customerId, { deliver = 0, returned = 0 } = {}) => {
    const res = await api.post('/api/sales/update-kegs', {
      saleId,
      customerId,
      deliver,
      returned,
    });
    return res.data;
  },

  // Đổi bia lỗi
  replacement: async ({ customer_id, product_id, quantity, reason, gift }) => {
    const res = await api.post('/api/sales/replacement', {
      customer_id,
      product_id,
      quantity,
      reason,
      gift,
    });
    return res.data;
  },

  // Trả hàng
  returnSale: async (saleId, { returnType = 'stock_return', reason, addToInventory = true } = {}) => {
    const res = await api.post(`/api/sales/${saleId}/return`, {
      returnType,
      reason,
      addToInventory,
    });
    return res.data;
  },

  // Xóa mềm hóa đơn
  delete: async (id) => {
    const res = await api.delete(`/api/sales/${id}`);
    return res.data;
  },

  // Khôi phục hóa đơn đã xóa
  restore: async (id) => {
    const res = await api.post(`/api/sales/${id}/restore`);
    return res.data;
  },
};

// ==================== CUSTOMERS API ====================

const CustomersAPI = {
  // Lấy danh sách khách hàng (có phân trang)
  getAll: async ({ page = 1, limit = 10, fields } = {}) => {
    const res = await api.get('/api/customers', {
      params: { page, limit, fields }
    });
    return res.data;
  },

  // Tìm kiếm khách hàng
  search: async (query) => {
    // Sử dụng API có sẵn với limit cao để fuzzy search ở client
    const res = await api.get('/api/customers', {
      params: { page: 1, limit: 100, fields: 'id,name,phone,address,keg_balance,debt' }
    });
    return res.data;
  },

  // Lấy chi tiết khách hàng
  getById: async (id) => {
    const res = await api.get(`/api/customers/${id}`);
    return res.data;
  },

  // Tạo khách hàng mới
  create: async ({ name, phone, deposit, horizontal_fridge, vertical_fridge, prices }) => {
    const res = await api.post('/api/customers', {
      name,
      phone,
      deposit,
      horizontal_fridge,
      vertical_fridge,
      prices,
    });
    return res.data;
  },

  // Cập nhật khách hàng
  update: async (id, data) => {
    const res = await api.put(`/api/customers/${id}`, data);
    return res.data;
  },

  // Lưu trữ/khôi phục khách hàng
  archive: async (id, collectKegs) => {
    const res = await api.put(`/api/customers/${id}/archive`, { collectKegs });
    return res.data;
  },

  // Lấy thống kê khách hàng
  getStats: async (id) => {
    const res = await api.get(`/api/customers/${id}/stats`);
    return res.data;
  },

  // Lấy lịch sử mua hàng
  getSalesHistory: async (id, { year, month } = {}) => {
    const res = await api.get(`/api/customers/${id}/sales`, {
      params: { year, month }
    });
    return res.data;
  },

  // Lấy lịch sử vỏ keg
  getKegHistory: async (id, { year, month } = {}) => {
    const res = await api.get(`/api/customers/${id}/keg-history`, {
      params: { year, month }
    });
    return res.data;
  },

  // Lấy cảnh báo khách hàng
  getAlerts: async () => {
    const res = await api.get('/api/customers/alerts');
    return res.data;
  },
};

// ==================== STOCK API ====================

const StockAPI = {
  // Lấy cảnh báo tồn kho thấp
  getAlerts: async (threshold = 10) => {
    const res = await api.get('/api/stock/alerts', {
      params: { threshold }
    });
    return res.data;
  },

  // Nhập kho
  import: async ({ productId, quantity }) => {
    const res = await api.post('/api/stock', { productId, quantity });
    return res.data;
  },

  // Đặt số lượng tồn kho trực tiếp
  setStock: async ({ productId, stock }) => {
    const res = await api.post('/api/stock/set', { productId, stock });
    return res.data;
  },

  // Nhập kho nhiều sản phẩm
  importMultiple: async ({ items, note }) => {
    const res = await api.post('/api/stock/multiple', { items, note });
    return res.data;
  },

  // Lấy lịch sử kho
  getHistory: async (productId, limit = 100) => {
    const res = await api.get('/api/stock/history', {
      params: { productId, limit }
    });
    return res.data;
  },
};

// ==================== KEGS API ====================

const KegsAPI = {
  // Lấy trạng thái keg hiện tại
  getState: async () => {
    const res = await api.get('/api/kegs/state');
    return res.data;
  },

  // Cập nhật trạng thái keg
  updateState: async ({ emptyCollected, inventory, note }) => {
    const res = await api.post('/api/kegs/state', { emptyCollected, inventory, note });
    return res.data;
  },

  // Đồng bộ dữ liệu keg
  sync: async () => {
    const res = await api.get('/api/kegs/sync');
    return res.data;
  },

  // Giao vỏ cho khách
  deliver: async ({ customerId, quantity, note }) => {
    const res = await api.post('/api/kegs/deliver', { customerId, quantity, note });
    return res.data;
  },

  // Thu vỏ rỗng từ khách
  collect: async ({ customerId, quantity, note }) => {
    const res = await api.post('/api/kegs/collect', { customerId, quantity, note });
    return res.data;
  },

  // Nhập vỏ từ nhà máy
  import: async ({ exchanged = 0, purchased = 0, note }) => {
    const res = await api.post('/api/kegs/import', { exchanged, purchased, note });
    return res.data;
  },

  // Bán vỏ rỗng
  sellEmpty: async ({ quantity, note }) => {
    const res = await api.post('/api/kegs/sell-empty', { quantity, note });
    return res.data;
  },

  // Lấy lịch sử giao dịch keg
  getHistory: async ({ type, customer_id, from, to, page = 1, limit = 50 } = {}) => {
    const res = await api.get('/api/kegs/history', {
      params: { type, customer_id, from, to, page, limit }
    });
    return res.data;
  },
};

// ==================== ANALYTICS API ====================

const AnalyticsAPI = {
  // Lấy báo cáo tổng hợp (doanh thu, lợi nhuận, đơn hàng)
  getReport: async ({ startDate, endDate, mode, period } = {}) => {
    const res = await api.get('/report/data', {
      params: { startDate, endDate, mode, period }
    });
    return res.data;
  },

  // Lợi nhuận theo sản phẩm
  getProfitByProduct: async ({ startDate, endDate } = {}) => {
    const res = await api.get('/api/analytics/profit-by-product', {
      params: { startDate, endDate }
    });
    return res.data;
  },

  // Lợi nhuận theo khách hàng
  getProfitByCustomer: async ({ startDate, endDate } = {}) => {
    const res = await api.get('/api/analytics/profit-by-customer', {
      params: { startDate, endDate }
    });
    return res.data;
  },

  // Dòng tiền hàng ngày
  getDailyCashflow: async ({ startDate, endDate } = {}) => {
    const res = await api.get('/api/analytics/daily-cashflow', {
      params: { startDate, endDate }
    });
    return res.data;
  },

  // Lịch sử mua hàng của khách
  getCustomerHistory: async (customerId, { limit = 20 } = {}) => {
    const res = await api.get(`/api/analytics/customer-history/${customerId}`, {
      params: { limit }
    });
    return res.data;
  },
};

// ==================== SYSTEM API ====================

const SystemAPI = {
  // Ping server
  ping: async () => {
    const res = await api.get('/api/ping');
    return res.data;
  },

  // Kiểm tra sức khỏe server
  health: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Khám phá server (cloud sync)
  discover: async (deviceId) => {
    const res = await api.get('/api/discover', {
      params: { deviceId }
    });
    return res.data;
  },

  // Lấy thông tin phiên
  getAuth: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
};

// ==================== SETTINGS ====================

const SettingsAPI = {
  // Lưu base URL
  setServerUrl: async (url) => {
    await AsyncStorage.setItem('serverBaseUrl', url);
  },

  // Lấy base URL đã lưu
  getServerUrl: async () => {
    return await AsyncStorage.getItem('serverBaseUrl') || DEFAULT_BASE_URL;
  },
};

// ==================== EXPORT ====================

export default api;
export { ProductsAPI, SalesAPI, CustomersAPI, StockAPI, KegsAPI, AnalyticsAPI, SystemAPI, SettingsAPI };
