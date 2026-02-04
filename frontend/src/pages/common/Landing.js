import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import MapplsMap from '../../components/maps/MapplsMap';
import { motion } from 'framer-motion';
import HeroSection from '../../components/public/HeroSection';
import ImpactMetrics from '../../components/public/ImpactMetrics';
import EducationalCarousel from '../../components/public/EducationalCarousel';
import TrustIndicators from '../../components/public/TrustIndicators';
import RoleSelectionModal from '../../components/public/RoleSelectionModal';
import { mapService } from '../../services/mapService';
import MapLayerToggle from '../../components/maps/MapLayerToggle';
import MapLegend from '../../components/maps/MapLegend';
import MapFilters from '../../components/maps/MapFilters';
import SkeletonLoader from '../../components/common/SkeletonLoader';



const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [userLocation, setUserLocation] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [searchBloodGroup, setSearchBloodGroup] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Default to Mumbai

  // Layer toggles for different facility types
  const [activeLayers, setActiveLayers] = useState(['bloodBank', 'hospital', 'donationCamp', 'emergencyZones', 'donorDensity', 'emergencyRequests']);
  const [mapRadius, setMapRadius] = useState(20);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadNearbyFacilities = useCallback(async (lat, lng) => {
    setLoading(true);

    try {
      // Try to load from API if online
      if (isOnline) {
        const response = await mapService.getNearbyFacilities(
          lat,
          lng,
          mapRadius,
          activeLayers
        );

        if (response.success && response.facilities) {
          const transformedFacilities = response.facilities.map(facility => ({
            id: facility._id,
            name: facility.name,
            type: facility.type,
            location: {
              lat: facility.coordinates.latitude,
              lng: facility.coordinates.longitude
            },
            address: `${facility.address?.street || ''}, ${facility.address?.city || ''}`.trim(),
            contact: facility.contact?.phone,
            status: facility.status,
            distance: facility.distance,
            operatingHours: facility.operatingHours ?
              `${facility.operatingHours.start} - ${facility.operatingHours.end}` : null,
          }));

          setFacilities(transformedFacilities);
          // Cache the data for offline use
          localStorage.setItem('cachedFacilities', JSON.stringify(transformedFacilities));
        } else {
          throw new Error('API returned no facilities');
        }
      } else {
        // Load from cache if offline
        const cached = localStorage.getItem('cachedFacilities');
        if (cached) {
          const parsedFacilities = JSON.parse(cached);
          setFacilities(parsedFacilities);
        } else {
          // No cached data available
          setFacilities([]);
        }
      }
    } catch (error) {
      console.error('Error loading facilities:', error);

      // Try cached data as fallback
      const cached = localStorage.getItem('cachedFacilities');
      if (cached) {
        const parsedFacilities = JSON.parse(cached);
        setFacilities(parsedFacilities);
      } else {
        setFacilities([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, mapRadius, activeLayers]);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          loadNearbyFacilities(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Use default location if geolocation fails
          loadNearbyFacilities(mapCenter[0], mapCenter[1]);
        }
      );
    } else {
      console.warn('Geolocation not supported');
      loadNearbyFacilities(mapCenter[0], mapCenter[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNearbyFacilities]); // mapCenter excluded to prevent infinite loop since we set it inside the effect

  const handleSearch = () => {
    // Navigate to search results or filter map
    if (searchBloodGroup || searchLocation) {
      // In a real implementation, filter facilities based on search criteria
      console.log('Searching for:', { bloodGroup: searchBloodGroup, location: searchLocation });
    }
  };

  const handleEmergencyRequest = () => {
    if (isAuthenticated && user?.role === 'Hospital') {
      navigate('/requests/create');
    } else if (isAuthenticated) {
      // For non-hospital users, redirect to their dashboard
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  const handleGetInvolved = () => {
    setShowRoleModal(true);
  };

  const handleLayerToggle = (activeLayerIds) => {
    setActiveLayers(activeLayerIds);
    if (userLocation) {
      loadNearbyFacilities(userLocation.lat, userLocation.lng);
    }
  };

  const handleFilterApply = (filters) => {
    setMapRadius(filters.radius);
    setSelectedBloodGroups(filters.bloodGroups || []);
    if (userLocation) {
      loadNearbyFacilities(userLocation.lat, userLocation.lng);
    }
  };

  const handleFacilityAction = (facility, action) => {
    if (action === 'directions') {
      // Open Google Maps with directions
      const destination = `${facility.location.lat},${facility.location.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, '_blank');
    } else if (action === 'inventory' && facility.type === 'bloodBank') {
      // Navigate to blood bank inventory page if user is authenticated and has permission
      if (isAuthenticated) {
        // This would typically navigate to a blood bank inventory view
        console.log('Navigate to blood bank inventory:', facility.id);
        // For now, show a toast or navigate to home
        toast.info('Inventory viewing requires blood bank access');
      } else {
        navigate('/login');
      }
    }
  };


  return (
    <div className="min-h-screen bg-background-light-50">
      {/* Connectivity Status Banner */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            You're currently offline. Some features may be limited.
          </div>
        </div>
      )}

      <main role="main" aria-label="Blood donation platform">
        <HeroSection />
        <ImpactMetrics />

        <EducationalCarousel />
        <TrustIndicators />

        {/* Get Involved CTA Section */}
        <section className="bg-gradient-to-r from-primary-500 to-success-500 text-white py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-xl mb-8 text-primary-100">
              Join thousands of donors, hospitals, and volunteers working together to save lives
            </p>
            <button
              onClick={handleGetInvolved}
              className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Involved Today
            </button>
            <p className="text-sm mt-4 text-primary-200">
              Choose your role: Donor • Hospital • Blood Bank • Volunteer
            </p>
          </div>
        </section>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6 mb-6" role="search" aria-label="Find blood donation facilities">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bloodGroupSelect" className="block text-sm font-medium text-slate-700 mb-2">
                Blood Group
              </label>
              <select
                id="bloodGroupSelect"
                value={searchBloodGroup}
                onChange={(e) => setSearchBloodGroup(e.target.value)}
                className="input-field"
                aria-describedby="bloodGroupHelp"
              >
                <option value="">All Blood Groups</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
              <span id="bloodGroupHelp" className="sr-only">Select your blood group to find compatible facilities</span>
            </div>
            <div>
              <label htmlFor="locationInput" className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <input
                id="locationInput"
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Enter city or area"
                className="input-field"
                aria-describedby="locationHelp"
              />
              <span id="locationHelp" className="sr-only">Enter a city or area to search for nearby facilities</span>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="btn-primary w-full"
                aria-label="Search for blood donation facilities"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Emergency CTA */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-3xl shadow-soft p-8 mb-6 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-3 flex items-center justify-center gap-2">
                🚨 Emergency Blood Needed?
              </h2>
              <p className="text-lg mb-6 text-red-100 max-w-2xl mx-auto">
                {isAuthenticated
                  ? `As a ${user?.role || 'registered user'}, you can create an emergency request to mobilize donors instantly across your area.`
                  : "Create an emergency request to mobilize donors instantly. Every minute counts when lives are at stake."
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
                <button
                  onClick={handleEmergencyRequest}
                  className="bg-white text-red-600 px-8 py-4 rounded-2xl font-bold hover:bg-red-50 transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
                >
                  {isAuthenticated ? '🚑 Create Emergency Request' : '🔐 Sign In to Create Request'}
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={handleGetInvolved}
                    className="border-2 border-white text-white px-6 py-4 rounded-2xl font-bold hover:bg-white hover:text-red-600 transition-all duration-300"
                  >
                    Join as Hospital/Blood Bank
                  </button>
                )}
              </div>

              {/* Role-specific messaging */}
              {isAuthenticated && (
                <div className="bg-white/10 rounded-2xl p-4 mt-4">
                  {user?.role === 'hospital' && (
                    <div className="text-center">
                      <p className="font-semibold mb-1">Hospital Dashboard Access</p>
                      <p className="text-sm text-red-100">Advanced emergency coordination • Priority donor matching • Real-time tracking</p>
                    </div>
                  )}
                  {user?.role === 'bloodBank' && (
                    <div className="text-center">
                      <p className="font-semibold mb-1">Blood Bank Coordination</p>
                      <p className="text-sm text-red-100">Inventory assessment • Supply chain activation • Regional support network</p>
                    </div>
                  )}
                  {(user?.role === 'donor' || user?.role === 'volunteer') && (
                    <div className="text-center">
                      <p className="font-semibold mb-1">Donor Volunteer Network</p>
                      <p className="text-sm text-red-100">Emergency alerts • Rapid response coordination • Community mobilization</p>
                    </div>
                  )}
                  {(!user?.role || user?.role === 'admin') && (
                    <div className="text-center">
                      <p className="font-semibold mb-1">Emergency Response System</p>
                      <p className="text-sm text-red-100">Multi-agency coordination • Resource allocation • Crisis management</p>
                    </div>
                  )}
                </div>
              )}

              {/* Trust indicators for emergency */}
              <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-red-100">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>24/7 Response</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Verified Donors Only</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Government Certified</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Real-time Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <section className="card p-6" aria-labelledby="mapHeading">
          <h2 id="mapHeading" className="text-2xl font-bold mb-4">📍 Nearby Facilities</h2>

          {/* Map Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <MapLayerToggle
              activeLayers={activeLayers}
              onToggle={handleLayerToggle}
              className="flex-1"
            />
            <div className="flex gap-4">
              <MapFilters
                initialRadius={mapRadius}
                initialBloodGroups={selectedBloodGroups}
                onApply={handleFilterApply}
              />
              <MapLegend />
            </div>
          </div>

          {loading ? (
            <SkeletonLoader type="map" />
          ) : (
            <div className="h-96 rounded-2xl overflow-hidden border border-slate-200">
              <MapplsMap
                center={mapCenter}
                zoom={13}
                height="100%"
                facilities={facilities.filter(facility =>
                  activeLayers.includes(facility.type) &&
                  facility.location?.lat &&
                  facility.location?.lng
                ).map(facility => ({
                  ...facility,
                  latitude: facility.location.lat,
                  longitude: facility.location.lng,
                  type: facility.type
                }))}
                showTraffic={activeLayers.includes('traffic')}
                onMarkerClick={(facility) => {
                  console.log('Facility clicked:', facility);
                  // Handle facility click - could show detailed info
                }}
              />
            </div>
          )}

        </section>

        {/* Facility List */}
        <section className="card mt-6 p-6" aria-labelledby="facilityListHeading">
          <h2 id="facilityListHeading" className="text-2xl font-bold mb-4">Nearby Facilities</h2>
          {loading ? (
            <SkeletonLoader type="list" count={6} />
          ) : facilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((facility, index) => (
                <motion.div
                  key={facility.id}
                  className="border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{facility.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
                      facility.status === 'Open' ? 'bg-success-100 text-success-700' :
                      facility.status === 'Limited' ? 'bg-warning-100 text-warning-700' :
                      facility.status === 'Emergency' ? 'bg-emergency/10 text-emergency' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {facility.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{facility.address}</p>
                  {facility.contact && (
                    <p className="text-xs text-slate-500 mb-1">📞 {facility.contact}</p>
                  )}
                  {facility.operatingHours && (
                    <p className="text-xs text-slate-500 mb-1">🕒 {facility.operatingHours}</p>
                  )}
                  {facility.capacity && (
                    <p className="text-xs text-slate-500 mb-1">🏥 Capacity: {facility.capacity}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs bg-background-light-100 px-2 py-1 rounded-full capitalize text-slate-700">
                      {facility.type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-medium text-primary-600">{facility.distance} km away</span>
                  </div>
                  {isAuthenticated && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFacilityAction(facility, facility.type === 'bloodBank' ? 'inventory' : 'directions')}
                          className="flex-1 btn-secondary text-xs py-2"
                        >
                          {facility.type === 'bloodBank' ? 'View Inventory' : 'Get Directions'}
                        </button>
                        {user?.role === 'Donor' && (facility.type === 'donationCamp' || facility.type === 'donationCenter') && (
                          <button
                            onClick={() => handleFacilityAction(facility, 'book')}
                            className="flex-1 bg-success-500 text-white text-xs py-2 px-3 rounded-xl hover:bg-success-600 transition-colors"
                          >
                            Book Slot
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {isOnline ? 'No facilities found nearby' : 'Offline - Showing cached data'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {isOnline
                    ? `We couldn't find any ${activeLayers.join(', ')} facilities within ${mapRadius}km of your location.`
                    : 'You\'re currently offline. Showing previously cached facility information.'
                  }
                </p>

                {isOnline ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setMapRadius(Math.min(mapRadius + 20, 100))}
                        className="btn-secondary text-sm"
                      >
                        🔍 Search wider area (+20km)
                      </button>
                      <button
                        onClick={() => setActiveLayers(['bloodBank', 'hospital', 'donationCamp', 'emergencyZones', 'donorDensity', 'emergencyRequests'])}
                        className="btn-secondary text-sm"
                      >
                        📋 Show all layers
                      </button>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">💡 Suggestions:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Check nearby cities or districts</li>
                        <li>• Look for blood banks in larger medical centers</li>
                        <li>• Contact local hospitals directly for emergency needs</li>
                        <li>• Consider becoming a donor to help build local supply</li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2">🚨 For emergencies:</h4>
                      <p className="text-sm text-amber-800">
                        If you need blood urgently, contact emergency services (108) or nearby hospitals directly.
                        BloodConnect can help coordinate once you're connected to a medical facility.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">🌐 Offline Mode:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Facility information may be outdated</li>
                      <li>• Emergency features require internet connection</li>
                      <li>• Contact numbers are cached for direct calling</li>
                      <li>• Reconnect to internet for real-time updates</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {isAuthenticated && (
          <section className="max-w-7xl mx-auto px-4 py-8" aria-labelledby="welcomeHeading">
            <div className="bg-gradient-to-r from-primary-50 to-success-50 rounded-3xl p-6 mb-8">
              <h2 id="welcomeHeading" className="text-2xl font-bold text-slate-900 mb-4">
                Welcome back, {user?.name || 'User'}!
                {user?.role && (
                  <span className="ml-2 text-sm font-normal text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
                    {user.role}
                  </span>
                )}
              </h2>

              {/* Role-specific dashboard content */}
              {user?.role === 'donor' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      🩸 Blood Group
                    </h3>
                    <p className="text-lg font-bold text-red-600">{user.bloodGroup || 'Not set'}</p>
                    <p className="text-xs text-slate-500 mt-1">Universal donor: O-</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      📅 Last Donation
                    </h3>
                    <p className="text-sm text-slate-600">{user.lastDonation || 'Never'}</p>
                    <p className="text-xs text-slate-500 mt-1">Next eligible: 56 days</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      🎯 Total Donations
                    </h3>
                    <p className="text-2xl font-bold text-green-600">{user.totalDonations || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Lives saved: ~{((user.totalDonations || 0) * 3)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      ⭐ Reputation
                    </h3>
                    <p className="text-lg font-bold text-yellow-600">{user.reputation || 'Good'}</p>
                    <p className="text-xs text-slate-500 mt-1">Response rate: 95%</p>
                  </div>
                </div>
              )}

              {user?.role === 'hospital' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      🚨 Active Requests
                    </h3>
                    <p className="text-2xl font-bold text-red-600">{user.activeRequests || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Pending fulfillment</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      🏥 Blood Stock
                    </h3>
                    <p className="text-lg font-bold text-blue-600">{user.bloodStock || '85%'}</p>
                    <p className="text-xs text-slate-500 mt-1">Units available</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      👥 Donor Network
                    </h3>
                    <p className="text-2xl font-bold text-green-600">{user.donorNetwork || 450}</p>
                    <p className="text-xs text-slate-500 mt-1">Trusted donors</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      ⚡ Response Time
                    </h3>
                    <p className="text-lg font-bold text-purple-600">{user.avgResponseTime || '12min'}</p>
                    <p className="text-xs text-slate-500 mt-1">Average fulfillment</p>
                  </div>
                </div>
              )}

              {user?.role === 'bloodBank' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      📦 Inventory
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">{user.inventoryUnits || 1250}</p>
                    <p className="text-xs text-slate-500 mt-1">Units in stock</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      ⏰ Expiring Soon
                    </h3>
                    <p className="text-lg font-bold text-orange-600">{user.expiringUnits || 45}</p>
                    <p className="text-xs text-slate-500 mt-1">Within 7 days</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      📈 Daily Collections
                    </h3>
                    <p className="text-2xl font-bold text-green-600">{user.dailyCollections || 28}</p>
                    <p className="text-xs text-slate-500 mt-1">Units today</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-soft">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      🏥 Hospital Orders
                    </h3>
                    <p className="text-lg font-bold text-red-600">{user.pendingOrders || 12}</p>
                    <p className="text-xs text-slate-500 mt-1">Awaiting fulfillment</p>
                  </div>
                </div>
              )}

              {/* Common Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <h3 className="font-semibold text-slate-800 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    {user?.role === 'donor' && (
                      <>
                        <button className="w-full btn-secondary text-sm py-2">
                          📅 Schedule Donation
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          📍 Find Nearby Centers
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          📊 View Donation History
                        </button>
                      </>
                    )}
                    {user?.role === 'hospital' && (
                      <>
                        <button className="w-full bg-red-500 text-white text-sm py-2 px-3 rounded-xl hover:bg-red-600 transition-colors">
                          🚨 Create Emergency Request
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          📦 Check Blood Stock
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          👥 Manage Donor Network
                        </button>
                      </>
                    )}
                    {user?.role === 'bloodBank' && (
                      <>
                        <button className="w-full btn-secondary text-sm py-2">
                          📦 Update Inventory
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          📋 Process Orders
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          📊 View Analytics
                        </button>
                      </>
                    )}
                    {user?.role === 'volunteer' && (
                      <>
                        <button className="w-full btn-secondary text-sm py-2">
                          📣 Manage Campaigns
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          👥 Coordinate Events
                        </button>
                        <button className="w-full btn-secondary text-sm py-2">
                          📞 Support Hotline
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <h3 className="font-semibold text-slate-800 mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {user?.role === 'donor' && (
                      <>
                        <p className="text-sm text-slate-600">✅ Donation completed - 2 weeks ago</p>
                        <p className="text-sm text-slate-600">📧 Certificate sent to email</p>
                        <p className="text-sm text-slate-600">🎉 5th donation milestone reached!</p>
                      </>
                    )}
                    {user?.role === 'hospital' && (
                      <>
                        <p className="text-sm text-slate-600">🚨 Emergency request fulfilled - 3 hours ago</p>
                        <p className="text-sm text-slate-600">📦 Blood units received from City Bank</p>
                        <p className="text-sm text-slate-600">👥 15 donors responded to call</p>
                      </>
                    )}
                    {user?.role === 'bloodBank' && (
                      <>
                        <p className="text-sm text-slate-600">📦 50 units processed today</p>
                        <p className="text-sm text-slate-600">🏥 Metro Hospital order fulfilled</p>
                        <p className="text-sm text-slate-600">⏰ 8 units expiring tomorrow</p>
                      </>
                    )}
                    {(!user?.role || user?.role === 'volunteer') && (
                      <>
                        <p className="text-sm text-slate-600">📣 College drive organized - 200 participants</p>
                        <p className="text-sm text-slate-600">👥 25 new donors registered</p>
                        <p className="text-sm text-slate-600">📅 Next event: Community Camp - Sunday</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <h3 className="font-semibold text-slate-800 mb-3">Notifications</h3>
                  <div className="space-y-2">
                    {user?.role === 'donor' && (
                      <>
                        <p className="text-sm text-green-600">🔔 You're eligible to donate again</p>
                        <p className="text-sm text-blue-600">📍 New blood drive near you</p>
                        <p className="text-sm text-slate-500">No urgent requests</p>
                      </>
                    )}
                    {user?.role === 'hospital' && (
                      <>
                        <p className="text-sm text-red-600">🚨 2 critical requests pending</p>
                        <p className="text-sm text-orange-600">📦 O- stock running low</p>
                        <p className="text-sm text-slate-500">3 routine requests fulfilled</p>
                      </>
                    )}
                    {user?.role === 'bloodBank' && (
                      <>
                        <p className="text-sm text-orange-600">⏰ 12 units expire in 24hrs</p>
                        <p className="text-sm text-blue-600">📦 New order from City Hospital</p>
                        <p className="text-sm text-slate-500">Inventory audit due</p>
                      </>
                    )}
                    {(!user?.role || user?.role === 'volunteer') && (
                      <>
                        <p className="text-sm text-green-600">✅ Event registration successful</p>
                        <p className="text-sm text-blue-600">📣 New awareness campaign launched</p>
                        <p className="text-sm text-slate-500">Training session tomorrow</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
        {!isAuthenticated && (
          <section className="max-w-7xl mx-auto px-4 py-8 text-center" aria-label="Sign in call to action">
            <p className="text-slate-600 mb-4">Already have an account?</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
          </section>
        )}

        {/* Role Selection Modal */}
        <RoleSelectionModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
        />
      </div>
      </main>
    </div>

  );
};

export default Landing;

