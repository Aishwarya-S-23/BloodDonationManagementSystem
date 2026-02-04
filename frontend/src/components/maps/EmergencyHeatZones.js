import React, { useState, useEffect } from 'react';
import { Circle } from 'react-leaflet';
import publicApiService from '../../services/publicApiService';

const EmergencyHeatZones = ({ visible, userLocation }) => {
  const [emergencyZones, setEmergencyZones] = useState([]);

  useEffect(() => {
    const fetchEmergencyZones = async () => {
      if (!visible) return;

      try {
        const params = {};
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
          params.radius = 100; // Within 100km
        }

        const response = await publicApiService.get('/public/emergency-zones', { params });

        if (response.success) {
          setEmergencyZones(response.emergencyZones);
        } else {
          console.error('Error fetching emergency zones:', response.error);
        }
      } catch (err) {
        console.error('Error fetching emergency zones:', err);
        // Fallback to empty array if API fails
        setEmergencyZones([]);
      }
    };

    fetchEmergencyZones();
  }, [visible, userLocation]);


  const getZoneColor = (intensity) => {
    // Color gradient from yellow (low) to red (high)
    if (intensity >= 0.8) return '#dc2626'; // Red
    if (intensity >= 0.6) return '#ea580c'; // Orange-red
    if (intensity >= 0.4) return '#d97706'; // Orange
    return '#eab308'; // Yellow
  };

  const getZoneOpacity = (intensity) => {
    return Math.max(0.1, intensity * 0.3); // Min 0.1, max 0.3
  };

  if (!visible) return null;

  return (
    <>
      {emergencyZones
        .filter(zone => zone.center && zone.radius && Array.isArray(zone.center) && typeof zone.radius === 'number')
        .map((zone) => (
        <Circle
          key={zone.id}
          center={zone.center}
          radius={zone.radius}
          pathOptions={{
            color: getZoneColor(zone.intensity),
            fillColor: getZoneColor(zone.intensity),
            fillOpacity: getZoneOpacity(zone.intensity),
            weight: 2,
            dashArray: '5, 5'
          }}
        />
      ))}
    </>
  );
};

export default EmergencyHeatZones;
