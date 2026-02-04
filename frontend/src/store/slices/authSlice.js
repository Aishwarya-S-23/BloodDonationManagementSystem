import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHandler';

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      user,
      token,
      isAuthenticated: !!(token && user),
      loading: false,
      error: null,
      initialized: false,
    };
  } catch (error) {
    console.error('Error loading auth state:', error);
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: false,
    };
  }
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);

      if (!response.success) {
        return rejectWithValue(response.message || 'Login failed');
      }

      // Store in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      console.error('Login thunk error:', error);
      const errorInfo = getErrorMessage(error);
      return rejectWithValue(errorInfo.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);

      if (!response.success) {
        return rejectWithValue(response.message || 'Registration failed');
      }

      // Store in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      console.error('Register thunk error:', error);
      const errorInfo = getErrorMessage(error);
      return rejectWithValue(errorInfo.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Call logout API if needed (optional)
      try {
        await authService.logout();
      } catch (error) {
        // Logout API call failed, but local cleanup is done
        console.warn('Logout API call failed:', error);
      }

      return null;
    } catch (error) {
      console.error('Logout thunk error:', error);
      return rejectWithValue('Logout failed');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();

      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to get profile');
      }

      return response.data.user;
    } catch (error) {
      console.error('Get profile thunk error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to get profile');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // Verify token with backend
      const response = await authService.verifyToken();

      if (!response.success) {
        throw new Error('Token invalid');
      }

      return response.data.user;
    } catch (error) {
      // Clear invalid auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue('Authentication check failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        state.initialized = true;
        // Clear localStorage on login failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        state.initialized = true;
        // Clear localStorage on register failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })

      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
        // Update localStorage with fresh profile data
        localStorage.setItem('user', JSON.stringify(state.user));
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.initialized = true;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Still clear local state even if API call fails
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        state.initialized = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.initialized = true;
      });
  },
});

export const { clearError, setInitialized, updateUser } = authSlice.actions;
export default authSlice.reducer;
