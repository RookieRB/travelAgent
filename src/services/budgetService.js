// src/services/budgetService.js

// 假设基础 API 路径是 /api
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/trips`;

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || '请求失败');
  }

  return data;
};

export const budgetService = {
  // 获取预算汇总 (GET /api/trips/{trip_id}/budget)
  getBudgetSummary: async (tripId) => {
    return request(`/${tripId}/budget`, { method: 'GET' });
  },

  // 添加预算项 (POST /api/trips/{trip_id}/budget)
  createBudgetItem: async (tripId, data) => {
    return request(`/${tripId}/budget`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新预算项 (PUT /api/trips/budget/{item_id})
  updateBudgetItem: async (itemId, data) => {
    return request(`/budget/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除预算项 (DELETE /api/trips/budget/{item_id})
  deleteBudgetItem: async (itemId) => {
    return request(`/budget/${itemId}`, { method: 'DELETE' });
  },

  addExpense: async (tripId, data) => {
    return request(`/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 获取支出记录列表 (GET /api/trips/{trip_id}/expenses)
  getExpenses: async (tripId) => {
    return request(`/${tripId}/expenses`, { method: 'GET' });
  },

  getBudgetItemExpenses: async(tripId,budgetItemId) => {
    return request(`/${tripId}/budget/${budgetItemId}/expenses`, { method: 'GET' });
  },
  // 跟新支出记录 
  updateExpense: async (tripId,expenseId, data) => {
    return request(`/${tripId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  // [新增] 删除支出
  deleteExpense: async (tripId,expenseId) => {
    return request(`/${tripId}/expenses/${expenseId}`, { method: 'DELETE' });
  },
};