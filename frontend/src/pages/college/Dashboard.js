import { useState, useEffect } from 'react';
import { collegeService } from '../../services/collegeService';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import UrgencyIndicator from '../../components/common/UrgencyIndicator';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const CollegeDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalMobilizations: 0,
    activeEmergencies: 0,
    studentsHelped: 0,
    livesSaved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mobilizing, setMobilizing] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [requestsData, statsData] = await Promise.all([
        collegeService.getEscalatedRequests(),
        collegeService.getCollegeStats(),
      ]);

      setRequests(requestsData.requests || []);
      setStats(statsData.stats || stats);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMobilize = async (requestId) => {
    setMobilizing(requestId);
    try {
      await collegeService.mobilizeDonors(requestId);
      toast.success('College donors mobilized successfully!');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to mobilize donors');
    } finally {
      setMobilizing(null);
    }
  };

  const criticalRequests = requests.filter(r => r.urgency === 'critical');
  const highRequests = requests.filter(r => r.urgency === 'high');
  const totalUrgent = criticalRequests.length + highRequests.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🎓 College Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Emergency Alerts</span>
          </div>
          <Link
            to="/college/mobilization"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🚨 Emergency Tools
          </Link>
        </div>
      </div>

      {/* Emergency Alerts */}
      {totalUrgent > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-red-700">
                <strong>🚨 EMERGENCY ALERT:</strong> {totalUrgent} urgent blood requests need college mobilization
              </p>
              <p className="text-sm text-red-600 mt-1">
                {criticalRequests.length} critical • {highRequests.length} high priority
              </p>
            </div>
            <Link
              to="/college/mobilization"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Respond Now
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Mobilizations</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{stats.totalMobilizations}</div>
          <div className="text-xs text-gray-500 mt-1">Emergency responses</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Emergencies</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{stats.activeEmergencies}</div>
          <div className="text-xs text-gray-500 mt-1">Need attention now</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Students Helped</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{stats.studentsHelped}</div>
          <div className="text-xs text-gray-500 mt-1">Became donors</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Lives Saved</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{stats.livesSaved}</div>
          <div className="text-xs text-gray-500 mt-1">Through donations</div>
        </div>
      </div>

      {/* Escalated Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Escalated Requests</h2>
        </div>
        {loading ? (
          <div className="p-6">
            <LoadingSpinner />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No escalated requests</div>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleMobilize(request._id)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Mobilize Donors
                      </button>
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

export default CollegeDashboard;

