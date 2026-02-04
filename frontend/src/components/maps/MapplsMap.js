import React, { useEffect, useRef, useState } from 'react';
import mapplsMapService from '../../services/mapplsMapService';

/**
 * MapplsMap Component - Replaces Leaflet MapContainer
 * Provides a React wrapper for Mappls Web SDK
 */
const MapplsMap = ({
  center = [28.6139, 77.2090], // Default to Delhi
  zoom = 12,
  height = '400px',
  facilities = [],
  showTraffic = false,
  onMarkerClick = null,
  onMapClick = null,
  className = '',
  children
}) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [sdkStatus, setSdkStatus] = useState('Loading...');

  // Initialize map when component mounts
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        console.log('MapplsMap: Starting initialization...');
        setSdkStatus('Checking SDK...');

        if (!mapContainerRef.current) {
          console.error('MapplsMap: Container ref not available');
          setSdkStatus('Container not ready');
          return;
        }

        // Initialize Mappls SDK and create map
        console.log('MapplsMap: Initializing SDK...');
        setSdkStatus('Loading Mappls SDK...');

        await mapplsMapService.initializeMapplsSDK();
        setSdkStatus('SDK loaded, creating map...');

        if (!isMounted) return;

        console.log('MapplsMap: Creating map instance...');
        const map = await mapplsMapService.initializeMap(mapContainerRef.current, {
          center,
          zoom
        });

        if (!isMounted) return;

        console.log('MapplsMap: Map created successfully');
        mapRef.current = map;
        setMapLoaded(true);
        setSdkStatus('Map ready');

        // Add traffic layer if requested
        if (showTraffic) {
          mapplsMapService.addTrafficLayer();
        }

        // Add event listeners
        if (onMapClick) {
          map.on('click', onMapClick);
        }

        console.log('MapplsMap component initialized successfully');

      } catch (err) {
        console.error('Failed to initialize MapplsMap:', err);
        setSdkStatus('Error: ' + err.message);
        if (isMounted) {
          setError(err.message);
        }
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapplsMapService.destroy();
        mapRef.current = null;
      }
    };
  }, [center, zoom, showTraffic, onMapClick]);

  // Update facilities when they change
  useEffect(() => {
    if (!mapLoaded || !facilities.length) return;

    try {
      // Clear existing markers
      mapplsMapService.clearMarkers();

        // Add new facility markers
      const markers = mapplsMapService.addFacilityMarkers(facilities.map(facility => ({
        id: facility._id || facility.id,
        name: facility.name,
        address: facility.address || facility.location?.address,
        latitude: facility.latitude || facility.coordinates?.latitude || facility.location?.lat,
        longitude: facility.longitude || facility.coordinates?.longitude || facility.location?.lng,
        type: facility.type,
        status: facility.status
      })), {
        onMarkerClick
      });

      // Fit bounds to show all markers
      if (markers.length > 0) {
        const positions = facilities.map(facility => [facility.latitude, facility.longitude]);
        mapplsMapService.fitBounds(positions);
      }

    } catch (err) {
      console.error('Failed to update facilities:', err);
    }
  }, [facilities, mapLoaded, onMarkerClick]);

  // Handle map container resizing
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      // Force map to resize
      setTimeout(() => {
        if (mapRef.current && typeof mapRef.current.resize === 'function') {
          mapRef.current.resize();
        }
      }, 100);
    }
  }, [height, mapLoaded]);

  // Generate unique ID for map container
  const mapId = `mappls-map-${Math.random().toString(36).substr(2, 9)}`;

  if (error) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm font-medium">Map failed to load</p>
          <p className="text-gray-400 text-xs mt-1">{error}</p>
          <div className="mt-3 text-left">
            <p className="text-xs text-gray-500">Troubleshooting:</p>
            <ul className="text-xs text-gray-400 list-disc list-inside mt-1">
              <li>Check Mappls API key</li>
              <li>Verify internet connection</li>
              <li>Check browser console for details</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapContainerRef}
        id={mapId}
        className="w-full rounded-lg border"
        style={{
          height,
          minHeight: '200px'
        }}
      />

      {!mapLoaded && !error && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
            <p className="text-gray-400 text-xs mt-1">{sdkStatus}</p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default MapplsMap;
