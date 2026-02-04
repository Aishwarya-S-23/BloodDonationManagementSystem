import { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debounce ref to prevent excessive API calls
  const debounceRef = useRef(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, activityData, alertsData] = await Promise.all([
        adminService.getStatistics(),
        adminService.getRecentActivity(),
        adminService.getSystemAlerts(),
      ]);

      setStatistics(statsData.statistics);
      setRecentActivity(activityData.activities || []);
      setSystemAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced version of loadDashboardData to prevent excessive API calls
  const debouncedLoadDashboardData = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadDashboardData();
    }, 2000); // Wait 2 seconds after last event before making API call
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, []); // Remove function dependencies to avoid circular dependency

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">👑 Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">System Monitor Active</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-red-600 text-xl">🚨</span>
            <h3 className="text-lg font-semibold text-red-900">System Alerts</h3>
          </div>
          <div className="space-y-2">
            {systemAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex justify-between items-center bg-white p-3 rounded">
                <div>
                  <p className="font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {statistics?.users?.total || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {statistics?.users?.active || 0} active
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Requests</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {statistics?.requests?.active || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {statistics?.requests?.pending || 0} pending
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Blood Donations</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {statistics?.donations?.total || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            This month: {statistics?.donations?.thisMonth || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Inventory Status</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {statistics?.inventory?.available || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {statistics?.inventory?.expiring || 0} expiring soon
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Hospitals</div>
          <div className="text-2xl font-bold text-teal-600 mt-2">
            {statistics?.users?.byRole?.Hospital || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Blood Banks</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {statistics?.users?.byRole?.BloodBank || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Donors</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {statistics?.users?.byRole?.Donor || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Colleges</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {statistics?.users?.byRole?.College || 0}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">👥</span>
            <p className="font-medium mt-2">User Management</p>
            <p className="text-sm opacity-90">Manage all users</p>
          </div>
        </Link>
        <Link
          to="/admin/audit-viewer"
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">📝</span>
            <p className="font-medium mt-2">Audit Viewer</p>
            <p className="text-sm opacity-90">System activity logs</p>
          </div>
        </Link>
        <Link
          to="/admin/anti-wastage"
          className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">🛡️</span>
            <p className="font-medium mt-2">Anti-Wastage</p>
            <p className="text-sm opacity-90">Monitor & prevent waste</p>
          </div>
        </Link>
        <Link
          to="/admin/dashboard"
          className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">📊</span>
            <p className="font-medium mt-2">System Reports</p>
            <p className="text-sm opacity-90">Advanced analytics</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <Link
            to="/admin/audit-viewer"
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'error' ? 'bg-red-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

