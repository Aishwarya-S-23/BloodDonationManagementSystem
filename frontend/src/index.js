import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Mappls styles are loaded dynamically by the SDK
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Auth0Provider } from "@auth0/auth0-react";

const root = ReactDOM.createRoot(document.getElementById('root'));

// Global error handler for map-related errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && (
    event.error.message.includes('map') ||
    event.error.message.includes('Mappls') ||
    event.error.message.includes('leaflet')
  )) {
    console.warn('Map-related error caught globally:', event.error);
    event.preventDefault(); // Prevent the error from being logged to console
  }
});

// Handle unhandled promise rejections from map operations
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('map') ||
    event.reason.message.includes('Mappls') ||
    event.reason.message.includes('leaflet')
  )) {
    console.warn('Unhandled map-related promise rejection:', event.reason);
    event.preventDefault();
  }
});

root.render(
  <Provider store={store}>
  <Auth0Provider
    domain="dev-fy0q8vpxaaqr63d2.us.auth0.com"
    clientId="SJzaOKWIxIVjN2B7NzkVmSreTbacz4fr"
    authorizationParams={{ redirect_uri: window.location.origin }}
  >
    <App />
  </Auth0Provider>
  </Provider>
);

