import { useEffect, useState } from 'react';
import { donorService } from '../../services/donorService';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const DonorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [donationRequests, setDonationRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        profileData,
        appointmentsData,
        eligibilityData,
        requestsData,
        notificationsData,
        historyData
      ] = await Promise.all([
        donorService.getProfile(),
        donorService.getAppointments({ limit: 5 }),
        donorService.checkEligibility(),
        donorService.getDonationRequests({ limit: 5 }),
        donorService.getNotifications({ limit: 10, read: 'false' }),
        donorService.getDonationHistory({ limit: 5 }),
      ]);

      setProfile(profileData.donor);
      setAppointments(appointmentsData.appointments || []);
      setEligibility(eligibilityData.eligibility);
      setDonationRequests(requestsData.requests || []);
      setNotifications(notificationsData.notifications || []);
      setDonationHistory(historyData.donations || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId, response, reason = '') => {
    setRespondingTo(requestId);
    try {
      await donorService.respondToRequest(requestId, response, reason);

      toast.success(`Request ${response === 'accept' ? 'accepted' : 'declined'} successfully`);

      // Remove from local state
      setDonationRequests(prev => prev.filter(req => req._id !== requestId));

      // Refresh notifications
      const notificationsData = await donorService.getNotifications({ limit: 10, read: 'false' });
      setNotifications(notificationsData.notifications || []);

    } catch (error) {
      toast.error('Failed to respond to request');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await donorService.markNotificationRead(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleUpdateAvailability = async (availability) => {
    try {
      await donorService.updateAvailability(availability);
      setProfile(prev => ({ ...prev, availability }));
      toast.success('Availability updated');
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={profile?.availability || 'available'}
            onChange={(e) => handleUpdateAvailability(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="available">🟢 Available</option>
            <option value="busy">🟡 Busy</option>
            <option value="unavailable">🔴 Unavailable</option>
          </select>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-blue-900">🔔 Recent Notifications</h2>
            <span className="text-sm text-blue-600">{notifications.length} unread</span>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification._id} className="flex justify-between items-center bg-white p-3 rounded">
                <div>
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkNotificationRead(notification._id)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  Mark Read
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donation Requests - REAL TIME */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">🚨 Active Donation Requests</h2>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {donationRequests.length} available
            </span>
          </div>
        </div>
        {donationRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No active donation requests for your blood type ({profile?.bloodGroup})</p>
            <p className="text-sm mt-2">Requests will appear here automatically when hospitals need blood</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {donationRequests.map((request) => (
              <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {request.units} units {request.bloodGroup} blood needed
                    </h3>
                    <p className="text-gray-600">{request.hospitalId?.name}</p>
                    <p className="text-sm text-gray-500">
                      📍 {request.hospitalId?.city} • {request.distance ? `${request.distance}km away` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 block ${
                      request.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                      request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.urgency.toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleRespondToRequest(request._id, 'accept')}
                    disabled={respondingTo === request._id || !eligibility?.eligible}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {respondingTo === request._id ? 'Responding...' : '✅ Accept Request'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for declining (optional):');
                      handleRespondToRequest(request._id, 'decline', reason);
                    }}
                    disabled={respondingTo === request._id}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ❌ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eligibility Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🏥 Eligibility Status</h2>
        {eligibility?.eligible ? (
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-2xl">✓</span>
            <span className="text-lg font-medium text-gray-900">You are eligible to donate</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-600 text-2xl">✗</span>
              <span className="text-lg font-medium text-gray-900">Not eligible at this time</span>
            </div>
            {eligibility?.reasons && eligibility.reasons.length > 0 && (
              <ul className="list-disc list-inside text-gray-600 mt-2">
                {eligibility.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Blood Group</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{profile?.bloodGroup}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Donations Given</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{donationHistory.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Requests Responded</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{notifications.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Lives Saved</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {donationHistory.length * 3} {/* Estimate: 3 lives per donation */}
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">📅 Upcoming Appointments</h2>
          <Link
            to="/donor/appointments"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        {appointments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No upcoming appointments</p>
            <p className="text-sm mt-2">Appointments will appear here when you accept donation requests</p>
          </div>
        ) : (
          <div className="p-6">
            {appointments.slice(0, 3).map((appointment) => (
              <div key={appointment._id} className="border-b border-gray-200 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      📅 {new Date(appointment.scheduledDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      🏥 {appointment.bloodBankId?.name || 'Blood Bank'}
                    </p>
                    <p className="text-sm text-gray-500">
                      💉 {appointment.requestId?.bloodGroup} {appointment.requestId?.units} units
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={appointment.status} />
                    {appointment.status === 'scheduled' && (
                      <button className="block text-blue-600 hover:text-blue-900 text-sm mt-1">
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donation History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">🏆 Donation History</h2>
          <Link
            to="/donor/history"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        {donationHistory.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No donation history yet</p>
            <p className="text-sm mt-2">Your completed donations will appear here</p>
          </div>
        ) : (
          <div className="p-6">
            {donationHistory.slice(0, 3).map((donation) => (
              <div key={donation._id} className="border-b border-gray-200 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      🩸 {donation.bloodGroup} blood donation
                    </p>
                    <p className="text-sm text-gray-500">
                      🏥 {donation.bloodBankId?.name || 'Blood Bank'}
                    </p>
                    <p className="text-sm text-gray-500">
                      📅 {new Date(donation.donationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Completed
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {donation.units} units
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;

