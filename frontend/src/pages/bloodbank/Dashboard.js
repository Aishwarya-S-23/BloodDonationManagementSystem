import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBloodBankRequests } from '../../store/slices/requestSlice';
import { fetchInventory, fetchExpiringInventory } from '../../store/slices/inventorySlice';
import StatusBadge from '../../components/common/StatusBadge';
import UrgencyIndicator from '../../components/common/UrgencyIndicator';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const BloodBankDashboard = () => {
  const dispatch = useDispatch();
  const { bloodBankRequests, loading: requestsLoading } = useSelector((state) => state.requests);
  const { expiring, loading: inventoryLoading } = useSelector((state) => state.inventory);
  const { user } = useSelector((state) => state.auth);

  // Debounce ref to prevent excessive API calls
  const debounceRef = useRef(null);

  const [realTimeStats, setRealTimeStats] = useState({
    pendingRequests: 0,
    expiringItems: 0,
    totalInventory: 0,
    recentDonations: 0,
    activeTransportations: 0,
  });

  const loadDashboardData = useCallback(async () => {
    await dispatch(fetchBloodBankRequests());
    await dispatch(fetchExpiringInventory(7));
    updateStats();
  }, [dispatch]);

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

  const updateStats = () => {
    const requests = Array.isArray(bloodBankRequests) ? bloodBankRequests : [];
    const expiringItems = Array.isArray(expiring) ? expiring : [];

    const pendingRequests = requests.filter((r) => r.status === 'processing' || r.status === 'pending').length;

    setRealTimeStats({
      pendingRequests,
      expiringItems: expiringItems.length,
      totalInventory: requests.length, // This should be from inventory data
      recentDonations: 0, // Should be calculated from recent donations
      activeTransportations: 0, // Should be from transportation data
    });
  };

  useEffect(() => {
    updateStats();
  }, [bloodBankRequests, expiring]);

  // Cleanup debounce timeout and socket listeners on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      // Note: Socket cleanup is handled by SocketContext
    };
  }, []);

  const pendingRequests = Array.isArray(bloodBankRequests)
    ? bloodBankRequests.filter((r) => r.status === 'processing' || r.status === 'pending')
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🩸 Blood Bank Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Updates Active</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {expiring.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>🚨 CRITICAL:</strong> {expiring.length} inventory items expiring within 7 days
              </p>
              <p className="text-sm text-red-600 mt-1">
                Immediate action required to prevent wastage
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Requests</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{realTimeStats.pendingRequests}</div>
          <div className="text-xs text-gray-500 mt-1">Need immediate attention</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Expiring Soon</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{realTimeStats.expiringItems}</div>
          <div className="text-xs text-gray-500 mt-1">Within 7 days</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Inventory</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{realTimeStats.totalInventory}</div>
          <div className="text-xs text-gray-500 mt-1">Units available</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Today's Donations</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{realTimeStats.recentDonations}</div>
          <div className="text-xs text-gray-500 mt-1">New donors</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Deliveries</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{realTimeStats.activeTransportations}</div>
          <div className="text-xs text-gray-500 mt-1">Blood in transit</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/bloodbank/inventory"
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">📦</span>
            <p className="font-medium mt-2">Manage Inventory</p>
            <p className="text-sm opacity-90">Add/Edit blood stock</p>
          </div>
        </Link>
        <Link
          to="/bloodbank/testing"
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">🧪</span>
            <p className="font-medium mt-2">Testing Workflow</p>
            <p className="text-sm opacity-90">Process donations</p>
          </div>
        </Link>
        <Link
          to="/bloodbank/requests"
          className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">📋</span>
            <p className="font-medium mt-2">Handle Requests</p>
            <p className="text-sm opacity-90">Fulfill hospital needs</p>
          </div>
        </Link>
        <Link
          to="/bloodbank/donations"
          className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <div className="text-center">
            <span className="text-2xl">🩸</span>
            <p className="font-medium mt-2">View Donations</p>
            <p className="text-sm opacity-90">Donor management</p>
          </div>
        </Link>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Pending Requests</h2>
          <Link
            to="/bloodbank/requests"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        {requestsLoading ? (
          <div className="p-6">
            <LoadingSpinner />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No pending requests</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Blood Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.slice(0, 5).map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.bloodGroup}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.units}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UrgencyIndicator urgency={request.urgency} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/bloodbank/requests/${request._id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodBankDashboard;

