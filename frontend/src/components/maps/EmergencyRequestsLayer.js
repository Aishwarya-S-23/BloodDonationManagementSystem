import React, { useState, useEffect } from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import publicApiService from '../../services/publicApiService';

// Mock emergency requests data - in real app, this would be real-time data
const mockEmergencyRequests = [
  {
    id: 1,
    hospitalName: 'City General Hospital',
    location: [19.0760, 72.8777], // Exact location (blurred for privacy)
    blurredLocation: [19.0760 + (Math.random() - 0.5) * 0.01, 72.8777 + (Math.random() - 0.5) * 0.01], // Slightly offset
    bloodTypes: ['O+', 'A+'],
    urgency: 'critical',
    unitsNeeded: 4,
    timePosted: '15 minutes ago',
    status: 'active',
    patientInfo: 'Emergency surgery - Accident victim'
  },
  {
    id: 2,
    hospitalName: 'Metro Medical Center',
    location: [28.6139, 77.2090],
    blurredLocation: [28.6139 + (Math.random() - 0.5) * 0.01, 77.2090 + (Math.random() - 0.5) * 0.01],
    bloodTypes: ['B-', 'O-'],
    urgency: 'high',
    unitsNeeded: 2,
    timePosted: '32 minutes ago',
    status: 'active',
    patientInfo: 'Cancer treatment - Chemotherapy'
  },
  {
    id: 3,
    hospitalName: 'Regional Blood Bank',
    location: [13.0827, 80.2707],
    blurredLocation: [13.0827 + (Math.random() - 0.5) * 0.01, 80.2707 + (Math.random() - 0.5) * 0.01],
    bloodTypes: ['AB+'],
    urgency: 'medium',
    unitsNeeded: 1,
    timePosted: '1 hour ago',
    status: 'active',
    patientInfo: 'Routine surgery preparation'
  }
];

// Custom emergency request icon
const createEmergencyIcon = (urgency) => {
  const colors = {
    critical: '#dc2626', // Red
    high: '#ea580c',     // Orange
    medium: '#d97706',   // Yellow
    low: '#65a30d'       // Green
  };

  return L.divIcon({
    className: 'emergency-marker',
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full border-3 border-white shadow-lg animate-pulse"
             style="background-color: ${colors[urgency]}; box-shadow: 0 0 20px ${colors[urgency]}40;">
        </div>
        <div class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
          <div class="w-2 h-2 rounded-full" style="background-color: ${colors[urgency]};"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const EmergencyRequestsLayer = ({ visible, userLocation }) => {
  const [emergencyRequests, setEmergencyRequests] = useState([]);

  useEffect(() => {
    const fetchEmergencyRequests = async () => {
      if (!visible) return;

      try {
        const params = {};
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
          params.radius = 50; // Within 50km
        }

        const response = await publicApiService.get('/public/emergency-requests', { params });

        if (response.success) {
          setEmergencyRequests(response.emergencyRequests);
        } else {
          console.error('Error fetching emergency requests:', response.error);
        }
      } catch (err) {
        console.error('Error fetching emergency requests:', err);
        // Fallback to mock data if API fails
        setEmergencyRequests(mockEmergencyRequests);
      }
    };

    fetchEmergencyRequests();
  }, [visible, userLocation]);


  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[urgency] || colors.medium;
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      critical: '🚨 Critical',
      high: '⚠️ High Priority',
      medium: '📋 Medium',
      low: 'ℹ️ Low Priority'
    };
    return labels[urgency] || labels.medium;
  };

  if (!visible) return null;

  return (
    <>
      {emergencyRequests
        .filter(request => request.location && request.blurredLocation && Array.isArray(request.location) && Array.isArray(request.blurredLocation))
        .map((request) => (
        <React.Fragment key={request.id}>
          {/* Privacy blur circle - shows general area */}
          <Circle
            center={request.location}
            radius={200} // 200m blur radius
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.1,
              weight: 1,
              dashArray: '5, 5'
            }}
          />

          {/* Emergency request marker at blurred location */}
          <Marker
            position={request.blurredLocation}
            icon={createEmergencyIcon(request.urgency)}
          >
            <Popup>
              <div className="p-4 max-w-xs">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{request.hospitalName}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getUrgencyColor(request.urgency)}`}>
                    {getUrgencyLabel(request.urgency)}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <p><strong>Blood Needed:</strong> {request.bloodTypes.join(', ')}</p>
                  <p><strong>Units:</strong> {request.unitsNeeded}</p>
                  <p><strong>Posted:</strong> {request.timePosted}</p>
                  <p className="text-slate-500 italic">{request.patientInfo}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex gap-2">
                    <button className="flex-1 bg-red-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-red-600 transition-colors">
                      Respond Now
                    </button>
                    <button className="flex-1 border border-slate-300 text-slate-700 text-xs py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      View Details
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    📍 Location blurred for privacy
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}
    </>
  );
};

export default EmergencyRequestsLayer;
