// src/services/tripService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/trips`;

// 复用通用的请求处理逻辑 (也可以抽离到 utils/request.js)
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 处理 204 No Content
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || '请求失败');
  }

  return data;
};

export const tripService = {
  // 获取所有行程
  getAllTrips: async (status = null) => {
    const query = status ? `?status=${status}` : '';
    return request(`${query}`, { method: 'GET' });
  },

  // 获取行程统计
  getStats: async () => {
    return request('/stats', { method: 'GET' });
  },

  // 获取单个行程详情
  getTripById: async (id) => {
    return request(`/${id}`, { method: 'GET' });
  },

  // 创建行程
  createTrip: async (tripData) => {
    return request('', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  },

  // 更新行程
  updateTrip: async (id, tripData) => {
    return request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  },

  // 删除行程
  deleteTrip: async (id) => {
    return request(`/${id}`, { method: 'DELETE' });
  },

  // 完成行程 (评分)
  completeTrip: async (id, rating) => {
    return request(`/${id}/complete?rating=${rating}`, {
      method: 'POST'
    });
  }
};