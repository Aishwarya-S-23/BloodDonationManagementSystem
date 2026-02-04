import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { setLocation } from '../../store/slices/locationSlice';
import { requestService } from '../../services/requestService';

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount, notifications } = useSelector((state) => state.notifications);
  const { city } = useSelector((state) => state.location);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Check for emergency/critical requests
  const loadEmergencies = useCallback(async () => {
    try {
      if (user?.role === 'Hospital') {
        const data = await requestService.getHospitalRequests({ urgency: 'critical', status: ['pending', 'processing'] });
        setEmergencyCount(data.requests?.filter(r => r.urgency === 'critical').length || 0);
      } else if (user?.role === 'BloodBank' || user?.role === 'Donor') {
        // Count critical notifications
        const critical = notifications?.filter(n => n.priority === 'urgent' && !n.read) || [];
        setEmergencyCount(critical.length);
      }
    } catch (error) {
      console.error('Error loading emergencies:', error);
    }
  }, [user?.role, notifications]);

  // Auto-detect user location
  const detectLocation = useCallback(() => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding to get city name (using OpenStreetMap Nominatim API)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const cityName = data.address?.city || data.address?.town || data.address?.county || 'Unknown';
            dispatch(setLocation({
              city: cityName,
              latitude,
              longitude,
              address: data.display_name || '',
              autoDetected: true,
            }));
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            dispatch(setLocation({
              city: 'Detected',
              latitude,
              longitude,
              address: '',
              autoDetected: true,
            }));
          } finally {
            setLoadingLocation(false);
          }
        },
        () => {
          setLoadingLocation(false);
        }
      );
    } else {
      setLoadingLocation(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications({ unreadOnly: true }));
      loadEmergencies();
    }
  }, [isAuthenticated, dispatch, loadEmergencies]);

  useEffect(() => {
    // Auto-detect location on mount if not set
    if (!city && isAuthenticated && navigator.geolocation) {
      detectLocation();
    }
  }, [city, isAuthenticated, detectLocation]);

  const handleLocationChange = (selectedCity) => {
    // In a real app, this would update the location filter across the app
    dispatch(setLocation({
      city: selectedCity,
      latitude: null,
      longitude: null,
      address: selectedCity,
      autoDetected: false,
    }));
    setShowLocationMenu(false);
  };


  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="glass-strong sticky top-0 z-50 border-b border-white/30 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link 
              to="/home" 
              className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                <span className="text-2xl">🩸</span>
              </div>
              <span className="text-2xl font-display font-bold text-gradient-primary hidden sm:block">
                Blood Connect
              </span>
            </Link>

            {/* Location Selector */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setShowLocationMenu(!showLocationMenu)}
                className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 
                         hover:text-primary-600 hover:bg-white/60 rounded-2xl transition-all duration-200
                         backdrop-blur-sm border border-white/30 shadow-soft hover:shadow-soft-lg
                         active:scale-95"
              >
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{city || 'Select Location'}</span>
                {loadingLocation && (
                  <svg className="animate-spin h-4 w-4 text-primary-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>
              
              {/* Location Dropdown */}
              {showLocationMenu && (
                <div className="absolute top-full mt-2 left-0 w-72 glass-strong rounded-3xl shadow-soft-lg border border-white/30 z-50 overflow-hidden animate-slide-down">
                  <div className="p-3">
                    <button
                      onClick={detectLocation}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-white/60 rounded-2xl flex items-center space-x-3 transition-all duration-200 hover:shadow-soft active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="font-medium">Auto-detect Location</span>
                    </button>
                    <div className="border-t border-slate-200/50 my-3"></div>
                    <div className="text-xs font-medium text-slate-500 px-4 py-2 uppercase tracking-wider">Popular Cities</div>
                    <div className="space-y-1">
                      {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'].map((cityName) => (
                        <button
                          key={cityName}
                          onClick={() => handleLocationChange(cityName)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-white/60 rounded-xl transition-all duration-200 hover:shadow-soft active:scale-95"
                        >
                          {cityName}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Emergency Alert Indicator */}
            {emergencyCount > 0 && (
              <Link
                to="/requests"
                className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-emergency text-white rounded-2xl 
                         hover:bg-emergency-light transition-all duration-200 font-semibold text-sm shadow-glow-sm 
                         hover:shadow-glow active:scale-95 animate-pulse-emergency"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Emergency ({emergencyCount})</span>
              </Link>
            )}

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                to="/home"
                className="px-4 py-2 text-slate-700 hover:text-primary-600 rounded-2xl hover:bg-white/60 
                         transition-all duration-200 font-medium text-sm active:scale-95"
              >
                Home
              </Link>
              <Link
                to="/requests"
                className="px-4 py-2 text-slate-700 hover:text-primary-600 rounded-2xl hover:bg-white/60 
                         transition-all duration-200 font-medium text-sm active:scale-95"
              >
                Requests
              </Link>
              <Link
                to="/help"
                className="px-4 py-2 text-slate-700 hover:text-primary-600 rounded-2xl hover:bg-white/60 
                         transition-all duration-200 font-medium text-sm active:scale-95"
              >
                Help
              </Link>
            </div>

            {/* Notifications - Desktop only (mobile uses bottom nav) */}
            <Link
              to="/notifications"
              className="hidden md:block relative p-2.5 text-slate-600 hover:text-primary-600 
                       rounded-2xl hover:bg-white/60 transition-all duration-200 active:scale-95"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 block h-6 w-6 rounded-full bg-emergency text-white 
                                text-xs font-bold flex items-center justify-center shadow-glow-sm animate-pulse-soft">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right pr-4">
                <p className="text-sm font-semibold text-slate-900">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-500 capitalize font-medium">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 
                            flex items-center justify-center text-white font-semibold shadow-soft
                            ring-2 ring-primary-200">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white/60 backdrop-blur-sm 
                         rounded-2xl hover:bg-white/80 border border-white/30 shadow-soft 
                         hover:shadow-soft-lg transition-all duration-200 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Click outside to close location menu */}
      {showLocationMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={() => setShowLocationMenu(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;

