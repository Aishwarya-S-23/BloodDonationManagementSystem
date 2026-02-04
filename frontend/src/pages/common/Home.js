import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapplsMap from '../../components/maps/MapplsMap';
import api from '../../services/api';
import { requestService } from '../../services/requestService';
import { mapService } from '../../services/mapService';
import UrgencyIndicator from '../../components/common/UrgencyIndicator';
import StatusBadge from '../../components/common/StatusBadge';
import MapLayerToggle from '../../components/maps/MapLayerToggle';
import MapLegend from '../../components/maps/MapLegend';
import MapFilters from '../../components/maps/MapFilters';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import SkeletonLoader from '../../components/common/SkeletonLoader';

// Custom marker colors for different facility types
const getMarkerColor = (facility) => {
  if (facility.type === 'bloodBank') return '#FF0000'; // Red
  if (facility.type === 'hospital') return '#0000FF';  // Blue
  if (facility.type === 'college') return '#00FF00';   // Green
  return '#FF0000'; // Default red
};

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const { city } = useSelector((state) => state.location);
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [donationCenters, setDonationCenters] = useState([]);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [mapZoom, setMapZoom] = useState(13);
  const [searchBloodGroup, setSearchBloodGroup] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    bloodBanks: true,
    hospitals: true,
    donationCenters: true,
  });
  const [mapRadius, setMapRadius] = useState(50);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);

  // Handle layer toggle changes
  const handleLayerToggle = (activeLayerIds) => {
    const newFilters = {
      bloodBanks: activeLayerIds.includes('bloodBank'),
      hospitals: activeLayerIds.includes('hospital'),
      donationCenters: activeLayerIds.includes('donationCamp'),
    };
    setActiveFilters(newFilters);
    // Reload facilities with new layer selection
    loadNearbyFacilities(mapRadius, activeLayerIds.length > 0 ? activeLayerIds : ['bloodBank', 'hospital', 'donationCamp']);
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setMapRadius(filters.radius);
    setSelectedBloodGroups(filters.bloodGroups || []);
    const types = [];
    if (activeFilters.bloodBanks) types.push('bloodBank');
    if (activeFilters.hospitals) types.push('hospital');
    if (activeFilters.donationCenters) types.push('donationCamp');
    loadNearbyFacilities(filters.radius, types.length > 0 ? types : ['bloodBank', 'hospital', 'donationCamp']);
  };
  // Role-specific summary data
  const [summaryData, setSummaryData] = useState({
    activeRequests: 0,
    criticalShortages: 0,
    eligibleOpportunities: 0,
    emergencyDrives: 0,
    systemAlerts: 0,
  });
  const [nearbyRequests, setNearbyRequests] = useState([]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    loadUserLocation();
    loadRoleSpecificData();
  }, [user]);

  useEffect(() => {
    if (userLocation) {
      loadNearbyFacilities();
    }
  }, [userLocation, searchBloodGroup, searchLocation]);

  // Load role-specific summary data
  const loadRoleSpecificData = async () => {
    if (!user) return;
    
    try {
      // Load data based on role
      if (user.role === 'Hospital') {
        const data = await requestService.getHospitalRequests({ status: ['pending', 'processing'] });
        setSummaryData({
          activeRequests: data.requests?.length || 0,
          criticalShortages: data.requests?.filter(r => r.urgency === 'critical').length || 0,
        });
        setNearbyRequests(data.requests?.slice(0, 3) || []);
      } else if (user.role === 'BloodBank') {
        // Load inventory alerts and pending requests
        const requests = await requestService.getBloodBankRequests();
        setSummaryData({
          activeRequests: requests.requests?.length || 0,
          criticalShortages: 0, // Would come from inventory alerts
        });
      } else if (user.role === 'Donor') {
        // Load eligible donation opportunities
        // This would come from matching blood requests
        setSummaryData({
          eligibleOpportunities: 0, // Would be populated from matching requests
        });
      } else if (user.role === 'College') {
        // Load emergency donation drives
        setSummaryData({
          emergencyDrives: 0, // Would come from escalated requests
        });
      } else if (user.role === 'Admin') {
        // System health alerts
        setSummaryData({
          systemAlerts: 0,
        });
      }
    } catch (error) {
      console.error('Error loading role-specific data:', error);
    }
  };

  const loadUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
        },
        () => {
          // Use default location if geolocation fails
          setUserLocation({ lat: mapCenter[0], lng: mapCenter[1] });
        }
      );
    } else {
      setUserLocation({ lat: mapCenter[0], lng: mapCenter[1] });
    }
  };

  const loadNearbyFacilities = async (radius = 50, types = ['bloodBank', 'hospital', 'donationCamp']) => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const response = await mapService.getNearbyFacilities(
        userLocation.lat,
        userLocation.lng,
        radius,
        types
      );

      if (response.success && response.facilities) {
        const facilities = response.facilities;
        setBloodBanks(facilities.filter((f) => f.type === 'bloodBank'));
        setHospitals(facilities.filter((f) => f.type === 'hospital'));
        setDonationCenters(facilities.filter((f) => f.type === 'donationCamp' || f.type === 'college'));
      } else {
        setBloodBanks([]);
        setHospitals([]);
        setDonationCenters([]);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      setBloodBanks([]);
      setHospitals([]);
      setDonationCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadNearbyFacilities();
  };

  const handleEmergencyRequest = () => {
    if (user?.role === 'Hospital') {
      navigate('/requests/create');
    } else {
      navigate('/help/emergency');
    }
  };

  const allFacilities = [
    ...bloodBanks.map((f) => ({ ...f, type: 'bloodBank' })),
    ...hospitals.map((f) => ({ ...f, type: 'hospital' })),
    ...donationCenters.map((f) => ({ ...f, type: f.type === 'college' ? 'donationCamp' : 'donationCenter' })),
  ]
    .filter((f) => {
      if (f.type === 'bloodBank') return activeFilters.bloodBanks;
      if (f.type === 'hospital') return activeFilters.hospitals;
      if (f.type === 'donationCenter' || f.type === 'donationCamp') return activeFilters.donationCenters;
      return true;
    })
    .filter((f) => {
      // Apply blood group filter if selected
      if (selectedBloodGroups.length > 0 && f.bloodGroup) {
        return selectedBloodGroups.includes(f.bloodGroup);
      }
      return true;
    })
    .filter((f) => {
      // Apply status filter if selected
      if (selectedStatus.length > 0 && f.status) {
        return selectedStatus.includes(f.status);
      }
      return true;
    });


  // Get role-specific summary cards
  const getSummaryCards = () => {
    if (!user) return [];

    switch (user.role) {
      case 'Hospital':
        return [
          {
            title: 'Active Requests',
            value: summaryData.activeRequests,
            color: 'blue',
            icon: '📋',
            link: '/requests',
            description: 'Your blood requests',
          },
          {
            title: 'Critical Shortages',
            value: summaryData.criticalShortages,
            color: 'red',
            icon: '🚨',
            link: '/requests?filter=critical',
            description: 'Urgent blood needs',
          },
          {
            title: 'Incoming Help',
            value: 0, // Would come from donor confirmations
            color: 'green',
            icon: '💉',
            link: '/requests',
            description: 'Donors responding',
          },
        ];
      case 'BloodBank':
        return [
          {
            title: 'Pending Requests',
            value: summaryData.activeRequests,
            color: 'yellow',
            icon: '📋',
            link: '/requests',
            description: 'Assigned requests',
          },
          {
            title: 'Stock Alerts',
            value: summaryData.criticalShortages,
            color: 'red',
            icon: '⚠️',
            link: '/bloodbank/inventory',
            description: 'Low inventory',
          },
          {
            title: 'Testing Queue',
            value: 0,
            color: 'blue',
            icon: '🔬',
            link: '/bloodbank/donations',
            description: 'Pending tests',
          },
        ];
      case 'Donor':
        return [
          {
            title: 'Eligible Opportunities',
            value: summaryData.eligibleOpportunities,
            color: 'red',
            icon: '🩸',
            link: '/requests',
            description: 'Matching requests',
          },
          {
            title: 'Next Donation',
            value: 0,
            color: 'green',
            icon: '📅',
            link: '/donor/appointments',
            description: 'Days until eligible',
          },
          {
            title: 'Total Donations',
            value: 0,
            color: 'blue',
            icon: '💉',
            link: '/donor/profile',
            description: 'Lifes saved',
          },
        ];
      case 'College':
        return [
          {
            title: 'Emergency Drives',
            value: summaryData.emergencyDrives,
            color: 'red',
            icon: '🚨',
            link: '/requests',
            description: 'Active drives',
          },
          {
            title: 'Mobilized Donors',
            value: 0,
            color: 'green',
            icon: '👥',
            link: '/college/dashboard',
            description: 'Students enrolled',
          },
        ];
      case 'Admin':
        return [
          {
            title: 'System Alerts',
            value: summaryData.systemAlerts,
            color: 'yellow',
            icon: '⚠️',
            link: '/admin/dashboard',
            description: 'System issues',
          },
          {
            title: 'Active Users',
            value: 0,
            color: 'blue',
            icon: '👥',
            link: '/admin/users',
            description: 'Online now',
          },
        ];
      default:
        return [];
    }
  };

  const summaryCards = getSummaryCards();

  return (
    <div className="space-y-6">
      {/* Header with Location */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <p className="text-gray-600 mt-1">
            {city ? `📍 ${city}` : 'Find nearby blood banks, hospitals, and donation centers'}
          </p>
        </div>
      </div>

      {/* Live Emergency Banner */}
      {summaryData.criticalShortages > 0 && (
        <div className="bg-red-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-lg">🚨 Active Emergency: {summaryData.criticalShortages} Critical Request{summaryData.criticalShortages > 1 ? 's' : ''}</p>
              <p className="text-sm opacity-90">Immediate action required</p>
            </div>
          </div>
          <Link
            to="/requests?filter=critical"
            className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            View Requests
          </Link>
        </div>
      )}

      {/* Role-Specific Summary Cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`text-4xl p-3 rounded-lg bg-${card.color}-100`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold text-${card.color}-600`}>
                    {card.value}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Nearby Requests (for relevant roles) */}
      {nearbyRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active Requests Near You</h2>
            <Link to="/requests" className="text-red-600 hover:text-red-700 font-medium text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {nearbyRequests.map((request) => (
              <Link
                key={request._id}
                to={`/requests/${request._id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {request.bloodGroup} - {request.component || 'Whole Blood'}
                    </h3>
                    <StatusBadge status={request.status} />
                    <UrgencyIndicator urgency={request.urgency} />
                  </div>
                  <span className="text-sm text-gray-600">{request.units} units</span>
                </div>
                <p className="text-sm text-gray-600">
                  Required by: {new Date(request.deadline || request.requiredBy).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-bloodGroup" className="block text-sm font-medium text-gray-700 mb-2">
              Blood Group
            </label>
            <select
              id="search-bloodGroup"
              value={searchBloodGroup}
              onChange={(e) => setSearchBloodGroup(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="search-location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="search-location"
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Enter city or area"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Search
            </button>
            {(user?.role === 'Hospital' || user?.role === 'Admin') && (
              <button
                onClick={handleEmergencyRequest}
                className="bg-red-700 text-white px-6 py-2 rounded-md hover:bg-red-800 transition-colors font-medium whitespace-nowrap"
              >
                🚨 Emergency
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters.bloodBanks}
              onChange={(e) =>
                setActiveFilters({ ...activeFilters, bloodBanks: e.target.checked })
              }
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Blood Banks</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters.hospitals}
              onChange={(e) =>
                setActiveFilters({ ...activeFilters, hospitals: e.target.checked })
              }
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Hospitals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters.donationCenters}
              onChange={(e) =>
                setActiveFilters({ ...activeFilters, donationCenters: e.target.checked })
              }
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Donation Centers</span>
          </label>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <MapLayerToggle
              activeLayers={[
                ...(activeFilters.bloodBanks ? ['bloodBank'] : []),
                ...(activeFilters.hospitals ? ['hospital'] : []),
                ...(activeFilters.donationCenters ? ['donationCamp'] : []),
              ]}
              onToggle={handleLayerToggle}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <MapFilters
              initialRadius={mapRadius}
              initialBloodGroups={selectedBloodGroups}
              onApply={handleFilterChange}
            />
            <MapLegend />
          </div>
        </div>
        {loading ? (
  <SkeletonLoader type="map" />
) : (
  <div
    className="h-96 rounded-lg overflow-hidden border border-gray-200 map-container-soft"
    style={{ minHeight: '384px' }}
  >
    <MapplsMap
      center={mapCenter}
      zoom={mapZoom}
      height="100%"
      facilities={allFacilities}
      showTraffic={true}
      onMarkerClick={(facility) => {
        console.log('Facility clicked:', facility);
        // Handle marker click - could navigate to facility details
      }}
      className="w-full"
    />
  </div>
)}

      </div>

      {/* Facilities List */}
      {allFacilities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Nearby Facilities ({allFacilities.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allFacilities.map((facility) => (
              <div
                key={facility._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{facility.name}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                    {facility.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {facility.address?.street}, {facility.address?.city}
                </p>
                {facility.distance && (
                  <p className="text-sm font-medium text-red-600">{facility.distance} km away</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

