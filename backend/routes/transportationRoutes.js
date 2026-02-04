const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const transportationService = require('../services/transportationService');

// All routes require authentication
router.use(authenticateJWT);

// Create transportation request (Blood Bank only)
router.post('/create', async (req, res, next) => {
  try {
    const { requestId, hospitalId, inventoryItems, scheduledTime } = req.body;

    if (req.userRole !== 'BloodBank') {
      return res.status(403).json({ error: 'Only blood banks can create transportation requests' });
    }

    const transportation = await transportationService.createTransportation(
      requestId,
      req.user.profileId,
      hospitalId,
      inventoryItems,
      scheduledTime
    );

    res.status(201).json({
      message: 'Transportation request created successfully',
      transportation,
    });
  } catch (error) {
    next(error);
  }
});

// Get transportation details
router.get('/:id', async (req, res, next) => {
  try {
    const transportation = await transportationService.getTransportationDetails(req.params.id);

    if (!transportation) {
      return res.status(404).json({ error: 'Transportation not found' });
    }

    // Check if user has access to this transportation
    const hasAccess =
      req.userRole === 'Admin' ||
      (req.userRole === 'BloodBank' && transportation.bloodBankId.toString() === req.user.profileId.toString()) ||
      (req.userRole === 'Hospital' && transportation.hospitalId.toString() === req.user.profileId.toString()) ||
      (req.userRole === 'Admin' && transportation.driverId && transportation.driverId.toString() === req.userId.toString());

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ transportation });
  } catch (error) {
    next(error);
  }
});

// Get transportations with filters
router.get('/', async (req, res, next) => {
  try {
    const filters = { ...req.query };

    // Add role-based filtering
    if (req.userRole === 'BloodBank') {
      filters.bloodBankId = req.user.profileId;
    } else if (req.userRole === 'Hospital') {
      filters.hospitalId = req.user.profileId;
    }
    // Admin can see all

    const transportations = await transportationService.getTransportations(filters);
    const total = await require('../models/Transportation').countDocuments(filters);

    res.json({
      transportations,
      total,
      limit: filters.limit || 50,
      skip: filters.skip || 0,
    });
  } catch (error) {
    next(error);
  }
});

// Update transportation status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, location, notes } = req.body;
    const transportationId = req.params.id;

    // Check permissions based on role
    const transportation = await require('../models/Transportation').findById(transportationId);

    if (!transportation) {
      return res.status(404).json({ error: 'Transportation not found' });
    }

    let canUpdate = false;

    if (req.userRole === 'Admin') {
      canUpdate = true; // Admins can update any transportation
    } else if (req.userRole === 'BloodBank' && transportation.bloodBankId.toString() === req.user.profileId.toString()) {
      // Blood banks can update their own transportations
      canUpdate = ['dispatched', 'en_route', 'arrived', 'delivered', 'cancelled', 'failed'].includes(status);
    } else if (transportation.driverId && transportation.driverId.toString() === req.userId.toString()) {
      // Drivers can update assigned transportations
      canUpdate = ['en_route', 'arrived', 'delivered', 'failed'].includes(status);
    }

    if (!canUpdate) {
      return res.status(403).json({ error: 'You do not have permission to update this transportation status' });
    }

    const updatedTransportation = await transportationService.updateTransportationStatus(
      transportationId,
      status,
      location,
      notes,
      req.userId
    );

    res.json({
      message: 'Transportation status updated successfully',
      transportation: updatedTransportation,
    });
  } catch (error) {
    next(error);
  }
});

// Log temperature reading
router.post('/:id/temperature', async (req, res, next) => {
  try {
    const { temperature, location } = req.body;

    // Only blood banks and drivers can log temperature
    const transportation = await require('../models/Transportation').findById(req.params.id);

    if (!transportation) {
      return res.status(404).json({ error: 'Transportation not found' });
    }

    const canLog =
      req.userRole === 'Admin' ||
      (req.userRole === 'BloodBank' && transportation.bloodBankId.toString() === req.user.profileId.toString()) ||
      (transportation.driverId && transportation.driverId.toString() === req.userId.toString());

    if (!canLog) {
      return res.status(403).json({ error: 'You do not have permission to log temperature for this transportation' });
    }

    const updatedTransportation = await transportationService.logTemperature(
      req.params.id,
      temperature,
      location
    );

    res.json({
      message: 'Temperature logged successfully',
      transportation: updatedTransportation,
    });
  } catch (error) {
    next(error);
  }
});

// Assign driver (Admin only)
router.put('/:id/assign-driver', async (req, res, next) => {
  try {
    if (req.userRole !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can assign drivers' });
    }

    const { driverId } = req.body;

    const updatedTransportation = await transportationService.assignDriver(
      req.params.id,
      driverId
    );

    res.json({
      message: 'Driver assigned successfully',
      transportation: updatedTransportation,
    });
  } catch (error) {
    next(error);
  }
});

// Report transportation issue
router.post('/:id/issue', async (req, res, next) => {
  try {
    const { type, description, severity } = req.body;

    const updatedTransportation = await transportationService.reportIssue(
      req.params.id,
      type,
      description,
      severity,
      req.userId
    );

    res.json({
      message: 'Issue reported successfully',
      transportation: updatedTransportation,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
