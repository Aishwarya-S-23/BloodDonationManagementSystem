import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '../../services/inventoryService';

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (params, { rejectWithValue }) => {
    try {
      const data = await inventoryService.getInventory(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inventory');
    }
  }
);

export const fetchExpiringInventory = createAsyncThunk(
  'inventory/fetchExpiringInventory',
  async (thresholdDays, { rejectWithValue }) => {
    try {
      const data = await inventoryService.getExpiringInventory(thresholdDays);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch expiring inventory');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    summary: [],
    expiring: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateInventoryItem: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex((item) => item._id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.inventory;
        state.summary = action.payload.summary;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Expiring Inventory
      .addCase(fetchExpiringInventory.fulfilled, (state, action) => {
        state.expiring = action.payload.expiring;
      });
  },
});

export const { updateInventoryItem, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;

