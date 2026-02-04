import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collegeService } from '../../services/collegeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const MobilizationTools = () => {
  const { user } = useSelector(state => state.auth);
  const [activeRequests, setActiveRequests] = useState([]);
  const [mobilizationHistory, setMobilizationHistory] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobilizing, setMobilizing] = useState(false);

  useEffect(() => {
    loadActiveRequests();
    loadMobilizationHistory();
  }, []);

  const loadActiveRequests = async () => {
    try {
      setLoading(true);
      // Load emergency requests that need college mobilization
      // This would be from the escalation service
      const mockRequests = [
        {
          id: 'req001',
          hospitalName: 'City General Hospital',
          bloodGroup: 'AB-',
          units: 2,
          urgency: 'critical',
          distance: 3.2,
          timeRemaining: '4 hours',
          description: 'Rare blood group emergency - Cancer patient',
          mobilizationStatus: 'pending',
        },
        {
          id: 'req002',
          hospitalName: 'Regional Medical Center',
          bloodGroup: 'O-',
          units: 1,
          urgency: 'high',
          distance: 5.8,
          timeRemaining: '12 hours',
          description: 'Platelet transfusion required',
          mobilizationStatus: 'pending',
        },
      ];
      setActiveRequests(mockRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load active requests');
    } finally {
      setLoading(false);
    }
  };

  const loadMobilizationHistory = async () => {
    try {
      // Load past mobilization activities
      const mockHistory = [
        {
          id: 'mob001',
          requestId: 'req001',
          hospitalName: 'City General Hospital',
          bloodGroup: 'AB-',
          units: 2,
          date: '2026-01-18',
          donorsMobilized: 15,
          donorsResponded: 8,
          donorsDonated: 3,
          status: 'completed',
        },
        {
          id: 'mob002',
          requestId: 'req002',
          hospitalName: 'Regional Medical Center',
          bloodGroup: 'O+',
          units: 4,
          date: '2026-01-17',
          donorsMobilized: 22,
          donorsResponded: 12,
          donorsDonated: 6,
          status: 'completed',
        },
      ];
      setMobilizationHistory(mockHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleMobilize = async (request) => {
    setMobilizing(true);
    try {
      // Simulate college mobilization
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      toast.success(`Successfully mobilized college donors for ${request.bloodGroup} request`);

      // Update request status
      setActiveRequests(prev =>
        prev.map(req =>
          req.id === request.id
            ? {...req, mobilizationStatus: 'in_progress'}
            : req
        )
      );

      // Refresh data
      await loadActiveRequests();
    } catch (error) {
      toast.error('Failed to mobilize donors');
    } finally {
      setMobilizing(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMobilizationColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyIcon = (urgency) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '📋',
      low: 'ℹ️',
    };
    return icons[urgency] || '📋';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">College Mobilization Tools</h1>
          <p className="text-gray-600 mt-1">Coordinate emergency blood drives and mobilize student donors</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadActiveRequests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Requests
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Requests</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {activeRequests.filter(r => r.mobilizationStatus === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Mobilized</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {mobilizationHistory.reduce((sum, h) => sum + h.donorsMobilized, 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Successful Donations</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {mobilizationHistory.reduce((sum, h) => sum + h.donorsDonated, 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Response Rate</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {mobilizationHistory.length > 0
              ? Math.round((mobilizationHistory.reduce((sum, h) => sum + h.donorsResponded, 0) /
                          mobilizationHistory.reduce((sum, h) => sum + h.donorsMobilized, 0)) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Active Emergency Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Active Emergency Requests</h3>
          <p className="text-sm text-gray-600 mt-1">Critical blood requests requiring college donor mobilization</p>
        </div>

        <div className="p-6">
          {activeRequests.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">🏥</span>
              <h3 className="text-lg font-medium text-gray-900 mt-4">No active emergency requests</h3>
              <p className="text-gray-600 mt-2">Emergency requests will appear here when hospitals need college donor support</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <div key={request.id} className={`border-2 rounded-lg p-6 ${getUrgencyColor(request.urgency)}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start">
                      <span className="text-3xl mr-4">{getUrgencyIcon(request.urgency)}</span>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{request.hospitalName}</h4>
                        <p className="text-gray-700 font-medium">
                          {request.units} units of {request.bloodGroup} blood needed
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.distance}km away • {request.timeRemaining} remaining
                        </p>
                        <p className="text-sm text-gray-700 mt-2">{request.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold mb-3 block ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMobilizationColor(request.mobilizationStatus)}`}>
                        {request.mobilizationStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Impact:</span> Your college can save a life by mobilizing donors
                    </div>
                    <button
                      onClick={() => handleMobilize(request)}
                      disabled={mobilizing || request.mobilizationStatus !== 'pending'}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                    >
                      {mobilizing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Mobilizing...
                        </>
                      ) : request.mobilizationStatus === 'in_progress' ? (
                        'In Progress'
                      ) : (
                        <>
                          🚨 Mobilize College Donors
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobilization History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Mobilization History</h3>
          <p className="text-sm text-gray-600 mt-1">Past emergency responses and their outcomes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blood Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobilized
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mobilizationHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{record.hospitalName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-red-600">{record.bloodGroup}</span>
                    <span className="text-gray-500 ml-1">({record.units} units)</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                    {record.donorsMobilized}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-orange-600">
                    {record.donorsResponded}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                    {record.donorsDonated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.donorsDonated >= record.units
                        ? 'bg-green-100 text-green-800'
                        : record.donorsResponded > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.donorsMobilized > 0
                        ? Math.round((record.donorsDonated / record.donorsMobilized) * 100)
                        : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mobilizationHistory.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">📊</span>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No mobilization history</h3>
            <p className="text-gray-600 mt-2">Your mobilization activities will appear here</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            📢 Announce Blood Drive
          </button>
          <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
            👥 Register New Donors
          </button>
          <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
            📊 View Donor Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilizationTools;
