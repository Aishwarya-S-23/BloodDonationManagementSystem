import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHospitalRequests, createRequest } from '../../store/slices/requestSlice';
import { transportationService } from '../../services/transportationService';
import { publicApiService } from '../../services/publicApiService';
import LoadingSpinner from '../common/LoadingSpinner';
import BloodRequestForm from '../forms/BloodRequestForm';
import TransportationTracker from '../transportation/TransportationTracker';

const HospitalDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { hospitalRequests, loading, error } = useSelector(state => state.requests);

  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [transportations, setTransportations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    fulfilledRequests: 0,
    activeTransportations: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, dispatch]);

  const loadDashboardData = async () => {
    try {
      // Load hospital requests
      await dispatch(fetchHospitalRequests());

      // Load transportation data
      const transportResponse = await transportationService.getTransportations({
        hospitalId: user.profileId,
        limit: 10,
      });
      setTransportations(transportResponse.transportations);

      // Load nearby facilities for reference
      const facilitiesResponse = await publicApiService.get('/facilities', {
        params: { limit: 20 }
      });
      setFacilities(facilitiesResponse.facilities || []);

      // Calculate stats
      calculateStats(transportResponse.transportations);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const calculateStats = (transportData) => {
    const totalRequests = hospitalRequests.length;
    const pendingRequests = hospitalRequests.filter(r => r.status === 'pending' || r.status === 'processing').length;
    const fulfilledRequests = hospitalRequests.filter(r => r.status === 'fulfilled').length;
    const activeTransportations = transportData.filter(t =>
      ['scheduled', 'dispatched', 'en_route'].includes(t.status)
    ).length;

    setStats({
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      activeTransportations,
    });
  };

  const handleCreateRequest = async (requestData) => {
    try {
      await dispatch(createRequest(requestData)).unwrap();
      setShowRequestForm(false);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      partially_fulfilled: 'bg-orange-100 text-orange-800',
      fulfilled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (urgency) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '📋',
      low: 'ℹ️',
    };
    return icons[urgency] || '📋';
  };

  if (loading && hospitalRequests.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage blood requests and track deliveries</p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
        >
          🩸 Create Blood Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fulfilled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.fulfilledRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">🚛</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Transport</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTransportations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'requests'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Blood Requests
            </button>
            <button
              onClick={() => setActiveTab('transport')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'transport'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transportation
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {hospitalRequests.slice(0, 5).map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{getPriorityIcon(request.urgency)}</span>
                        <div>
                          <p className="font-medium">
                            {request.units} units of {request.bloodGroup} {request.component}
                          </p>
                          <p className="text-sm text-gray-600">
                            Created {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Transportations */}
              {transportations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Active Transportations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transportations.slice(0, 4).map((transport) => (
                      <TransportationTracker
                        key={transport._id}
                        transportationId={transport._id}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Blood Requests</h3>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  New Request
                </button>
              </div>

              {hospitalRequests.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl">🩸</span>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">No blood requests yet</h3>
                  <p className="text-gray-600 mt-2">Create your first blood request to get started</p>
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="mt-4 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
                  >
                    Create Request
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {hospitalRequests.map((request) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {request.units} units - {request.bloodGroup} {request.component}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Deadline: {new Date(request.deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 block ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-medium">
                            {getPriorityIcon(request.urgency)} {request.urgency}
                          </span>
                        </div>
                      </div>

                      {request.fulfillmentDetails && (
                        <div className="bg-gray-50 rounded p-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Requested:</span>
                              <span className="font-medium ml-1">{request.units}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Fulfilled:</span>
                              <span className="font-medium ml-1 text-green-600">{request.fulfillmentDetails.fulfilledUnits || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Pending:</span>
                              <span className="font-medium ml-1 text-orange-600">{request.fulfillmentDetails.pendingUnits || request.units}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transport' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transportation Tracking</h3>

              {transportations.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl">🚛</span>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">No active transportations</h3>
                  <p className="text-gray-600 mt-2">Transportation details will appear here when blood is being delivered</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transportations.map((transport) => (
                    <TransportationTracker
                      key={transport._id}
                      transportationId={transport._id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Blood Request</h2>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <BloodRequestForm onSubmit={handleCreateRequest} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
