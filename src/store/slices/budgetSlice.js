// src/store/slices/budgetSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { budgetService } from '../../services/budgetService';

// 异步 Action: 获取预算详情
export const fetchBudgetSummary = createAsyncThunk(
  'budget/fetchSummary',
  async (tripId, { rejectWithValue }) => {
    try {
      return await budgetService.getBudgetSummary(tripId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 异步 Action: 添加预算项
export const createBudgetItem = createAsyncThunk(
  'budget/createItem',
  async ({ tripId, data }, { rejectWithValue, dispatch }) => {
    try {
      const res = await budgetService.createBudgetItem(tripId, data);
      dispatch(fetchBudgetSummary(tripId)); // 刷新数据
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 异步 Action: 删除预算项
export const deleteBudgetItem = createAsyncThunk(
  'budget/deleteItem',
  async ({ tripId, itemId }, { rejectWithValue, dispatch }) => {
    try {
      await budgetService.deleteBudgetItem(itemId);
      dispatch(fetchBudgetSummary(tripId)); // 刷新数据
      return itemId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// [新增] 异步 Action: 更新预算项
export const updateBudgetItem = createAsyncThunk(
  'budget/updateItem',
  async ({ tripId, itemId, data }, { rejectWithValue, dispatch }) => {
    try {
      const res = await budgetService.updateBudgetItem(itemId, data);
      dispatch(fetchBudgetSummary(tripId)); // 更新成功后刷新列表
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


// [新增] 获取支出列表
export const fetchExpenses = createAsyncThunk(
  'budget/fetchExpenses',
  async (tripId, { rejectWithValue }) => {
    try {
      return await budgetService.getExpenses(tripId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// [新增] 添加支出
export const addExpense = createAsyncThunk(
  'budget/addExpense',
  async ({ tripId, data }, { rejectWithValue, dispatch }) => {
    try {
      const res = await budgetService.addExpense(tripId, data);
      // 关键：添加支出后，必须刷新预算汇总（更新已支出金额）和支出列表
      dispatch(fetchBudgetSummary(tripId)); 
      dispatch(fetchExpenses(tripId));
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);



// [修改] 更新支出 (成功后刷新预算汇总和相关列表)
export const updateExpense = createAsyncThunk(
  'budget/updateExpense',
  async ({ tripId, expenseId, data, budgetItemId }, { rejectWithValue, dispatch }) => {
    try {
      const res = await budgetService.updateExpense(tripId, expenseId, data);
      dispatch(fetchBudgetSummary(tripId)); // 刷新进度条
      dispatch(fetchExpenses(tripId));      // 刷新首页最新支出
      // 如果是在详情页修改的，刷新详情列表
      if (budgetItemId) {
        dispatch(fetchBudgetItemExpenses({ tripId, budgetItemId }));
      }
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// [修改] 删除支出
export const deleteExpense = createAsyncThunk(
  'budget/deleteExpense',
  async ({ tripId, expenseId, budgetItemId }, { rejectWithValue, dispatch }) => {
    try {
      await budgetService.deleteExpense(tripId, expenseId);
      dispatch(fetchBudgetSummary(tripId));
      dispatch(fetchExpenses(tripId));
      if (budgetItemId) {
        dispatch(fetchBudgetItemExpenses({ tripId, budgetItemId }));
      }
      return expenseId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// [新增] 获取特定预算项的支出
export const fetchBudgetItemExpenses = createAsyncThunk(
  'budget/fetchItemExpenses',
  async ({ tripId, budgetItemId }, { rejectWithValue }) => {
    try {
      return await budgetService.getBudgetItemExpenses(tripId, budgetItemId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


const initialState = {
  summary: null, // { total_budget, total_spent, items: [], insights: [], ... }
  expenses: [], // [新增] 存储支出列表
  itemExpenses: [],   // [新增] 详情弹窗显示的支出列表
  loading: false,
  error: null,
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    clearBudgetState: (state) => {
      state.summary = null;
      state.expenses = []; // [新增] 清空支出列表
      state.itemExpenses= [];  // [新增] 详情弹窗显示的支出列表
      state.error = null;
    },
      // 清空详情列表 (关闭弹窗时用)
    clearItemExpenses: (state) => {
      state.itemExpenses = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgetSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgetSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchBudgetSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload;
      })
      .addCase(fetchBudgetItemExpenses.fulfilled, (state, action) => {
        state.itemExpenses = action.payload;
      });

  },
});

export const { clearBudgetState,clearItemExpenses } = budgetSlice.actions;
export default budgetSlice.reducer;