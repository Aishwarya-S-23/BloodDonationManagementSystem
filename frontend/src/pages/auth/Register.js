import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth0 } from '@auth0/auth0-react';

const Register = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    profileData: {},
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const { loginWithRedirect } = useAuth0();

  // Check for pre-selected role from role selection modal
  useEffect(() => {
    const selectedRole = location.state?.selectedRole || localStorage.getItem('selectedRole');
    if (selectedRole) {
      setFormData(prev => ({
        ...prev,
        role: selectedRole
      }));
      // Clear localStorage after using it
      localStorage.removeItem('selectedRole');
    }
  }, [location.state]);

  const roles = ['Hospital', 'BloodBank', 'Donor', 'College'];

  const handleChange = (e) => {
  const { name, value } = e.target;

  if (name.startsWith('profile.')) {
    const keys = name.replace('profile.', '').split('.');

    setFormData((prev) => {
      const updatedProfile = { ...prev.profileData };
      let current = updatedProfile;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      return {
        ...prev,
        profileData: updatedProfile,
      };
    });
  } else {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Check for required character types
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    const hasSpecialChar = /[@$!%*?&]/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await dispatch(register(registerData)).unwrap();
      toast.success('Registration successful!');
      const user = JSON.parse(localStorage.getItem('user'));
      const defaultRoute = getDefaultRoute(user?.role);
      navigate(defaultRoute);
    } catch (err) {
      toast.error(err || 'Registration failed');
    }
  };

  const getDefaultRoute = (role) => {
    switch (role) {
      case 'Hospital':
        return '/hospital/dashboard';
      case 'BloodBank':
        return '/bloodbank/dashboard';
      case 'Donor':
        return '/donor/dashboard';
      case 'College':
        return '/college/dashboard';
      case 'Admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  const renderProfileFields = () => {
    switch (formData.role) {
      case 'Hospital':
      case 'BloodBank':
        return (
          <>
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="profile-name"
                type="text"
                name="profile.name"
                value={formData.profileData.name || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="profile-licenseNumber" className="block text-sm font-medium text-gray-700">License Number</label>
              <input
                id="profile-licenseNumber"
                type="text"
                name="profile.licenseNumber"
                value={formData.profileData.licenseNumber || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="profile-address-street" className="block text-sm font-medium text-gray-700">Address</label>
              <input
                id="profile-address-street"
                type="text"
                name="profile.address.street"
                value={formData.profileData.address?.street || ''}
                onChange={handleChange}
                placeholder="Street"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  id="profile-address-city"
                  type="text"
                  name="profile.address.city"
                  value={formData.profileData.address?.city || ''}
                  onChange={handleChange}
                  placeholder="City"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <input
                  id="profile-address-state"
                  type="text"
                  name="profile.address.state"
                  value={formData.profileData.address?.state || ''}
                  onChange={handleChange}
                  placeholder="State"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label htmlFor="profile-contact-phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                id="profile-contact-phone"
                type="tel"
                name="profile.contact.phone"
                value={formData.profileData.contact?.phone || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </>
        );
      case 'Donor':
        return (
          <>
            <div>
              <label htmlFor="profile-bloodGroup" className="block text-sm font-medium text-gray-700">Blood Group</label>
              <select
                id="profile-bloodGroup"
                name="profile.bloodGroup"
                value={formData.profileData.bloodGroup || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                id="profile-phone"
                type="tel"
                name="profile.phone"
                value={formData.profileData.phone || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </>
        );
      case 'College':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">College Name</label>
              <input
                type="text"
                name="profile.name"
                value={formData.profileData.name || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="profile-coordinatorName" className="block text-sm font-medium text-gray-700">Coordinator Name</label>
              <input
                id="profile-coordinatorName"
                type="text"
                name="profile.coordinatorName"
                value={formData.profileData.coordinatorName || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="profile-coordinatorContact-phone" className="block text-sm font-medium text-gray-700">Coordinator Phone</label>
              <input
                id="profile-coordinatorContact-phone"
                type="tel"
                name="profile.coordinatorContact.phone"
                value={formData.profileData.coordinatorContact?.phone || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            🩸 Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register for Blood Connect
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters with uppercase, lowercase, number & special character"
                required
                minLength={8}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must contain: uppercase, lowercase, number, and special character (@$!%*?&)
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            {formData.role && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-medium text-gray-900">Profile Information</h3>
                {renderProfileFields()}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Register'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Sign up with Auth0
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

