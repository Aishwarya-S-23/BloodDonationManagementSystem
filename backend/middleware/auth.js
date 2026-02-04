const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const { sendError } = require('../utils/helpers');

// JWT Authentication Middleware
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      // Fetch user and attach to request
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return sendError(res, 401, 'User not found');
      }

      if (!user.isActive) {
        return sendError(res, 401, 'User account is inactive');
      }

      req.user = user;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        return sendError(res, 401, 'Invalid token');
      }
      throw error;
    }
  } catch (error) {
    return sendError(res, 500, 'Authentication error', error.message);
  }
};

// Role-Based Access Control Middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, `Access denied. This route requires one of the following roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
          req.userId = decoded.userId;
          req.userRole = decoded.role;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateJWT,
  authorizeRole,
  optionalAuth,
};

