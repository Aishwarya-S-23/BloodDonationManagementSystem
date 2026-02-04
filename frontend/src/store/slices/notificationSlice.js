import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const data = await notificationService.getNotifications(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const data = await notificationService.markAsRead(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark notification as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.markAllAsRead();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark all as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    updateNotification: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.notifications.findIndex((n) => n._id === id);
      if (index !== -1) {
        state.notifications[index] = { ...state.notifications[index], ...updates };
        if (updates.read && !state.notifications[index].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(
          (n) => n._id === action.payload.notification._id
        );
        if (index !== -1) {
          state.notifications[index] = action.payload.notification;
          if (!state.notifications[index].read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, updateNotification, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;

