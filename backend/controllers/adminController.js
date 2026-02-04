const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const Inventory = require('../models/Inventory');

/**
 * Get all users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, limit = 50, skip = 0 } = req.query;

    // Validate and sanitize inputs
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100); // Max 100
    const sanitizedSkip = Math.max(parseInt(skip) || 0, 0);

    const query = {};
    // Whitelist allowed roles to prevent injection
    const allowedRoles = ['Admin', 'Hospital', 'BloodBank', 'Donor', 'College'];
    if (role && allowedRoles.includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(sanitizedLimit)
      .skip(sanitizedSkip)
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      limit: sanitizedLimit,
      skip: sanitizedSkip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const {
      userId,
      userRole,
      action,
      entityType,
      limit = 100,
      skip = 0,
      startDate,
      endDate,
    } = req.query;

    // Validate and sanitize inputs
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 200); // Max 200
    const sanitizedSkip = Math.max(parseInt(skip) || 0, 0);

    const query = {};
    
    // Validate userId is a valid ObjectId
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }
    
    // Whitelist allowed roles
    const allowedRoles = ['Admin', 'Hospital', 'BloodBank', 'Donor', 'College'];
    if (userRole && allowedRoles.includes(userRole)) {
      query.userRole = userRole;
    }
    
    // Whitelist allowed actions
    const allowedActions = ['create', 'update', 'delete', 'login', 'logout', 'fulfill_request', 'cancel_request', 'issue_blood'];
    if (action && allowedActions.includes(action)) {
      query.action = action;
    }
    
    // Whitelist allowed entity types
    const allowedEntityTypes = ['User', 'Hospital', 'BloodBank', 'Donor', 'BloodRequest', 'Inventory', 'Donation', 'Transportation'];
    if (entityType && allowedEntityTypes.includes(entityType)) {
      query.entityType = entityType;
    }

    // Date range validation
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          query.timestamp.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          query.timestamp.$lte = end;
        }
      }
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'email role')
      .sort({ timestamp: -1 })
      .limit(sanitizedLimit)
      .skip(sanitizedSkip)
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      total,
      limit: sanitizedLimit,
      skip: sanitizedSkip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        byRole: await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
      },
      requests: {
        total: await BloodRequest.countDocuments(),
        byStatus: await BloodRequest.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        byUrgency: await BloodRequest.aggregate([
          { $group: { _id: '$urgency', count: { $sum: 1 } } },
        ]),
      },
      donations: {
        total: await Donation.countDocuments(),
        byStatus: await Donation.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      },
      inventory: {
        total: await Inventory.countDocuments(),
        byStatus: await Inventory.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        expiring: await Inventory.countDocuments({
          expiryDate: {
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            $gt: new Date(),
          },
          status: 'available',
        }),
      },
    };

    res.json({ statistics: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Add test inventory (for development/testing)
 */
const addTestInventory = async (req, res, next) => {
  try {
    const { bloodBankId, bloodGroup, component, units, expiryDate } = req.body;

    // Validate required fields
    if (!bloodBankId || !bloodGroup || !component || !units) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if blood bank exists
    const BloodBank = require('../models/BloodBank');
    const bloodBank = await BloodBank.findById(bloodBankId);
    if (!bloodBank) {
      return res.status(404).json({ error: 'Blood bank not found' });
    }

    // Create inventory
    const inventory = new Inventory({
      bloodBankId,
      bloodGroup,
      component,
      units: parseInt(units),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'available',
      source: 'purchase', // Test data
      testResults: {
        hiv: 'negative',
        hepatitisB: 'negative',
        hepatitisC: 'negative',
        syphilis: 'negative',
        malaria: 'negative',
        testedAt: new Date(),
        testedBy: req.userId,
      },
    });

    await inventory.save();

    // Audit log
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'create',
      entityType: 'Inventory',
      entityId: inventory._id,
      details: { bloodGroup, component, units, source: 'test_data' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Test inventory added successfully',
      inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user's role (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ['Admin', 'Hospital', 'BloodBank', 'Donor', 'College'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === role) {
      return res.status(200).json({ message: 'Role unchanged', user: user.toObject() });
    }

    // Handle profile creation/removal based on role
    let newProfileId = null;
    let newProfileModel = null;

    if (role === 'Admin') {
      // Admins do not need a profile
      newProfileId = null;
      newProfileModel = null;
    } else {
      // For non-admin roles, ensure a profile exists
      // If user already has a profile and the model matches, reuse it
      if (user.profileId && user.profileModel && user.profileModel !== 'null') {
        newProfileId = user.profileId;
        newProfileModel = user.profileModel;
      } else {
        // Create a minimal profile for the target role
        if (role === 'Hospital') {
          const Hospital = require('../models/Hospital');
          const profile = new Hospital({ userId: user._id, name: `Hospital - ${user.email}`, isActive: true });
          await profile.save();
          newProfileId = profile._id;
          newProfileModel = 'Hospital';
        } else if (role === 'BloodBank') {
          const BloodBank = require('../models/BloodBank');
          const profile = new BloodBank({ userId: user._id, name: `BloodBank - ${user.email}`, status: 'active' });
          await profile.save();
          newProfileId = profile._id;
          newProfileModel = 'BloodBank';
        } else if (role === 'Donor') {
          const Donor = require('../models/Donor');
          const profile = new Donor({ userId: user._id, name: `Donor - ${user.email}`, eligibilityStatus: 'unknown' });
          await profile.save();
          newProfileId = profile._id;
          newProfileModel = 'Donor';
        } else if (role === 'College') {
          const College = require('../models/College');
          const profile = new College({ userId: user._id, name: `College - ${user.email}`, isActive: true });
          await profile.save();
          newProfileId = profile._id;
          newProfileModel = 'College';
        }
      }
    }

    const previousRole = user.role;
    const previousProfileId = user.profileId;
    const previousProfileModel = user.profileModel;

    user.role = role;
    user.profileId = newProfileId;
    user.profileModel = newProfileModel;
    await user.save();

    // Audit
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'update',
      entityType: 'User',
      entityId: user._id,
      details: { previousRole, newRole: role, previousProfileId, newProfileId, previousProfileModel, newProfileModel },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const returnedUser = await User.findById(user._id).select('-password').lean();

    res.json({ message: 'Role updated successfully', user: returnedUser });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getAuditLogs,
  getStatistics,
  addTestInventory,
  updateUserRole,
};

