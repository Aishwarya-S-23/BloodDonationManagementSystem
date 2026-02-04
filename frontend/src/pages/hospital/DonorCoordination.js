import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { requestService } from '../../services/requestService';
import { donorService } from '../../services/donorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const DonorCoordination = () => {
  const { user } = useSelector(state => state.auth);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [donorResponses, setDonorResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('responses');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await requestService.getHospitalRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadDonorResponses = async (requestId) => {
    try {
      // This would need a backend endpoint to get donor responses for a request
      // For now, we'll simulate with mock data
      const mockResponses = [
        {
          id: 1,
          donorName: 'Rahul Sharma',
          bloodGroup: 'O+',
          distance: 5.2,
          responseTime: '2 minutes ago',
          status: 'confirmed',
          appointmentTime: '2026-01-20T14:00:00Z',
        },
        {
          id: 2,
          donorName: 'Priya Patel',
          bloodGroup: 'O+',
          distance: 3.1,
          responseTime: '5 minutes ago',
          status: 'confirmed',
          appointmentTime: '2026-01-20T15:30:00Z',
        },
        {
          id: 3,
          donorName: 'Amit Kumar',
          bloodGroup: 'O-',
          distance: 8.7,
          responseTime: '8 minutes ago',
          status: 'pending',
        },
        {
          id: 4,
          donorName: 'Sneha Singh',
          bloodGroup: 'O+',
          distance: 2.3,
          responseTime: '12 minutes ago',
          status: 'declined',
          reason: 'Not available today',
        },
      ];
      setDonorResponses(mockResponses);
    } catch (error) {
      console.error('Error loading donor responses:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      declined: '❌',
      completed: '🏁',
      cancelled: '🚫',
    };
    return icons[status] || '❓';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donor Coordination</h1>
          <p className="text-gray-600 mt-1">Monitor donor responses and manage appointments for your requests</p>
        </div>
      </div>

      {/* Active Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Active Requests</h3>
        {requests.length === 0 ? (
          <p className="text-gray-600">No active requests</p>
        ) : (
          <div className="space-y-3">
            {requests
              .filter(req => ['pending', 'processing'].includes(req.status))
              .map((request) => (
              <div
                key={request._id}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedRequest(request);
                  loadDonorResponses(request._id);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">
                      {request.units} units of {request.bloodGroup} {request.component}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Deadline: {new Date(request.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 block ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {request.fulfillmentDetails && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Requested:</span>
                        <span className="font-medium ml-1">{request.units}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fulfilled:</span>
                        <span className="font-medium ml-1 text-green-600">
                          {request.fulfillmentDetails.fulfilledUnits || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-medium ml-1 text-orange-600">
                          {request.units - (request.fulfillmentDetails.fulfilledUnits || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donor Responses Section */}
      {selectedRequest && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Donor Responses - {selectedRequest.units} units {selectedRequest.bloodGroup} {selectedRequest.component}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(selectedRequest.urgency)}`}>
                {selectedRequest.urgency} priority
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('responses')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'responses'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Donor Responses ({donorResponses.length})
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'appointments'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Confirmed Appointments ({donorResponses.filter(r => r.status === 'confirmed').length})
                </button>
              </nav>
            </div>

            {activeTab === 'responses' && (
              <div className="space-y-4">
                {donorResponses.map((response) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <span className="text-2xl mr-4">{getStatusIcon(response.status)}</span>
                        <div>
                          <h4 className="font-semibold">{response.donorName}</h4>
                          <p className="text-sm text-gray-600">
                            {response.bloodGroup} • {response.distance}km away • Responded {response.responseTime}
                          </p>
                          {response.appointmentTime && (
                            <p className="text-sm text-green-600 mt-1">
                              📅 Appointment: {new Date(response.appointmentTime).toLocaleString()}
                            </p>
                          )}
                          {response.reason && (
                            <p className="text-sm text-red-600 mt-1">
                              Reason: {response.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                        {response.status}
                      </span>
                    </div>

                    {response.status === 'confirmed' && (
                      <div className="mt-4 flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm">
                          View Details
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm">
                          Confirm Appointment
                        </button>
                        <button className="text-orange-600 hover:text-orange-900 text-sm">
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {donorResponses.length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-4xl">👥</span>
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No donor responses yet</h3>
                    <p className="text-gray-600 mt-2">Donor responses will appear here as they respond to your request</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {donorResponses
                  .filter(response => response.status === 'confirmed')
                  .map((response) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{response.donorName}</h4>
                        <p className="text-sm text-gray-600">
                          {response.bloodGroup} • {response.distance}km away
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          📅 {new Date(response.appointmentTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2 block">
                          Confirmed
                        </span>
                        <div className="space-y-1">
                          <button className="block text-blue-600 hover:text-blue-900 text-sm">
                            Edit
                          </button>
                          <button className="block text-red-600 hover:text-red-900 text-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {donorResponses.filter(r => r.status === 'confirmed').length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-4xl">📅</span>
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No confirmed appointments</h3>
                    <p className="text-gray-600 mt-2">Confirmed donor appointments will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Responses</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{donorResponses.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Confirmed</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {donorResponses.filter(r => r.status === 'confirmed').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {donorResponses.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Declined</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {donorResponses.filter(r => r.status === 'declined').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorCoordination;
