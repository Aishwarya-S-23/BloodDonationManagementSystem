import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    modal: {
      open: false,
      type: null,
      data: null,
    },
    toast: {
      open: false,
      message: '',
      type: 'info', // info, success, error, warning
    },
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action) => {
      state.modal = {
        open: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeModal: (state) => {
      state.modal = {
        open: false,
        type: null,
        data: null,
      };
    },
    showToast: (state, action) => {
      state.toast = {
        open: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
      };
    },
    hideToast: (state) => {
      state.toast = {
        open: false,
        message: '',
        type: 'info',
      };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  showToast,
  hideToast,
} = uiSlice.actions;
export default uiSlice.reducer;

