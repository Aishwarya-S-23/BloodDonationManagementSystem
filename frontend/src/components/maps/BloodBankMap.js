import React, { useMemo } from 'react';
import MapplsMap from './MapplsMap';

const BloodBankMap = ({ bloodBanks = [], center = [19.0760, 72.8777], zoom = 10 }) => {
  // Filter and prepare blood bank data for MapplsMap
  const processedBloodBanks = useMemo(() => {
    return bloodBanks
      .filter(bank => bank.coordinates?.latitude && bank.coordinates?.longitude)
      .map(bank => ({
        id: bank._id,
        name: bank.name,
        address: `${bank.address?.street || ''}, ${bank.address?.city || ''}`.trim(),
        latitude: bank.coordinates.latitude,
        longitude: bank.coordinates.longitude,
        type: 'bloodBank',
        status: bank.status,
        phone: bank.contact?.phone,
        operatingHours: bank.operatingHours ? `${bank.operatingHours.start} - ${bank.operatingHours.end}` : null,
        distance: bank.distance
      }));
  }, [bloodBanks]);

  if (!processedBloodBanks || processedBloodBanks.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No blood banks to display</p>
      </div>
    );
  }

  return (
    <MapplsMap
      center={center}
      zoom={zoom}
      height="384px" // h-96 = 384px
      facilities={processedBloodBanks}
      showTraffic={false}
      onMarkerClick={(facility) => {
        console.log('Blood bank clicked:', facility);
        // Handle blood bank click - could show detailed info or navigate
      }}
      className="w-full rounded-lg overflow-hidden border border-gray-200"
    />
  );
};

export default BloodBankMap;

