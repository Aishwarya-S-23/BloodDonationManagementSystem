import React, { useState, useEffect } from 'react';
import { Circle } from 'react-leaflet';

// Mock donor density data - in real app, this would be aggregated and anonymized
const mockDonorDensity = [
  {
    id: 1,
    center: [19.0760, 72.8777], // Mumbai - high density
    radius: 3000,
    density: 0.9, // Very high donor density
    activeDonors: 1250,
    bloodTypes: ['O+', 'A+', 'B+', 'AB+'],
    avgResponseTime: '15 min'
  },
  {
    id: 2,
    center: [28.6139, 77.2090], // Delhi - high density
    radius: 2500,
    density: 0.8,
    activeDonors: 980,
    bloodTypes: ['A+', 'O+', 'B+', 'A-'],
    avgResponseTime: '12 min'
  },
  {
    id: 3,
    center: [13.0827, 80.2707], // Chennai - medium density
    radius: 4000,
    density: 0.6,
    activeDonors: 650,
    bloodTypes: ['O+', 'B+', 'A+', 'AB+'],
    avgResponseTime: '20 min'
  },
  {
    id: 4,
    center: [22.5726, 88.3639], // Kolkata - medium density
    radius: 3500,
    density: 0.5,
    activeDonors: 420,
    bloodTypes: ['B+', 'O+', 'A+', 'AB-'],
    avgResponseTime: '25 min'
  },
  {
    id: 5,
    center: [12.9716, 77.5946], // Bangalore - high density
    radius: 2800,
    density: 0.7,
    activeDonors: 890,
    bloodTypes: ['O+', 'A+', 'B+', 'O-'],
    avgResponseTime: '18 min'
  },
  {
    id: 6,
    center: [18.5204, 73.8567], // Pune - medium density
    radius: 3200,
    density: 0.4,
    activeDonors: 380,
    bloodTypes: ['A+', 'O+', 'AB+', 'B+'],
    avgResponseTime: '30 min'
  },
  {
    id: 7,
    center: [23.2599, 77.4126], // Bhopal - low density
    radius: 4500,
    density: 0.3,
    activeDonors: 180,
    bloodTypes: ['O+', 'A+', 'B+'],
    avgResponseTime: '45 min'
  }
];

const DonorDensityHeatmap = ({ visible, userLocation, selectedBloodGroups = [] }) => {
  const [donorZones, setDonorZones] = useState([]);

  useEffect(() => {
    // In real app, fetch from API based on user location and selected blood groups
    if (userLocation) {
      let filteredZones = mockDonorDensity.filter(zone => {
        const distance = getDistance(userLocation, zone.center);
        return distance <= 100; // Within 100km
      });

      // Filter by blood groups if selected
      if (selectedBloodGroups.length > 0) {
        filteredZones = filteredZones.filter(zone =>
          selectedBloodGroups.some(group => zone.bloodTypes.includes(group))
        );
      }

      setDonorZones(filteredZones);
    } else {
      setDonorZones(mockDonorDensity);
    }
  }, [userLocation, selectedBloodGroups]);

  const getDistance = (point1, point2) => {
    // Handle undefined or invalid inputs
    if (!point1 || !point1.lat || !point1.lng || !point2 || !Array.isArray(point2) || point2.length !== 2) {
      return 0;
    }

    // Simple distance calculation (in km)
    const R = 6371; // Earth's radius in km
    const dLat = (point2[0] - point1.lat) * Math.PI / 180;
    const dLon = (point2[1] - point1.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDensityColor = (density) => {
    // Color gradient from light green (low) to dark green (high)
    if (density >= 0.8) return '#166534'; // Dark green
    if (density >= 0.6) return '#16a34a'; // Green
    if (density >= 0.4) return '#4ade80'; // Light green
    return '#86efac'; // Very light green
  };

  const getDensityOpacity = (density) => {
    return Math.max(0.15, density * 0.25); // Min 0.15, max 0.25
  };

  if (!visible) return null;

  return (
    <>
      {donorZones
        .filter(zone => zone.center && zone.radius && Array.isArray(zone.center) && typeof zone.radius === 'number')
        .map((zone) => (
        <Circle
          key={`donor-${zone.id}`}
          center={zone.center}
          radius={zone.radius}
          pathOptions={{
            color: getDensityColor(zone.density),
            fillColor: getDensityColor(zone.density),
            fillOpacity: getDensityOpacity(zone.density),
            weight: 1,
            dashArray: '8, 8'
          }}
        />
      ))}
    </>
  );
};

export default DonorDensityHeatmap;
