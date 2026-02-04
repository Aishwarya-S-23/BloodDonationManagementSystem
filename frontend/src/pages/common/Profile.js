import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateUser } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { donorService } from '../../services/donorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // Hospital-specific fields
    licenseNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    coordinates: {
      latitude: '',
      longitude: '',
    },
    contact: {
      phone: '',
      email: '',
      emergencyContact: '',
    },
  });

  useEffect(() => {
    // Fetch profile data when component mounts
    if (user) {
      dispatch(getProfile());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      const profile = user.profileId || {};
      setFormData({
        name: profile.name || user.name || '',
        email: user.email || profile.contact?.email || '',
        phone: profile.contact?.phone || user.phone || '',
        // Hospital-specific fields
        licenseNumber: profile.licenseNumber || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          zipCode: profile.address?.zipCode || '',
        },
        coordinates: {
          latitude: profile.coordinates?.latitude || '',
          longitude: profile.coordinates?.longitude || '',
        },
        contact: {
          phone: profile.contact?.phone || '',
          email: profile.contact?.email || user.email || '',
          emergencyContact: profile.contact?.emergencyContact || '',
        },
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields (address, contact, coordinates)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSave = async () => {
    // Prevent multiple simultaneous saves
    if (saving) return;

    setSaving(true);
    try {
      let updateData = { ...formData };
      
      // Validate required fields for Hospital
      if (user.role === 'Hospital') {
        if (!updateData.name || updateData.name.trim() === '') {
          toast.error('Hospital name is required');
          setSaving(false);
          return;
        }
        if (!updateData.licenseNumber || updateData.licenseNumber.trim() === '') {
          toast.error('License number is required');
          setSaving(false);
          return;
        }
        if (!updateData.address.street || updateData.address.street.trim() === '') {
          toast.error('Address street is required');
          setSaving(false);
          return;
        }
        if (!updateData.address.city || updateData.address.city.trim() === '') {
          toast.error('Address city is required');
          setSaving(false);
          return;
        }
        if (!updateData.address.state || updateData.address.state.trim() === '') {
          toast.error('Address state is required');
          setSaving(false);
          return;
        }
        if (!updateData.address.zipCode || updateData.address.zipCode.trim() === '') {
          toast.error('Address zip code is required');
          setSaving(false);
          return;
        }
        if (!updateData.coordinates.latitude || !updateData.coordinates.longitude) {
          toast.error('Coordinates (latitude and longitude) are required');
          setSaving(false);
          return;
        }
        if (!updateData.contact.phone || updateData.contact.phone.trim() === '') {
          toast.error('Contact phone is required');
          setSaving(false);
          return;
        }
      }
      
      // Convert coordinates to numbers if provided
      if (updateData.coordinates.latitude && updateData.coordinates.longitude) {
        updateData.coordinates = {
          latitude: parseFloat(updateData.coordinates.latitude),
          longitude: parseFloat(updateData.coordinates.longitude),
        };
        
        // Validate coordinates are valid numbers
        if (isNaN(updateData.coordinates.latitude) || isNaN(updateData.coordinates.longitude)) {
          toast.error('Invalid coordinates. Please enter valid numbers.');
          setSaving(false);
          return;
        }
      } else {
        // For Hospital, coordinates are required
        if (user.role === 'Hospital') {
          toast.error('Coordinates are required');
          setSaving(false);
          return;
        }
        // Remove coordinates if not provided for other roles
        delete updateData.coordinates;
      }
      
      // Remove email from update (it's in User model, not profile)
      delete updateData.email;
      
      // Trim string fields
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.licenseNumber) updateData.licenseNumber = updateData.licenseNumber.trim();
      if (updateData.address) {
        Object.keys(updateData.address).forEach(key => {
          if (typeof updateData.address[key] === 'string') {
            updateData.address[key] = updateData.address[key].trim();
          }
        });
      }
      if (updateData.contact) {
        Object.keys(updateData.contact).forEach(key => {
          if (typeof updateData.contact[key] === 'string') {
            updateData.contact[key] = updateData.contact[key].trim();
          }
        });
      }
      
      // Update profile based on role
      if (user.role === 'Donor') {
        await donorService.updateProfile(updateData);
      } else {
        // For Hospital, BloodBank, College - use auth service
        await authService.updateProfile(updateData);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh profile
      await dispatch(getProfile());
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      let errorMessage = 'Failed to update profile';
      
      // Log full error for debugging
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error config:', error.config);
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 404) {
          errorMessage = 'Route not found. Please ensure the backend server is running and restarted.';
        } else if (error.response.data) {
          if (error.response.data.details && Array.isArray(error.response.data.details)) {
            errorMessage = error.response.data.details.join(', ');
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check if the backend server is running on port 5000.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { autoClose: 5000 });
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const getRoleSpecificInfo = () => {
    if (!user) return null;

    switch (user.role) {
      case 'Hospital':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Hospital Information</h3>
              <p className="text-gray-600">
                Manage your hospital profile and settings from the hospital dashboard.
              </p>
              <button
                onClick={() => navigate('/hospital/dashboard')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Hospital Dashboard
              </button>
            </div>
          </div>
        );
      case 'BloodBank':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Blood Bank Information</h3>
              <p className="text-gray-600">
                Manage your blood bank profile, inventory, and requests from the blood bank dashboard.
              </p>
              <button
                onClick={() => navigate('/bloodbank/dashboard')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Blood Bank Dashboard
              </button>
            </div>
          </div>
        );
      case 'Donor':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Donor Information</h3>
              <p className="text-gray-600">
                Manage your donor profile, appointments, and donation history.
              </p>
              <button
                onClick={() => navigate('/donor/profile')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View Full Donor Profile
              </button>
            </div>
          </div>
        );
      case 'College':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">College Information</h3>
              <p className="text-gray-600">
                Manage your college profile and mobilized donors.
              </p>
              <button
                onClick={() => navigate('/college/dashboard')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to College Dashboard
              </button>
            </div>
          </div>
        );
      case 'Admin':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Administrator</h3>
              <p className="text-gray-600">
                Access admin controls and system management.
              </p>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Admin Dashboard
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No user information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {user.role === 'Hospital' ? 'Hospital Name' : 'Name'}
            </label>
            {editMode ? (
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            ) : (
              <p className="text-gray-900">
                {user.profileId?.name || user.name || 'Not set'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <p className="text-gray-900">{user.email || user.profileId?.contact?.email}</p>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            {editMode ? (
              <input
                id="contact-phone"
                type="tel"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            ) : (
              <p className="text-gray-900">
                {user.profileId?.contact?.phone || user.phone || 'Not set'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <p className="text-gray-900 capitalize">{user.role}</p>
          </div>
        </div>

        {/* Hospital-Specific Fields */}
        {user.role === 'Hospital' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Hospital Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number <span className="text-red-500">*</span>
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.licenseNumber || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contact-emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                {editMode ? (
                  <input
                    id="contact-emergencyContact"
                    type="tel"
                    name="contact.emergencyContact"
                    value={formData.contact.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.contact?.emergencyContact || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="address-street" className="block text-sm font-medium text-gray-700 mb-2">Address Street</label>
                {editMode ? (
                  <input
                    id="address-street"
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.address?.street || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="address-city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
                {editMode ? (
                  <input
                    id="address-city"
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.address?.city || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="address-state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                {editMode ? (
                  <input
                    id="address-state"
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.address?.state || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="address-zipCode" className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                {editMode ? (
                  <input
                    id="address-zipCode"
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.address?.zipCode || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="coordinates-latitude" className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                {editMode ? (
                  <input
                    id="coordinates-latitude"
                    type="number"
                    step="any"
                    name="coordinates.latitude"
                    value={formData.coordinates.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 19.0760"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.coordinates?.latitude || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="coordinates-longitude" className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                {editMode ? (
                  <input
                    id="coordinates-longitude"
                    type="number"
                    step="any"
                    name="coordinates.longitude"
                    value={formData.coordinates.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 72.8777"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.profileId?.coordinates?.longitude || 'Not set'}
                  </p>
                )}
              </div>
            </div>
            {editMode && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 Tip: If you don't know your coordinates, you can use a map service or leave them blank and they'll be auto-detected.
                </p>
              </div>
            )}
          </div>
        )}

        {editMode && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                // Reset form data
                const profile = user.profileId || {};
                setFormData({
                  name: profile.name || user.name || '',
                  email: user.email || profile.contact?.email || '',
                  phone: profile.contact?.phone || user.phone || '',
                  licenseNumber: profile.licenseNumber || '',
                  address: {
                    street: profile.address?.street || '',
                    city: profile.address?.city || '',
                    state: profile.address?.state || '',
                    zipCode: profile.address?.zipCode || '',
                  },
                  coordinates: {
                    latitude: profile.coordinates?.latitude || '',
                    longitude: profile.coordinates?.longitude || '',
                  },
                  contact: {
                    phone: profile.contact?.phone || '',
                    email: profile.contact?.email || user.email || '',
                    emergencyContact: profile.contact?.emergencyContact || '',
                  },
                });
              }}
              disabled={saving}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Role-Specific Information */}
      {getRoleSpecificInfo() && (
        <div className="bg-white rounded-lg shadow p-6">
          {getRoleSpecificInfo()}
        </div>
      )}

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">Account Status</p>
              <p className="text-sm text-gray-600">Your account is active</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">Member Since</p>
              <p className="text-sm text-gray-600">
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

