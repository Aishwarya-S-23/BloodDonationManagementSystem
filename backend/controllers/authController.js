const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const Donor = require('../models/Donor');
const College = require('../models/College');
const { generateToken } = require('../utils/jwt');
const { sendSuccess } = require('../utils/helpers');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

/**
 * Clean and robust authentication controller
 * Handles user registration, login, and profile management
 */

// Register new user
const register = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: errors.array()
      });
    }

    const { email, password, role, profileData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        error: null
      });
    }

    // Hash password manually for consistency
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
    });

    await user.save();

    // Create profile based on role
    let profile = null;
    try {
      if (role === 'Hospital') {
        profile = new Hospital({
          userId: user._id,
          name: profileData?.name || 'New Hospital',
          licenseNumber: profileData?.licenseNumber || `HOSP-${Date.now()}`,
          address: {
            street: profileData?.address?.street || '',
            city: profileData?.address?.city || 'Mumbai',
            state: profileData?.address?.state || 'Maharashtra',
            zipCode: profileData?.address?.zipCode || '400001',
          },
          coordinates: {
            latitude: profileData?.coordinates?.latitude || 19.0760,
            longitude: profileData?.coordinates?.longitude || 72.8777,
          },
          contact: {
            phone: profileData?.contact?.phone || '',
            email: user.email,
          },
          isActive: true,
        });
        await profile.save();
        user.profileId = profile._id;
        user.profileModel = 'Hospital';
      } else if (role === 'BloodBank') {
        profile = new BloodBank({
          userId: user._id,
          name: profileData?.name || 'New Blood Bank',
          licenseNumber: profileData?.licenseNumber || `BB-${Date.now()}`,
          address: {
            street: profileData?.address?.street || '',
            city: profileData?.address?.city || 'Mumbai',
            state: profileData?.address?.state || 'Maharashtra',
            zipCode: profileData?.address?.zipCode || '400001',
          },
          coordinates: {
            latitude: profileData?.coordinates?.latitude || 19.0760,
            longitude: profileData?.coordinates?.longitude || 72.8777,
          },
          contact: {
            phone: profileData?.contact?.phone || '',
            email: user.email,
          },
          testingCapability: profileData?.testingCapability || true,
          status: 'active',
        });
        await profile.save();
        user.profileId = profile._id;
        user.profileModel = 'BloodBank';
      } else if (role === 'Donor') {
        profile = new Donor({
          userId: user._id,
          name: profileData?.name || 'New Donor',
          bloodGroup: profileData?.bloodGroup || 'O+',
          dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : new Date('1990-01-01'),
          gender: profileData?.gender || 'male',
          phone: profileData?.phone || '',
          address: {
            street: profileData?.address?.street || '',
            city: profileData?.address?.city || 'Mumbai',
            state: profileData?.address?.state || 'Maharashtra',
            zipCode: profileData?.address?.zipCode || '400001',
          },
          coordinates: {
            latitude: profileData?.coordinates?.latitude || 19.0760,
            longitude: profileData?.coordinates?.longitude || 72.8777,
          },
          eligibilityStatus: 'eligible',
          availability: 'available',
        });
        await profile.save();
        user.profileId = profile._id;
        user.profileModel = 'Donor';
      } else if (role === 'College') {
        profile = new College({
          userId: user._id,
          name: profileData?.name || 'New College',
          coordinatorName: profileData?.coordinatorName || 'Coordinator',
          coordinatorContact: {
            phone: profileData?.coordinatorContact?.phone || '',
            email: profileData?.coordinatorContact?.email || user.email,
          },
          address: {
            street: profileData?.address?.street || '',
            city: profileData?.address?.city || 'Mumbai',
            state: profileData?.address?.state || 'Maharashtra',
            zipCode: profileData?.address?.zipCode || '400001',
          },
          coordinates: {
            latitude: profileData?.coordinates?.latitude || 19.0760,
            longitude: profileData?.coordinates?.longitude || 72.8777,
          },
          contact: {
            phone: profileData?.contact?.phone || '',
            email: user.email,
          },
          isActive: true,
        });
        await profile.save();
        user.profileId = profile._id;
        user.profileModel = 'College';
      }

      if (profile) {
        await user.save();
      }

    } catch (profileError) {
      console.error('Profile creation error:', profileError);
      // Delete the user if profile creation failed
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile. Please try again.',
        error: profileError.message
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profileId: user.profileId,
          profileModel: user.profileModel,
        },
      },
      error: null,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      data: null,
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: null
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: null
      });
    }

    // Verify password using bcrypt directly
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: null
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profileId: user.profileId,
          profileModel: user.profileModel,
        },
      },
      error: null,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      data: null,
      error: error.message,
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('profileId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
      error: null,
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      data: null,
      error: error.message,
    });
  }
};

// Verify token (middleware helper)
const verifyToken = async (req, res) => {
  try {
    // Token is already verified by middleware, just return success
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.userId,
          role: req.userRole,
        },
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      data: null,
      error: error.message,
    });
  }
};

// Logout user (stateless token: just audit and respond)
const logout = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'logout',
      entityType: 'User',
      entityId: req.userId,
      details: {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, 200, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  verifyToken,
  logout,
};
