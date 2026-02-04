import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { createRequest } from '../../store/slices/requestSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { showErrorToast } from '../../utils/errorHandler';

const BloodRequestForm = ({ onSubmit: externalOnSubmit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const components = [
    { value: 'whole', label: 'Whole Blood' },
    { value: 'platelets', label: 'Platelets' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'red_cells', label: 'Red Cells' },
  ];
  const urgencyLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const onSubmit = async (data) => {
    if (loading) return; // Prevent multiple submissions

    setLoading(true);
    try {
      // Convert deadline to ISO string format
      const requestData = {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
      };

      const result = externalOnSubmit
        ? await externalOnSubmit(requestData)
        : await dispatch(createRequest(requestData)).unwrap();

      // Show success message
      toast.success(result.message || 'Blood request created successfully!');

      // Navigate to requests page (unified interface)
      if (!externalOnSubmit) {
        navigate('/requests');
      }
    } catch (error) {
      // Show error message to user
      let requiresProfile = false;
      
      // Check if it's a profile missing error (special handling)
      if (error && typeof error === 'string') {
        if (error.includes('Hospital profile not found') || error.includes('profile')) {
          requiresProfile = true;
        }
      } else if (error && typeof error === 'object') {
        const apiError = error.response?.data?.error || error.message || error;
        if (typeof apiError === 'string' && (apiError.includes('Hospital profile not found') || apiError.includes('profile'))) {
          requiresProfile = true;
        }
      }
      
      // Use error handler utility for consistent error messages
      const errorInfo = showErrorToast(error, toast, {
        autoClose: requiresProfile ? 5000 : undefined,
      });
      
      if (requiresProfile) {
        toast.info('You will be redirected to complete your profile...', {
          autoClose: 3000,
        });
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      }
      
      console.error('Error creating request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Blood Request</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" key="blood-request-form">
        {/* Blood Group */}
        <div>
          <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-2">
            Blood Group <span className="text-red-500">*</span>
          </label>
          <select
            id="bloodGroup"
            {...register('bloodGroup', { required: 'Blood group is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select blood group</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
          {errors.bloodGroup && (
            <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
          )}
        </div>

        {/* Component */}
        <div>
          <label htmlFor="component" className="block text-sm font-medium text-gray-700 mb-2">
            Component <span className="text-red-500">*</span>
          </label>
          <select
            id="component"
            {...register('component', { required: 'Component is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {components.map((comp) => (
              <option key={comp.value} value={comp.value}>
                {comp.label}
              </option>
            ))}
          </select>
          {errors.component && (
            <p className="mt-1 text-sm text-red-600">{errors.component.message}</p>
          )}
        </div>

        {/* Units */}
        <div>
          <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-2">
            Units Required <span className="text-red-500">*</span>
          </label>
          <input
            id="units"
            type="number"
            {...register('units', {
              required: 'Units is required',
              min: { value: 1, message: 'At least 1 unit is required' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="1"
          />
          {errors.units && (
            <p className="mt-1 text-sm text-red-600">{errors.units.message}</p>
          )}
        </div>

        {/* Urgency */}
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level <span className="text-red-500">*</span>
          </label>
          <select
            id="urgency"
            {...register('urgency', { required: 'Urgency is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {urgencyLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          {errors.urgency && (
            <p className="mt-1 text-sm text-red-600">{errors.urgency.message}</p>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
            Deadline <span className="text-red-500">*</span>
          </label>
          <input
            id="deadline"
            type="datetime-local"
            {...register('deadline', { required: 'Deadline is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.deadline && (
            <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
          )}
        </div>

        {/* Location Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
          <p className="text-sm text-gray-600 mb-4">
            Provide either an address (will be geocoded automatically) or coordinates for precise location-based blood bank discovery.
          </p>

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address (Optional - for geocoding)
            </label>
            <input
              id="address"
              type="text"
              {...register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter full address for automatic location detection"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty if providing coordinates below
            </p>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude (Optional)
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                {...register('latitude', {
                  min: { value: -90, message: 'Latitude must be between -90 and 90' },
                  max: { value: 90, message: 'Latitude must be between -90 and 90' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 28.6139"
              />
              {errors.latitude && (
                <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude (Optional)
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                {...register('longitude', {
                  min: { value: -180, message: 'Longitude must be between -180 and 180' },
                  max: { value: 180, message: 'Longitude must be between -180 and 180' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 77.2090"
              />
              {errors.longitude && (
                <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Provide either address OR coordinates. Coordinates provide more precise location for blood bank discovery.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Additional information about the request..."
          />
        </div>

        {/* Submit Button */}
        {/* Error Display */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BloodRequestForm;

