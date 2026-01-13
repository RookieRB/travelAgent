import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';

// 1. 定义异步操作 (Thunks)

// 注册
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 登录
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      return data; // 返回 { access_token, user_info... }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 获取当前用户信息 (用于初始化或刷新页面后)
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 更新用户资料 Action
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      // 调用 API 更新
      const updatedUser = await authService.updateProfile(userData);
      
      // 更新 localStorage 中的缓存 (可选)
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);



// 从 LocalStorage 初始化状态 (防止刷新丢失登录态)
const token = localStorage.getItem('token');
const userInfo = localStorage.getItem('user_info') 
  ? JSON.parse(localStorage.getItem('user_info')) 
  : null;



const initialState = {
  user: userInfo,
  token: token,
  isAuthenticated: !!token,
  loading: false,
  error: null,
  successMessage: null, // 用于注册成功提示
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 同步 Action: 退出登录
    logout: (state) => {
      authService.logout(); // 清除 localStorage
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // 清除错误信息
    clearError: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 处理登录状态
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        // 假设后端登录返回了用户信息，如果没有，需要再调一次 getMe
        // 这里暂时用存入 localStorage 的模拟数据
        const user = { username: action.meta.arg.username }; 
        state.user = user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '登录失败';
      })
      // 处理注册状态
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = '注册成功，请登录';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '注册失败';
      })
     // 处理 updateProfile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // API 返回的是完整的 UserResponse，直接覆盖
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       // 处理 fetchCurrentUser
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;