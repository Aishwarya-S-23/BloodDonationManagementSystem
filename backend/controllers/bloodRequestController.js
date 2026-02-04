const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const decisionEngine = require('../services/decisionEngine');
const notificationService = require('../services/notificationService');
const mapplsService = require('../services/mapplsService');
const AuditLog = require('../models/AuditLog');
const appConfig = require('../config/app');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * Create blood request (Hospital only)
 */
const createRequest = async (req, res, next) => {
  try {
    const { bloodGroup, component, units, urgency, deadline, notes, address, latitude, longitude } = req.body;
    const hospitalId = req.user?.profileId;

    // Strict validation - no bypasses
    if (!hospitalId) {
      return sendError(res, 400, 'Hospital profile not found. Please complete your hospital profile registration.');
    }

    // Verify hospital exists and has license
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return sendError(res, 404, 'Hospital profile not found. Please contact support or complete your profile registration.');
    }

    // Strict license validation - no temporary licenses allowed for production
    if (!hospital.licenseNumber || hospital.licenseNumber.startsWith('TEMP-')) {
      return sendError(res, 400, 'Valid hospital license required. Please update your hospital profile with a valid license number before creating requests.');
    }

    // Location normalization using Mappls Geocode API
    let requestLocation = null;

    if (latitude && longitude) {
      // Direct coordinates provided
      requestLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || 'Coordinates provided'
      };
    } else if (address) {
      // Address provided - convert to coordinates using Geocode API
      const geocodeResult = await mapplsService.geocodeAddress(address);

      if (!geocodeResult.success) {
        return sendError(res, 400, 'Unable to locate the provided address. Please provide valid address or coordinates.');
      }

      requestLocation = {
        type: 'Point',
        coordinates: [parseFloat(geocodeResult.longitude), parseFloat(geocodeResult.latitude)],
        address: geocodeResult.address,
        geocoded: true,
        geocodeSource: geocodeResult.fallback ? 'OpenStreetMap' : 'Mappls'
      };
    } else {
      return sendError(res, 400, 'Location information required. Please provide either address or latitude/longitude coordinates.');
    }

    // Create request with normalized location
    const bloodRequest = new BloodRequest({
      hospitalId,
      bloodGroup,
      component,
      units,
      urgency,
      deadline: new Date(deadline),
      notes,
      status: 'pending',
      location: requestLocation,
    });

    await bloodRequest.save();

    // Immediately assign nearby blood banks if possible
    try {
      await decisionEngine.immediateBloodBankAssignment(bloodRequest);
    } catch (assignmentError) {
      console.error('Immediate blood bank assignment error:', assignmentError);
      // Continue with decision engine even if immediate assignment fails
    }

    // Process through decision engine for final optimization
    try {
      const decision = await decisionEngine.processBloodRequest(bloodRequest);
      
      // Audit log
      await AuditLog.create({
        userId: req.userId,
        userRole: req.userRole,
        action: 'create',
        entityType: 'BloodRequest',
        entityId: bloodRequest._id,
        details: { decision: decision.chosenOption.type },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return sendSuccess(res, 201, 'Blood request created successfully', {
        request: bloodRequest,
        decision: decision.chosenOption,
      });
    } catch (error) {
      // If decision engine fails, still save the request
      console.error('Decision engine error:', error);
      return sendSuccess(res, 201, 'Blood request created, processing...', {
        request: bloodRequest,
        warning: 'Fulfillment processing may be delayed',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get hospital's blood requests
 */
const getHospitalRequests = async (req, res, next) => {
  try {
    const hospitalId = req.user.profileId;
    const { status, limit = 50, skip = 0 } = req.query;

    // Validate and sanitize inputs
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100); // Max 100
    const sanitizedSkip = Math.max(parseInt(skip) || 0, 0);

    const query = { hospitalId };
    
    // Whitelist allowed statuses
    const allowedStatuses = ['pending', 'processing', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired'];
    if (status && allowedStatuses.includes(status)) {
      query.status = status;
    }

    const requests = await BloodRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(sanitizedLimit)
      .skip(sanitizedSkip)
      .populate('fulfillmentDetails.assignedBloodBanks.bloodBankId', 'name licenseNumber')
      .lean();

    const total = await BloodRequest.countDocuments(query);

    return sendSuccess(res, 200, 'Requests retrieved successfully', {
      requests,
      total,
      limit: sanitizedLimit,
      skip: sanitizedSkip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get request details
 */
const getRequestDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.profileId;

    const request = await BloodRequest.findById(id)
      .populate('hospitalId', 'name licenseNumber')
      .populate('fulfillmentDetails.assignedBloodBanks.bloodBankId', 'name licenseNumber address');

    if (!request) {
      return sendError(res, 404, 'Request not found');
    }

    // Verify hospital owns this request
    if (request.hospitalId._id.toString() !== hospitalId.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    return sendSuccess(res, 200, 'Request details retrieved successfully', { request });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel request
 */
const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.profileId;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return sendError(res, 404, 'Request not found');
    }

    if (request.hospitalId.toString() !== hospitalId.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    if (request.status === 'fulfilled') {
      return sendError(res, 400, 'Cannot cancel fulfilled request');
    }

    request.status = 'cancelled';
    request.reservedUnits = 0;
    await request.save();

    // Release reserved inventory
    const inventoryService = require('../services/inventoryService');
    await inventoryService.releaseReservation(request._id);

    // Stop donor mobilization
    const donorMobilizationService = require('../services/donorMobilizationService');
    await donorMobilizationService.stopMobilization(request._id);

    // Audit log
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'cancel_request',
      entityType: 'BloodRequest',
      entityId: request._id,
      details: {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, 200, 'Request cancelled successfully', { request });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed fulfillment status for a request
 */
const getFulfillmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.profileId;

    const request = await BloodRequest.findById(id)
      .populate('fulfillmentDetails.assignedBloodBanks.bloodBankId', 'name licenseNumber address')
      .populate('hospitalId', 'name');

    if (!request) {
      return sendError(res, 404, 'Request not found');
    }

    // Verify hospital owns this request
    if (request.hospitalId._id.toString() !== hospitalId.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    // Calculate progress
    const issued = request.issuedUnits || 0;
    const reserved = request.reservedUnits || 0;
    const remaining = Math.max(0, request.units - issued);
    const progressPercentage = request.units > 0 ? ((issued / request.units) * 100).toFixed(1) : 0;

    // Get ETA information from assigned blood banks
    const etaInfo = request.fulfillmentDetails.assignedBloodBanks
      .filter(bank => bank.status === 'assigned')
      .map(bank => ({
        bloodBankName: bank.bloodBankId?.name || 'Unknown',
        eta: bank.eta,
        distance: bank.distance,
        units: bank.units,
        status: bank.status
      }));

    const status = {
      requestId: request._id,
      status: request.status,
      progress: {
        totalUnits: request.units,
        issuedUnits: issued,
        reservedUnits: reserved,
        remainingUnits: remaining,
        fulfillmentPercentage: parseFloat(progressPercentage),
      },
      fulfillmentStrategy: 'traffic_aware_multi_level',
      currentLevel: request.fulfillmentDetails.currentLevel,
      levelProgress: {
        level1Executed: request.fulfillmentDetails.level1Executed || false,
        level2Executed: request.fulfillmentDetails.level2Executed || false,
        level3Executed: request.fulfillmentDetails.level3Executed || false,
        level4Executed: request.fulfillmentDetails.level4Executed || false,
      },
      etaInfo,
      fulfillmentDetails: {
        method: request.fulfillmentDetails.fulfillmentMethod,
        assignedBloodBanks: request.fulfillmentDetails.assignedBloodBanks,
        donorMobilization: request.fulfillmentDetails.donorMobilization,
        collegeEscalation: request.fulfillmentDetails.collegeEscalation,
      },
      timeElapsed: Date.now() - new Date(request.createdAt).getTime(),
      createdAt: request.createdAt,
      deadline: request.deadline,
    };

    return sendSuccess(res, 200, 'Fulfillment status retrieved successfully', { status });
  } catch (error) {
    next(error);
  }
};

/**
 * Force escalate request to next level (admin/hospital override)
 */
const forceEscalateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetLevel } = req.body;
    const hospitalId = req.user.profileId;

    // Verify hospital owns this request
    const request = await BloodRequest.findById(id);
    if (!request) {
      return sendError(res, 404, 'Request not found');
    }

    if (request.hospitalId.toString() !== hospitalId.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    // Only allow escalation for non-fulfilled requests
    if (request.status === 'fulfilled') {
      return sendError(res, 400, 'Request is already fulfilled');
    }

    // Import the decision engine dynamically to avoid circular dependencies
    const decisionEngine = require('../services/decisionEngine');

    let result;
    switch (targetLevel) {
      case 2:
        if (!request.fulfillmentDetails.level2Executed) {
          result = await decisionEngine.executeDynamicRadiusExpansion(request, await Hospital.findById(request.hospitalId));
        } else {
          return sendError(res, 400, 'Level 2 already executed');
        }
        break;
      case 4: // Skip level 3 and go directly to college escalation
        if (!request.fulfillmentDetails.level4Executed) {
          const escalationService = require('../services/escalationService');
          result = await escalationService.escalateToColleges(request, 8);
        } else {
          return sendError(res, 400, 'Level 4 already executed');
        }
        break;
      default:
        return sendError(res, 400, 'Invalid target level. Use 2 or 4.');
    }

    // Audit log
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'force_escalate_request',
      entityType: 'BloodRequest',
      entityId: request._id,
      details: { targetLevel, result },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, 200, `Request escalated to level ${targetLevel}`, { result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get place details for accepted blood banks/donors
 */
const getPlaceDetails = async (req, res, next) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return sendError(res, 400, 'Place ID is required');
    }

    const placeDetails = await mapplsService.getPlaceDetails(placeId);

    if (!placeDetails.success) {
      return sendError(res, 404, 'Place details not found');
    }

    return sendSuccess(res, 200, 'Place details retrieved successfully', {
      placeDetails: placeDetails
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getHospitalRequests,
  getRequestDetails,
  cancelRequest,
  getFulfillmentStatus,
  forceEscalateRequest,
  getPlaceDetails,
};

