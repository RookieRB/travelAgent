// src/store/slices/tripSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tripService } from '@/services/tripService';

// 异步 Action: 获取列表
export const fetchTrips = createAsyncThunk(
  'trips/fetchAll',
  async (status, { rejectWithValue }) => {
    try {
      return await tripService.getAllTrips(status);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 异步 Action: 获取统计
export const fetchTripStats = createAsyncThunk(
  'trips/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await tripService.getStats();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 异步 Action: 创建行程
export const createTrip = createAsyncThunk(
  'trips/create',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const res = await tripService.createTrip(data);
      // 创建成功后刷新统计数据
      dispatch(fetchTripStats());
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 异步 Action: 删除行程
export const deleteTrip = createAsyncThunk(
  'trips/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await tripService.deleteTrip(id);
      dispatch(fetchTripStats());
      return id; // 返回被删除的 ID
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 异步 Action: 更新行程
export const updateTrip = createAsyncThunk(
  'trips/update',
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      const res = await tripService.updateTrip(id, data);
      // 更新成功后，刷新列表和统计（或者可以直接在 reducer 中更新 state.trips）
      dispatch(fetchTripStats());
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


const tripSlice = createSlice({
  name: 'trips',
  initialState: {
    trips: [],
    stats: null,
    //全局当前选中的行程 ID，初始化尝试从本地读取
    currentTripId: localStorage.getItem('currentTripId') || null, 
    loading: false,
    error: null,
  },
  reducers: {
    // 2. 新增：设置当前行程 ID 的 Action
    setCurrentTripId: (state, action) => {
      state.currentTripId = action.payload;
      // 同步保存到 localStorage
      if (action.payload) {
        localStorage.setItem('currentTripId', action.payload);
      } else {
        localStorage.removeItem('currentTripId');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Trips
      .addCase(fetchTrips.pending, (state) => { state.loading = true; })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload;
        // 如果当前没有选中的 ID，且列表不为空，自动选中第一个
        if (!state.currentTripId && action.payload.length > 0) {
          state.currentTripId = action.payload[0].id;
          localStorage.setItem('currentTripId', action.payload[0].id);
        }
        // 如果当前选中的 ID 不在新的列表中（比如被删除了），重置为第一个或 null
        else if (state.currentTripId && !action.payload.find(t => t.id === state.currentTripId)) {
          if (action.payload.length > 0) {
            state.currentTripId = action.payload[0].id;
            localStorage.setItem('currentTripId', action.payload[0].id);
          } else {
            state.currentTripId = null;
            localStorage.removeItem('currentTripId');
          }
        }
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Stats
      .addCase(fetchTripStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Create Trip
      .addCase(createTrip.fulfilled, (state, action) => {
        state.trips.unshift(action.payload); // 将新行程加到列表头部
      })
      // Delete Trip
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.trips = state.trips.filter(t => t.id !== action.payload);
      })
       // [新增] 处理更新成功
      .addCase(updateTrip.fulfilled, (state, action) => {
        // 找到列表中的旧数据并替换
        const index = state.trips.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
      });
      
  },
});
export const { setCurrentTripId } = tripSlice.actions;
export default tripSlice.reducer;