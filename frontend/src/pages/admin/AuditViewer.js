import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const AuditViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    userId: '',
    userRole: '',
    action: '',
    entityType: '',
    limit: 100,
  });
  const [selectedLog, setSelectedLog] = useState(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAuditLogs(filter);
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAuditLogs();
  }, [filter, loadAuditLogs]);

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      read: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      login: 'bg-purple-100 text-purple-800',
      logout: 'bg-gray-100 text-gray-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getEntityColor = (entityType) => {
    const colors = {
      User: 'bg-blue-100 text-blue-800',
      Hospital: 'bg-green-100 text-green-800',
      BloodBank: 'bg-red-100 text-red-800',
      BloodRequest: 'bg-orange-100 text-orange-800',
      Inventory: 'bg-purple-100 text-purple-800',
      Donation: 'bg-indigo-100 text-indigo-800',
      AuditLog: 'bg-gray-100 text-gray-800',
    };
    return colors[entityType] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log Viewer</h1>
          <p className="text-gray-600 mt-1">Monitor system activity and user actions</p>
        </div>
        <button
          onClick={loadAuditLogs}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🔄 Refresh Logs
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Logs</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{logs.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Create Actions</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {logs.filter(l => l.action === 'create').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Update Actions</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {logs.filter(l => l.action === 'update').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Login Events</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {logs.filter(l => l.action === 'login').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="filter-userId" className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              id="filter-userId"
              type="text"
              placeholder="User ID"
              value={filter.userId}
              onChange={(e) => setFilter({...filter, userId: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>

          <div>
            <label htmlFor="filter-userRole" className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
            <select
              id="filter-userRole"
              value={filter.userRole}
              onChange={(e) => setFilter({...filter, userRole: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Hospital">Hospital</option>
              <option value="BloodBank">Blood Bank</option>
              <option value="Donor">Donor</option>
              <option value="College">College</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-action" className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              id="filter-action"
              value={filter.action}
              onChange={(e) => setFilter({...filter, action: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="read">Read</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-entityType" className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              id="filter-entityType"
              value={filter.entityType}
              onChange={(e) => setFilter({...filter, entityType: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Hospital">Hospital</option>
            <option value="BloodBank">Blood Bank</option>
            <option value="BloodRequest">Blood Request</option>
            <option value="Inventory">Inventory</option>
            <option value="Donation">Donation</option>
          </select>
          </div>

          <div>
            <button
              onClick={() => setFilter({
                userId: '',
                userRole: '',
                action: '',
                entityType: '',
                limit: 100,
              })}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Audit Logs ({logs.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">
                        {log.userId?.email || 'System'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.userRole || 'System'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEntityColor(log.entityType)}`}>
                        {log.entityType}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {log.entityId?.slice(-6)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ipAddress || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">📋</span>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No audit logs found</h3>
            <p className="text-gray-600 mt-2">Adjust your filters or check back later</p>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Audit Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Event Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                      <p className="text-gray-900">{formatTimestamp(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Action</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(selectedLog.action)}`}>
                        {selectedLog.action}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEntityColor(selectedLog.entityType)}`}>
                        {selectedLog.entityType}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Entity ID</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedLog.entityId}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">User Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <p className="text-gray-900">{selectedLog.userId?.email || 'System'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="text-gray-900">{selectedLog.userRole || 'System'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IP Address</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedLog.ipAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Agent</label>
                      <p className="text-gray-900 text-sm truncate" title={selectedLog.userAgent}>
                        {selectedLog.userAgent?.substring(0, 50) || 'N/A'}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Action Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedLog.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm text-gray-900 ml-2">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditViewer;
