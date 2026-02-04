const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const Donor = require('../models/Donor');
const College = require('../models/College');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * Get user profile based on role
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('profileId');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'Profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    let profile;

    // Update or create profile based on role
    if (user.profileId && user.profileModel) {
      // Profile exists, update it
      const ProfileModel = require(`../models/${user.profileModel}`);
      profile = await ProfileModel.findById(user.profileId);
      
      if (profile) {
        // Handle nested objects properly
        if (req.body.address) {
          profile.address = { ...profile.address, ...req.body.address };
        }
        if (req.body.contact) {
          profile.contact = { ...profile.contact, ...req.body.contact };
        }
        if (req.body.coordinates) {
          profile.coordinates = { ...profile.coordinates, ...req.body.coordinates };
        }
        
        // Update other fields
        const { address, contact, coordinates, ...otherFields } = req.body;
        Object.assign(profile, otherFields);
        
        // Ensure required fields are not empty
        if (user.role === 'Hospital') {
          if (!profile.name || profile.name.trim() === '') {
            return sendError(res, 400, 'Hospital name is required');
          }
          if (!profile.licenseNumber || profile.licenseNumber.trim() === '') {
            return sendError(res, 400, 'License number is required');
          }
          if (!profile.address?.street || profile.address.street.trim() === '') {
            return sendError(res, 400, 'Address street is required');
          }
          if (!profile.address?.city || profile.address.city.trim() === '') {
            return sendError(res, 400, 'Address city is required');
          }
          if (!profile.address?.state || profile.address.state.trim() === '') {
            return sendError(res, 400, 'Address state is required');
          }
          if (!profile.address?.zipCode || profile.address.zipCode.trim() === '') {
            return sendError(res, 400, 'Address zip code is required');
          }
          if (!profile.coordinates?.latitude || !profile.coordinates?.longitude) {
            return sendError(res, 400, 'Coordinates (latitude and longitude) are required');
          }
          if (!profile.contact?.phone || profile.contact.phone.trim() === '') {
            return sendError(res, 400, 'Contact phone is required');
          }
          if (!profile.contact?.email || profile.contact.email.trim() === '') {
            profile.contact.email = user.email; // Use user email if not provided
          }
        }
        
        await profile.save();
      } else {
        return sendError(res, 404, 'Profile not found');
      }
    } else {
      // Profile doesn't exist, create it
      if (user.role === 'Hospital') {
        // Validate required fields
        if (!req.body.name || req.body.name.trim() === '') {
          return sendError(res, 400, 'Hospital name is required');
        }
        if (!req.body.licenseNumber || req.body.licenseNumber.trim() === '') {
          return sendError(res, 400, 'License number is required');
        }
        if (!req.body.address?.street || req.body.address.street.trim() === '') {
          return sendError(res, 400, 'Address street is required');
        }
        if (!req.body.address?.city || req.body.address.city.trim() === '') {
          return sendError(res, 400, 'Address city is required');
        }
        if (!req.body.address?.state || req.body.address.state.trim() === '') {
          return sendError(res, 400, 'Address state is required');
        }
        if (!req.body.address?.zipCode || req.body.address.zipCode.trim() === '') {
          return sendError(res, 400, 'Address zip code is required');
        }
        if (!req.body.coordinates?.latitude || !req.body.coordinates?.longitude) {
          return sendError(res, 400, 'Coordinates (latitude and longitude) are required');
        }
        if (!req.body.contact?.phone || req.body.contact.phone.trim() === '') {
          return sendError(res, 400, 'Contact phone is required');
        }
        
        // Ensure required fields have defaults
        const profileData = {
          userId: user._id,
          name: req.body.name.trim(),
          licenseNumber: req.body.licenseNumber.trim(),
          address: {
            street: req.body.address.street.trim(),
            city: req.body.address.city.trim(),
            state: req.body.address.state.trim(),
            zipCode: req.body.address.zipCode.trim(),
            country: req.body.address?.country || 'India',
          },
          coordinates: {
            latitude: parseFloat(req.body.coordinates.latitude),
            longitude: parseFloat(req.body.coordinates.longitude),
          },
          contact: {
            phone: req.body.contact.phone.trim(),
            email: req.body.contact?.email || user.email,
            emergencyContact: req.body.contact?.emergencyContact || '',
          },
        };
        
        profile = new Hospital(profileData);
        await profile.save();
        
        // Link profile to user
        user.profileId = profile._id;
        user.profileModel = 'Hospital';
        await user.save();
      } else if (user.role === 'BloodBank') {
        const BloodBank = require('../models/BloodBank');
        const profileData = {
          userId: user._id,
          ...req.body,
          coordinates: req.body.coordinates || {
            latitude: 19.0760,
            longitude: 72.8777,
          },
        };
        profile = new BloodBank(profileData);
        await profile.save();
        user.profileId = profile._id;
        user.profileModel = 'BloodBank';
        await user.save();
      } else if (user.role === 'College') {
        const College = require('../models/College');
        const profileData = {
          userId: user._id,
          ...req.body,
          coordinates: req.body.coordinates || {
            latitude: 19.0760,
            longitude: 72.8777,
          },
        };
        profile = new College(profileData);
        await profile.save();
        user.profileId = profile._id;
        user.profileModel = 'College';
        await user.save();
      } else {
        return sendError(res, 400, 'Cannot create profile for this role');
      }
    }

    const updatedUser = await User.findById(req.userId)
      .select('-password')
      .populate('profileId');

    return sendSuccess(res, 200, 'Profile updated successfully', { user: updatedUser });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 400, 'Validation failed', errors);
    }
    // Handle duplicate key errors (e.g., unique license number)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendError(res, 400, `${field} already exists. This ${field} is already registered. Please use a different value.`);
    }
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

