import { createSlice } from '@reduxjs/toolkit';

const getInitialLocation = () => {
  const saved = localStorage.getItem('userLocation');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    city: '',
    latitude: null,
    longitude: null,
    address: '',
  };
};

const locationSlice = createSlice({
  name: 'location',
  initialState: {
    ...getInitialLocation(),
    autoDetected: false,
  },
  reducers: {
    setLocation: (state, action) => {
      const { city, latitude, longitude, address, autoDetected = false } = action.payload;
      state.city = city;
      state.latitude = latitude;
      state.longitude = longitude;
      state.address = address;
      state.autoDetected = autoDetected;
      localStorage.setItem('userLocation', JSON.stringify({
        city,
        latitude,
        longitude,
        address,
      }));
    },
    clearLocation: (state) => {
      state.city = '';
      state.latitude = null;
      state.longitude = null;
      state.address = '';
      state.autoDetected = false;
      localStorage.removeItem('userLocation');
    },
  },
});

export const { setLocation, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;

