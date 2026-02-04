import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({}));
  }, [dispatch]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'blood_request') {
      navigate(`/requests/${notification.relatedId}`);
    } else if (notification.type === 'appointment') {
      navigate('/appointments');
    } else if (notification.type === 'donation') {
      navigate('/donations');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'blood_request':
        return '🩸';
      case 'appointment':
        return '📅';
      case 'donation':
        return '💉';
      case 'request_status':
        return '📋';
      case 'urgent':
        return '🚨';
      default:
        return '📬';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'urgent':
        return 'border-l-red-600 bg-red-50';
      case 'blood_request':
        return 'border-l-blue-600 bg-blue-50';
      case 'appointment':
        return 'border-l-green-600 bg-green-50';
      default:
        return 'border-l-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">No notifications yet</p>
          <p className="text-gray-500 mt-2">
            You'll receive notifications about blood requests, appointments, and updates here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`border-l-4 rounded-r-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                notification.read
                  ? 'bg-white border-l-gray-300'
                  : getNotificationColor(notification.type)
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                    )}
                  </div>
                  <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

