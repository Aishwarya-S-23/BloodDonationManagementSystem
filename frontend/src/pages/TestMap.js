import React from 'react';
import MapplsMap from '../components/maps/MapplsMap';

const TestMap = () => {
  // Sample facilities for testing
  const testFacilities = [
    {
      id: '1',
      name: 'Test Blood Bank',
      latitude: 28.6139,
      longitude: 77.2090,
      type: 'bloodBank',
      address: 'Delhi, India'
    },
    {
      id: '2',
      name: 'Test Hospital',
      latitude: 28.6200,
      longitude: 77.2100,
      type: 'hospital',
      address: 'Delhi, India'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mappls Map Test</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Mappls Integration Test</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              This page tests the Mappls map integration. If the map loads successfully,
              you should see a map of Delhi with markers.
            </p>
            <div className="text-xs text-gray-500">
              <p>API Key: {process.env.REACT_APP_MAPPLS_API_KEY ? 'Set' : 'Not set'}</p>
              <p>SDK Status: Check browser console for details</p>
            </div>
          </div>

          <MapplsMap
            center={[28.6139, 77.2090]} // Delhi
            zoom={12}
            height="500px"
            facilities={testFacilities}
            showTraffic={false}
            onMarkerClick={(facility) => {
              console.log('Marker clicked:', facility);
              alert(`Clicked: ${facility.name}`);
            }}
            className="border border-gray-200"
          />

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Test Facilities:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {testFacilities.map(facility => (
                <li key={facility.id}>
                  • {facility.name} ({facility.type}) at {facility.latitude}, {facility.longitude}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMap;
