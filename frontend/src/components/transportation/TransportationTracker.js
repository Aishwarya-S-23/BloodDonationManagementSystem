import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { transportationService } from '../../services/transportationService';
import LoadingSpinner from '../common/LoadingSpinner';

const TransportationTracker = ({ transportationId, compact = false }) => {
  const [transportation, setTransportation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    if (transportationId) {
      fetchTransportationDetails();
    }
  }, [transportationId]);

  const fetchTransportationDetails = async () => {
    try {
      setLoading(true);
      const response = await transportationService.getTransportationDetails(transportationId);
      setTransportation(response.transportation);
    } catch (err) {
      setError('Failed to load transportation details');
      console.error('Error fetching transportation:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      dispatched: 'bg-blue-100 text-blue-800',
      en_route: 'bg-blue-100 text-blue-800',
      arrived: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: '📅',
      dispatched: '🚛',
      en_route: '🚚',
      arrived: '🏥',
      delivered: '✅',
      cancelled: '❌',
      failed: '⚠️',
    };
    return icons[status] || '📦';
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !transportation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Transportation details not available'}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Transport Status</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transportation.status)}`}>
            {getStatusIcon(transportation.status)} {transportation.status.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-1 text-sm text-gray-600">
          <p>From: {transportation.pickupLocation.address.city}</p>
          <p>To: {transportation.deliveryLocation.address.city}</p>
          <p>Distance: {transportation.distance} km</p>
          {transportation.estimatedDeliveryTime && (
            <p>ETA: {new Date(transportation.estimatedDeliveryTime).toLocaleTimeString()}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transportation Details</h2>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(transportation.status)}`}>
          {getStatusIcon(transportation.status)} {transportation.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Route Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Route Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">From:</span>
              <span className="font-medium">{transportation.pickupLocation.address.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">To:</span>
              <span className="font-medium">{transportation.deliveryLocation.address.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium">{transportation.distance} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Duration:</span>
              <span className="font-medium">{formatDuration(transportation.estimatedDuration)}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Vehicle Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{transportation.vehicleDetails.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacity:</span>
              <span className="font-medium">{transportation.vehicleDetails.capacity} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registration:</span>
              <span className="font-medium">{transportation.vehicleDetails.registrationNumber}</span>
            </div>
            {transportation.driverId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Driver:</span>
                <span className="font-medium">Assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blood Units */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Blood Units</h3>
        <div className="space-y-2">
          {transportation.bloodUnits.map((unit, index) => (
            <div key={index} className="flex justify-between items-center bg-white p-3 rounded">
              <div>
                <span className="font-medium text-red-600">{unit.bloodGroup} {unit.component}</span>
                <span className="text-gray-600 ml-2">({unit.units} units)</span>
              </div>
              <span className="text-sm text-gray-500">Unit #{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status History */}
      {transportation.statusHistory && transportation.statusHistory.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Status History</h3>
          <div className="space-y-2">
            {transportation.statusHistory.map((history, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getStatusIcon(history.status)}</span>
                  <div>
                    <p className="font-medium capitalize">{history.status.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500">{new Date(history.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                {history.location && (
                  <span className="text-sm text-gray-600">
                    📍 {history.location.latitude.toFixed(4)}, {history.location.longitude.toFixed(4)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {transportation.issues && transportation.issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Issues Reported</h3>
          <div className="space-y-2">
            {transportation.issues.map((issue, index) => (
              <div key={index} className="bg-white p-3 rounded border-l-4 border-red-400">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium capitalize">{issue.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">{issue.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Reported: {new Date(issue.reportedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportationTracker;
