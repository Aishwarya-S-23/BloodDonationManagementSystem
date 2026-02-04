const Inventory = require('../models/Inventory');
const inventoryService = require('../services/inventoryService');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * Add inventory to blood bank
 */
const addInventory = async (req, res, next) => {
  try {
    const { bloodBankId, bloodGroup, component, units, expiryDate, batchNumber, source } = req.body;

    // Validate MongoDB ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(bloodBankId)) {
      return sendError(res, 400, 'Invalid blood bank ID format');
    }

    // Strict access control - user must own this blood bank
    if (!req.user.profileId || req.user.profileId.toString() !== bloodBankId.toString()) {
      return sendError(res, 403, 'Access denied. You can only add inventory to your own blood bank.');
    }
    
    // Validate units
    const sanitizedUnits = parseInt(units);
    if (isNaN(sanitizedUnits) || sanitizedUnits < 1 || sanitizedUnits > 100) {
      return sendError(res, 400, 'Units must be between 1 and 100');
    }
    
    // Validate expiry date is in the future
    const expiryDateObj = new Date(expiryDate);
    if (isNaN(expiryDateObj.getTime()) || expiryDateObj <= new Date()) {
      return sendError(res, 400, 'Expiry date must be in the future');
    }
    
    // Validate blood group
    const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!allowedBloodGroups.includes(bloodGroup)) {
      return sendError(res, 400, 'Invalid blood group');
    }
    
    // Validate component
    const allowedComponents = ['whole', 'platelets', 'plasma', 'red_cells'];
    if (!allowedComponents.includes(component)) {
      return sendError(res, 400, 'Invalid blood component');
    }
    
    // Validate source
    const allowedSources = ['donation', 'purchase', 'transfer'];
    if (source && !allowedSources.includes(source)) {
      return sendError(res, 400, 'Invalid source');
    }

    // Create inventory item with sanitized values
    const inventory = new Inventory({
      bloodBankId,
      bloodGroup,
      component,
      units: sanitizedUnits,
      expiryDate: expiryDateObj,
      batchNumber,
      source: source || 'donation',
      status: 'available',
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
      details: {
        bloodGroup,
        component,
        units,
        source,
        expiryDate: expiryDate,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, 201, 'Inventory added successfully', { inventory });
  } catch (error) {
    next(error);
  }
};

/**
 * Get blood bank inventory
 */
const getInventory = async (req, res, next) => {
  try {
    const bloodBankId = req.user.profileId;
    const { bloodGroup, component, status } = req.query;

    if (!bloodBankId) {
      return sendError(res, 400, 'Blood bank profile required');
    }

    const query = { bloodBankId };
    
    // Whitelist allowed blood groups
    const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (bloodGroup && allowedBloodGroups.includes(bloodGroup)) {
      query.bloodGroup = bloodGroup;
    }
    
    // Whitelist allowed components
    const allowedComponents = ['whole', 'platelets', 'plasma', 'red_cells'];
    if (component && allowedComponents.includes(component)) {
      query.component = component;
    }
    
    // Whitelist allowed statuses
    const allowedStatuses = ['available', 'reserved', 'issued', 'expired', 'locked'];
    if (status && allowedStatuses.includes(status)) {
      query.status = status;
    }

    const inventory = await Inventory.find(query)
      .sort({ expiryDate: 1 })
      .populate('donationId', 'donorId donationDate')
      .populate('reservedFor.requestId', 'hospitalId units')
      .lean();

    // Get summary with validated ObjectId
    const mongoose = require('mongoose');
    const summary = await Inventory.aggregate([
      { $match: { bloodBankId: new mongoose.Types.ObjectId(bloodBankId) } },
      {
        $group: {
          _id: {
            bloodGroup: '$bloodGroup',
            component: '$component',
            status: '$status',
          },
          totalUnits: { $sum: '$units' },
        },
      },
    ]);

    return sendSuccess(res, 200, 'Inventory retrieved successfully', {
      inventory,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fulfill request from inventory
 */
const fulfillRequest = async (req, res, next) => {
  try {
    const { requestId, units } = req.body;
    const bloodBankId = req.user.profileId;

    const BloodRequest = require('../models/BloodRequest');

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return sendError(res, 404, 'Request not found');
    }

    // Check if already fulfilled
    if (request.status === 'fulfilled') {
      return sendError(res, 400, 'Request already fulfilled');
    }

    // Reserve inventory (without transaction for now)
    const { reserved } = await inventoryService.reserveInventory(
      bloodBankId,
      request.bloodGroup,
      request.component,
      units,
      requestId,
      30
    );

    // Update request
    const existingAssignment = request.fulfillmentDetails.assignedBloodBanks.find(
      (b) => b.bloodBankId.toString() === bloodBankId.toString()
    );

    if (existingAssignment) {
      existingAssignment.units = units;
      existingAssignment.status = 'assigned';
    } else {
      request.fulfillmentDetails.assignedBloodBanks.push({
        bloodBankId,
        units,
        status: 'assigned',
      });
    }

    request.status = 'processing';
    await request.save();

    // Audit log
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'fulfill_request',
      entityType: 'BloodRequest',
      entityId: requestId,
      details: { units, bloodBankId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, 200, 'Inventory reserved for request', {
      reserved: units,
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expiring inventory
 */
const getExpiringInventory = async (req, res, next) => {
  try {
    const bloodBankId = req.user.profileId;
    const { thresholdDays = 7 } = req.query;

    const expiring = await inventoryService.getExpiringInventory(
      bloodBankId,
      parseInt(thresholdDays)
    );

    return sendSuccess(res, 200, 'Expiring inventory retrieved successfully', {
      expiring,
      count: expiring.length,
      thresholdDays: parseInt(thresholdDays),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark expired inventory
 */
const markExpired = async (req, res, next) => {
  try {
    const bloodBankId = req.user.profileId;
    const expiredCount = await inventoryService.markExpiredInventory();

    // Audit log
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'update',
      entityType: 'Inventory',
      entityId: null,
      details: { expiredCount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, 200, 'Expired inventory marked', { expiredCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addInventory,
  getInventory,
  fulfillRequest,
  getExpiringInventory,
  markExpired,
};

