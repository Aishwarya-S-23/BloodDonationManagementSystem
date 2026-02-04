import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { requestService } from '../../services/requestService';
import { getErrorMessage } from '../../utils/errorHandler';

export const fetchHospitalRequests = createAsyncThunk(
  'requests/fetchHospitalRequests',
  async (params, { rejectWithValue }) => {
    try {
      const data = await requestService.getHospitalRequests(params);
      return data;
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      return rejectWithValue(errorInfo.message);
    }
  }
);

export const fetchRequestDetails = createAsyncThunk(
  'requests/fetchRequestDetails',
  async (id, { rejectWithValue }) => {
    try {
      const data = await requestService.getRequestDetails(id);
      return data;
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      return rejectWithValue(errorInfo.message);
    }
  }
);

export const createRequest = createAsyncThunk(
  'requests/createRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const data = await requestService.createRequest(requestData);
      return data;
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      return rejectWithValue(errorInfo.message);
    }
  }
);

export const cancelRequest = createAsyncThunk(
  'requests/cancelRequest',
  async (id, { rejectWithValue }) => {
    try {
      const data = await requestService.cancelRequest(id);
      return data;
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      return rejectWithValue(errorInfo.message);
    }
  }
);

export const fetchBloodBankRequests = createAsyncThunk(
  'requests/fetchBloodBankRequests',
  async (_, { rejectWithValue }) => {
    try {
      const data = await requestService.getBloodBankRequests();
      return data;
    } catch (error) {
      const errorInfo = getErrorMessage(error);
      return rejectWithValue(errorInfo.message);
    }
  }
);

const requestSlice = createSlice({
  name: 'requests',
  initialState: {
    hospitalRequests: [],
    bloodBankRequests: [],
    currentRequest: null,
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    updateRequestStatus: (state, action) => {
      const { id, status } = action.payload;
      const request = state.hospitalRequests.find((r) => r._id === id);
      if (request) {
        request.status = status;
      }
      if (state.currentRequest?._id === id) {
        state.currentRequest.status = status;
      }
    },
    clearCurrentRequest: (state) => {
      state.currentRequest = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Hospital Requests
      .addCase(fetchHospitalRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHospitalRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.hospitalRequests = action.payload.requests;
        state.total = action.payload.total;
      })
      .addCase(fetchHospitalRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Request Details
      .addCase(fetchRequestDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequestDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequest = action.payload.request;
      })
      .addCase(fetchRequestDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Request
      .addCase(createRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.hospitalRequests.unshift(action.payload.request);
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel Request
      .addCase(cancelRequest.fulfilled, (state, action) => {
        const index = state.hospitalRequests.findIndex(
          (r) => r._id === action.payload.request._id
        );
        if (index !== -1) {
          state.hospitalRequests[index] = action.payload.request;
        }
        if (state.currentRequest?._id === action.payload.request._id) {
          state.currentRequest = action.payload.request;
        }
      })
      // Fetch Blood Bank Requests
      .addCase(fetchBloodBankRequests.fulfilled, (state, action) => {
        state.bloodBankRequests = action.payload.requests;
      });
  },
});

export const { updateRequestStatus, clearCurrentRequest, clearError } = requestSlice.actions;
export default requestSlice.reducer;

