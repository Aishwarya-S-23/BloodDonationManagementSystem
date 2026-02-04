import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchHospitalRequests } from '../../store/slices/requestSlice';
import StatusBadge from '../../components/common/StatusBadge';
import UrgencyIndicator from '../../components/common/UrgencyIndicator';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const HospitalDashboard = () => {
  const dispatch = useDispatch();
  const { hospitalRequests, loading } = useSelector((state) => state.requests);
  const { user } = useSelector((state) => state.auth);

  // Debounce ref to prevent excessive API calls
  const debounceRef = useRef(null);

  const [activeTransportations, setActiveTransportations] = useState([]);
  const [donorResponses, setDonorResponses] = useState([]);
  const [realTimeStats, setRealTimeStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    processingRequests: 0,
    fulfilledRequests: 0,
    activeTransportations: 0,
    donorResponses: 0,
  });

  const loadDashboardData = useCallback(async () => {
    await dispatch(fetchHospitalRequests({ limit: 10 }));
    // Load additional real-time data
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
    const requests = Array.isArray(hospitalRequests) ? hospitalRequests : [];

    const totalRequests = requests.length;
    const pendingRequests = requests.filter((r) => r.status === 'pending').length;
    const processingRequests = requests.filter((r) => r.status === 'processing').length;
    const fulfilledRequests = requests.filter((r) => r.status === 'fulfilled').length;

    // Calculate additional stats
    const activeTransportations = requests.filter((r) =>
      r.fulfillmentDetails?.transportationId
    ).length;

    const donorResponses = requests.reduce((sum, r) =>
      sum + (r.donorResponses?.length || 0), 0
    );

    setRealTimeStats({
      totalRequests,
      pendingRequests,
      processingRequests,
      fulfilledRequests,
      activeTransportations,
      donorResponses,
    });
  };

  useEffect(() => {
    updateStats();
  }, [hospitalRequests]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const recentRequests = Array.isArray(hospitalRequests) ? hospitalRequests.slice(0, 5) : [];
  const pendingCount = realTimeStats.pendingRequests;
  const processingCount = realTimeStats.processingRequests;
  const fulfilledCount = realTimeStats.fulfilledRequests;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🏥 Hospital Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Updates Active</span>
          </div>
          <Link
            to="/hospital/requests/create"
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            🚨 Create Emergency Request
          </Link>
        </div>
      </div>

      {/* Real-time Alerts */}
      {realTimeStats.activeTransportations > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 text-xl">🚚</span>
            <div>
              <p className="font-semibold text-blue-900">Active Transportation</p>
              <p className="text-blue-700">
                {realTimeStats.activeTransportations} blood delivery in progress
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{realTimeStats.totalRequests}</div>
          <div className="text-xs text-gray-500 mt-1">All time</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">{realTimeStats.pendingRequests}</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting response</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Processing</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{realTimeStats.processingRequests}</div>
          <div className="text-xs text-gray-500 mt-1">Being fulfilled</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Fulfilled</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{realTimeStats.fulfilledRequests}</div>
          <div className="text-xs text-gray-500 mt-1">Successfully completed</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Transport</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{realTimeStats.activeTransportations}</div>
          <div className="text-xs text-gray-500 mt-1">Blood in transit</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Donor Responses</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">{realTimeStats.donorResponses}</div>
          <div className="text-xs text-gray-500 mt-1">Total responses</div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">📋 Recent Requests</h2>
            <div className="flex items-center space-x-4">
              <Link
                to="/hospital/donor-coordination"
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                View Donor Responses
              </Link>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-6">
            <LoadingSpinner />
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No requests yet. Create your first blood request!</p>
          </div>
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
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {request.bloodGroup}
                      </span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(request.deadline), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/hospital/requests/${request._id}`}
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

export default HospitalDashboard;

