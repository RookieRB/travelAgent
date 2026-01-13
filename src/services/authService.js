// src/services/auth.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

// 通用请求处理函数
const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 如果有 token，自动带上 (用于需要认证的接口)
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || '操作失败，请稍后重试');
  }

  return data;
};

export const authService = {
  // 注册
  register: async (userData) => {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 登录
  login: async (credentials) => {
    const data = await request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // 登录成功自动存储 Token
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      // 可以选择存储用户名或过期时间
      localStorage.setItem('user_info', JSON.stringify({ 
        username: credentials.username 
      })); 
    }
    return data;
  },


  // 获取当前用户信息 (GET /me)
  getMe: async () => {
    return request('/me', { method: 'GET' });
  },

  // 对应后端 UserUpdate 模型: { nickname, avatar, phone }
  updateProfile: async (userData) => {
    return request('/me', {
      method: 'PUT', 
      body: JSON.stringify(userData),
    });
  },

  // 修改密码 (POST /change-password)
  // 对应后端 PasswordChange 模型: { old_password, new_password }
  changePassword: async (passwordData) => {
    return request('/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  // 退出登录
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    // 如果后端有黑名单机制，这里可以调用 API 通知后端
    // request('/logout', { method: 'POST' }); 
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 检查是否登录
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};