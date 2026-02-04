// Route helper utilities for navigation based on user roles

export const getDefaultRoute = (role) => {
  switch (role) {
    case 'Admin':
      return '/admin/dashboard';
    case 'Hospital':
      return '/hospital/dashboard';
    case 'BloodBank':
      return '/bloodbank/dashboard';
    case 'Donor':
      return '/donor/dashboard';
    case 'College':
      return '/college/dashboard';
    default:
      return '/login';
  }
};

export const getRoleRoutes = (role) => {
  const baseRoutes = {
    Admin: [
      '/admin/dashboard',
      '/admin/users',
      '/admin/audit-logs',
      '/admin/settings',
    ],
    Hospital: [
      '/hospital/dashboard',
      '/hospital/requests',
      '/hospital/inventory',
      '/hospital/profile',
    ],
    BloodBank: [
      '/bloodbank/dashboard',
      '/bloodbank/requests',
      '/bloodbank/inventory',
      '/bloodbank/donors',
      '/bloodbank/profile',
    ],
    Donor: [
      '/donor/dashboard',
      '/donor/profile',
      '/donor/appointments',
      '/donor/history',
    ],
    College: [
      '/college/dashboard',
      '/college/donors',
      '/college/campaigns',
      '/college/profile',
    ],
  };

  return baseRoutes[role] || [];
};

export const isRoleAllowed = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};

export const getRedirectPath = (userRole, currentPath) => {
  // If user is not authenticated, redirect to login
  if (!userRole) return '/login';

  // If user is trying to access a route they're not allowed to, redirect to their default route
  const userRoutes = getRoleRoutes(userRole);
  const isAllowed = userRoutes.some(route => currentPath.startsWith(route));

  if (!isAllowed) {
    return getDefaultRoute(userRole);
  }

  return null; // No redirect needed
};
