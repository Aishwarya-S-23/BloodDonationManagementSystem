import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'Hospital':
        return [
          { path: '/hospital/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/hospital/requests/create', label: 'Create Request', icon: '➕' },
          { path: '/hospital/requests', label: 'My Requests', icon: '📋' },
          { path: '/hospital/donor-coordination', label: 'Donor Coordination', icon: '👥' },
        ];
      case 'BloodBank':
        return [
          { path: '/bloodbank/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/bloodbank/inventory', label: 'Inventory Management', icon: '📦' },
          { path: '/bloodbank/testing', label: 'Testing Workflow', icon: '🧪' },
          { path: '/bloodbank/requests', label: 'Assigned Requests', icon: '📋' },
          { path: '/bloodbank/donations', label: 'Donations', icon: '🩸' },
        ];
      case 'Donor':
        return [
          { path: '/donor/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/donor/profile', label: 'My Profile', icon: '👤' },
          { path: '/donor/appointments', label: 'Appointments', icon: '📅' },
        ];
      case 'College':
        return [
          { path: '/college/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/college/mobilization', label: 'Mobilization Tools', icon: '🚨' },
        ];
      case 'Admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/admin/users', label: 'User Management', icon: '👥' },
          { path: '/admin/audit-viewer', label: 'Audit Viewer', icon: '📝' },
          { path: '/admin/anti-wastage', label: 'Anti-Wastage Monitor', icon: '🛡️' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

