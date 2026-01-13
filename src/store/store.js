import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tripReducer from './slices/tripSlice';
import budgetReducer from './slices/budgetSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    trips: tripReducer,
    budget: budgetReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 关闭序列化检查（可选，防止传入非序列化数据报错）
    }),
});