import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    role: '',
    status: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState('');
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(filter);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      Admin: 'bg-purple-100 text-purple-800',
      Hospital: 'bg-blue-100 text-blue-800',
      BloodBank: 'bg-red-100 text-red-800',
      Donor: 'bg-green-100 text-green-800',
      College: 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const filteredUsers = users.filter(user => {
    if (filter.role && user.role !== filter.role) return false;
    if (filter.status && ((filter.status === 'active' && !user.isActive) || (filter.status === 'inactive' && user.isActive))) return false;
    return true;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          ➕ Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {['Admin', 'Hospital', 'BloodBank', 'Donor', 'College'].map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">{role}</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filter.role}
            onChange={(e) => setFilter({...filter, role: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Hospital">Hospital</option>
            <option value="BloodBank">Blood Bank</option>
            <option value="Donor">Donor</option>
            <option value="College">College</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={loadUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">System Users ({filteredUsers.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        ID: {user._id.slice(-6)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => { setSelectedUser(user); setSelectedUserRole(user.role); }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    <button className="text-green-600 hover:text-green-900 mr-3">
                      Edit
                    </button>
                    <button className="text-orange-600 hover:text-orange-900">
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">👥</span>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No users found</h3>
            <p className="text-gray-600 mt-2">Adjust your filters or check back later</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.isActive)}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-medium">
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Profile Information</h3>
                  {selectedUser.profileId ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedUser.profileId.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">License:</span>
                        <span className="font-medium">{selectedUser.profileId.licenseNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">
                          {selectedUser.profileId.address?.city || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Group:</span>
                        <span className="font-medium text-red-600">
                          {selectedUser.profileId.bloodGroup || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">No profile information available</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    // Save role change
                    try {
                      const resp = await adminService.changeUserRole(selectedUser._id, selectedUserRole);
                      const updated = resp.user || resp.user;
                      // Update users list
                      setUsers((prev) => prev.map(u => u._id === updated._id ? updated : u));
                      setSelectedUser(updated);
                      toast.success('User role updated');

                      // If current user was changed, update local auth state
                      if (currentUser && currentUser.id === updated._id) {
                        dispatch(updateUser({ role: updated.role, profileId: updated.profileId, profileModel: updated.profileModel }));
                      }
                    } catch (error) {
                      console.error('Failed to update role', error);
                      toast.error('Failed to update role');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;