import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import requestSlice from './slices/requestSlice';
import inventorySlice from './slices/inventorySlice';
import notificationSlice from './slices/notificationSlice';
import uiSlice from './slices/uiSlice';
import locationSlice from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    requests: requestSlice,
    inventory: inventorySlice,
    notifications: notificationSlice,
    ui: uiSlice,
    location: locationSlice,
  },
});

