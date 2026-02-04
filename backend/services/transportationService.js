const Transportation = require('../models/Transportation');
const BloodBank = require('../models/BloodBank');
const Hospital = require('../models/Hospital');
const Inventory = require('../models/Inventory');
const { estimateTravelTime, sortByDistance } = require('../utils/geolocation');
const notificationService = require('./notificationService');
const AuditLog = require('../models/AuditLog');

/**
 * Create transportation request for blood delivery
 */
const createTransportation = async (requestId, bloodBankId, hospitalId, inventoryItems, scheduledTime = null) => {
  // Get blood bank and hospital details
  const bloodBank = await BloodBank.findById(bloodBankId);
  const hospital = await Hospital.findById(hospitalId);

  if (!bloodBank || !hospital) {
    throw new Error('Blood bank or hospital not found');
  }

  // Calculate route details
  const distance = sortByDistance([bloodBank], hospital.coordinates.latitude, hospital.coordinates.longitude)[0].distance;
  const estimatedDuration = estimateTravelTime(distance, 'driving');

  // Set pickup time (default to immediate if not specified)
  const pickupTime = scheduledTime || new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  const deliveryTime = new Date(pickupTime.getTime() + estimatedDuration * 60 * 1000);

  // Prepare blood units data
  const bloodUnits = [];
  for (const item of inventoryItems) {
    const inventory = await Inventory.findById(item.inventoryId);
    if (!inventory) continue;

    bloodUnits.push({
      inventoryId: item.inventoryId,
      units: item.units,
      bloodGroup: inventory.bloodGroup,
      component: inventory.component,
    });
  }

  // Determine vehicle type based on units and priority
  const totalUnits = bloodUnits.reduce((sum, unit) => sum + unit.units, 0);
  const vehicleType = totalUnits <= 2 ? 'motorcycle' : totalUnits <= 10 ? 'car' : 'refrigerated_van';
  const capacity = vehicleType === 'motorcycle' ? 2 : vehicleType === 'car' ? 10 : 50;

  // Get request urgency to set transportation priority
  const BloodRequest = require('../models/BloodRequest');
  const request = await BloodRequest.findById(requestId);
  const priority = request && request.urgency === 'critical' ? 'urgent' :
                  request && request.urgency === 'high' ? 'high' : 'normal';

  // Create transportation record
  const transportation = new Transportation({
    requestId,
    bloodBankId,
    hospitalId,
    vehicleDetails: {
      type: vehicleType,
      registrationNumber: `AUTO-${Date.now()}`, // Auto-generated, should be updated by logistics
      capacity,
    },
    bloodUnits,
    pickupLocation: {
      address: bloodBank.address,
      coordinates: bloodBank.coordinates,
    },
    deliveryLocation: {
      address: hospital.address,
      coordinates: hospital.coordinates,
    },
    scheduledPickupTime: pickupTime,
    estimatedDeliveryTime: deliveryTime,
    distance,
    estimatedDuration,
    priority,
  });

  await transportation.save();

  // Update inventory status to 'reserved' (already done in inventory service)
  // Log initial status
  await transportation.updateStatus('scheduled', null, 'Transportation scheduled');

  // Notify relevant parties
  await notifyTransportationCreated(transportation);

  return transportation;
};

/**
 * Update transportation status
 */
const updateTransportationStatus = async (transportationId, newStatus, location = null, notes = null, updatedBy = null) => {
  const transportation = await Transportation.findById(transportationId)
    .populate('requestId')
    .populate('bloodBankId')
    .populate('hospitalId');

  if (!transportation) {
    throw new Error('Transportation record not found');
  }

  // Update status
  await transportation.updateStatus(newStatus, location, notes, updatedBy);

  // Notify relevant parties
  await notifyStatusUpdate(transportation, newStatus);

  // If delivered, update inventory and request status
  if (newStatus === 'delivered') {
    await handleDeliveryCompletion(transportation);
  }

  return transportation;
};

/**
 * Log temperature reading
 */
const logTemperature = async (transportationId, temperature, location = null) => {
  const transportation = await Transportation.findById(transportationId);

  if (!transportation) {
    throw new Error('Transportation record not found');
  }

  // Check temperature compliance (2-6°C for blood storage)
  if (temperature < 2 || temperature > 6) {
    await transportation.reportIssue('temperature', `Temperature out of range: ${temperature}°C`, 'high');

    // Notify critical temperature issue
    await notificationService.createNotification({
      recipientId: transportation.bloodBankId.userId,
      recipientModel: 'User',
      recipientRole: 'BloodBank',
      type: 'temperature_alert',
      title: 'Temperature Alert - Blood Transport',
      message: `Critical temperature issue detected during transport: ${temperature}°C`,
      relatedEntityId: transportation._id,
      relatedEntityType: 'Transportation',
      priority: 'urgent',
    });
  }

  return await transportation.logTemperature(temperature, location);
};

/**
 * Get transportation details
 */
const getTransportationDetails = async (transportationId) => {
  return await Transportation.findById(transportationId)
    .populate('requestId')
    .populate('bloodBankId')
    .populate('hospitalId')
    .populate('driverId')
    .populate('bloodUnits.inventoryId');
};

/**
 * Get transportations by various filters
 */
const getTransportations = async (filters = {}) => {
  const query = {};

  if (filters.requestId) query.requestId = filters.requestId;
  if (filters.bloodBankId) query.bloodBankId = filters.bloodBankId;
  if (filters.hospitalId) query.hospitalId = filters.hospitalId;
  if (filters.driverId) query.driverId = filters.driverId;
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;

  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  return await Transportation.find(query)
    .populate('requestId')
    .populate('bloodBankId')
    .populate('hospitalId')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .skip(filters.skip || 0);
};

/**
 * Assign driver to transportation
 */
const assignDriver = async (transportationId, driverId) => {
  const transportation = await Transportation.findById(transportationId);

  if (!transportation) {
    throw new Error('Transportation record not found');
  }

  transportation.driverId = driverId;
  await transportation.save();

  // Notify driver
  await notificationService.createNotification({
    recipientId: driverId,
    recipientModel: 'User',
    recipientRole: 'Admin', // Assuming drivers are admin users
    type: 'driver_assignment',
    title: 'New Transportation Assignment',
    message: `You have been assigned to transport blood units to ${transportation.deliveryLocation.address.city}`,
    relatedEntityId: transportation._id,
    relatedEntityType: 'Transportation',
    priority: 'high',
  });

  return transportation;
};

/**
 * Report transportation issue
 */
const reportIssue = async (transportationId, issueType, description, severity = 'medium', reportedBy = null) => {
  const transportation = await Transportation.findById(transportationId);

  if (!transportation) {
    throw new Error('Transportation record not found');
  }

  await transportation.reportIssue(issueType, description, severity);

  // Notify relevant parties based on severity
  if (severity === 'critical' || severity === 'high') {
    const notifications = [
      {
        recipientId: transportation.bloodBankId.userId,
        recipientModel: 'User',
        recipientRole: 'BloodBank',
        type: 'transport_issue',
        title: 'Transportation Issue Reported',
        message: `${severity.toUpperCase()} issue reported: ${description}`,
        relatedEntityId: transportation._id,
        relatedEntityType: 'Transportation',
        priority: severity === 'critical' ? 'urgent' : 'high',
      },
      {
        recipientId: transportation.hospitalId.userId,
        recipientModel: 'User',
        recipientRole: 'Hospital',
        type: 'transport_issue',
        title: 'Blood Delivery Issue',
        message: `${severity.toUpperCase()} transportation issue: ${description}`,
        relatedEntityId: transportation._id,
        relatedEntityType: 'Transportation',
        priority: severity === 'critical' ? 'urgent' : 'high',
      }
    ];

    for (const notification of notifications) {
      await notificationService.createNotification(notification);
    }
  }

  return transportation;
};

/**
 * Handle delivery completion
 */
const handleDeliveryCompletion = async (transportation) => {
  const inventoryService = require('./inventoryService');

  // Update inventory status to 'issued'
  const inventoryIds = transportation.bloodUnits.map((unit) => unit.inventoryId);
  await inventoryService.issueInventory(inventoryIds, transportation.requestId);

  // Update request fulfillment
  const BloodRequest = require('../models/BloodRequest');
  const request = await BloodRequest.findById(transportation.requestId);

  if (request) {
    const deliveredUnits = transportation.bloodUnits.reduce((sum, unit) => sum + unit.units, 0);
    request.issuedUnits = (request.issuedUnits || 0) + deliveredUnits;
    request.reservedUnits = Math.max(0, (request.reservedUnits || 0) - deliveredUnits);
    request.fulfillmentDetails.fulfilledUnits = request.issuedUnits;

    // Check if request is now fully fulfilled
    if (request.issuedUnits >= request.units) {
      request.status = 'fulfilled';
      const donorMobilizationService = require('./donorMobilizationService');
      await donorMobilizationService.stopMobilization(request._id);
    } else if (request.issuedUnits > 0) {
      request.status = 'partially_fulfilled';
    }

    await request.save();
  }

  // Audit log
  await AuditLog.create({
    userId: transportation.driverId || transportation.bloodBankId.userId,
    userRole: transportation.driverId ? 'Admin' : 'BloodBank',
    action: 'issue_blood',
    entityType: 'Transportation',
    entityId: transportation._id,
    details: {
      deliveredUnits: transportation.bloodUnits.length,
      totalUnits: transportation.bloodUnits.reduce((sum, unit) => sum + unit.units, 0),
      hospitalId: transportation.hospitalId,
    },
  });
};

/**
 * Notify transportation creation
 */
const notifyTransportationCreated = async (transportation) => {
  const notifications = [
    {
      recipientId: transportation.bloodBankId.userId,
      recipientModel: 'User',
      recipientRole: 'BloodBank',
      type: 'transport_scheduled',
      title: 'Blood Transport Scheduled',
      message: `Blood transport scheduled for delivery to ${transportation.deliveryLocation.address.city} at ${transportation.scheduledPickupTime.toLocaleString()}`,
      relatedEntityId: transportation._id,
      relatedEntityType: 'Transportation',
      priority: 'high',
    },
    {
      recipientId: transportation.hospitalId.userId,
      recipientModel: 'User',
      recipientRole: 'Hospital',
      type: 'transport_scheduled',
      title: 'Blood Delivery Scheduled',
      message: `Blood delivery scheduled from ${transportation.pickupLocation.address.city}. Estimated arrival: ${transportation.estimatedDeliveryTime.toLocaleString()}`,
      relatedEntityId: transportation._id,
      relatedEntityType: 'Transportation',
      priority: 'high',
    }
  ];

  for (const notification of notifications) {
    await notificationService.createNotification(notification);
  }
};

/**
 * Notify status updates
 */
const notifyStatusUpdate = async (transportation, newStatus) => {
  const statusMessages = {
    dispatched: 'Transport has been dispatched',
    en_route: 'Transport is en route to your location',
    arrived: 'Transport has arrived at destination',
    delivered: 'Blood units have been successfully delivered',
    cancelled: 'Transport has been cancelled',
    failed: 'Transport has failed - please contact support',
  };

  if (statusMessages[newStatus]) {
    await notificationService.createNotification({
      recipientId: transportation.hospitalId.userId,
      recipientModel: 'User',
      recipientRole: 'Hospital',
      type: 'transport_update',
      title: 'Transport Status Update',
      message: statusMessages[newStatus],
      relatedEntityId: transportation._id,
      relatedEntityType: 'Transportation',
      priority: newStatus === 'failed' ? 'urgent' : 'medium',
    });
  }
};

/**
 * Optimize transportation assignments by combining similar routes
 */
const optimizeTransportationAssignments = async () => {
  // Find pending transportations within the next 2 hours
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const pendingTransportations = await Transportation.find({
    status: 'scheduled',
    scheduledPickupTime: { $lte: twoHoursFromNow }
  }).populate('requestId bloodBankId hospitalId');

  // Group by blood bank to optimize pickups
  const byBloodBank = {};
  const byHospital = {};

  for (const transport of pendingTransportations) {
    // Group by blood bank
    const bankKey = transport.bloodBankId._id.toString();
    if (!byBloodBank[bankKey]) {
      byBloodBank[bankKey] = [];
    }
    byBloodBank[bankKey].push(transport);

    // Group by hospital
    const hospitalKey = transport.hospitalId._id.toString();
    if (!byHospital[hospitalKey]) {
      byHospital[hospitalKey] = [];
    }
    byHospital[hospitalKey].push(transport);
  }

  // Optimize same blood bank multiple deliveries
  for (const [bankId, transports] of Object.entries(byBloodBank)) {
    if (transports.length > 1) {
      await optimizeBloodBankRoutes(bankId, transports);
    }
  }

  // Optimize same hospital multiple pickups
  for (const [hospitalId, transports] of Object.entries(byHospital)) {
    if (transports.length > 1) {
      await optimizeHospitalRoutes(hospitalId, transports);
    }
  }
};

/**
 * Optimize routes for multiple deliveries from same blood bank
 */
const optimizeBloodBankRoutes = async (bloodBankId, transports) => {
  // Sort by pickup time
  transports.sort((a, b) => a.scheduledPickupTime - b.scheduledPickupTime);

  // Combine transports that are close in time (within 30 minutes)
  const combined = [];
  let currentGroup = [transports[0]];

  for (let i = 1; i < transports.length; i++) {
    const timeDiff = (transports[i].scheduledPickupTime - currentGroup[0].scheduledPickupTime) / (1000 * 60); // minutes

    if (timeDiff <= 30) {
      currentGroup.push(transports[i]);
    } else {
      if (currentGroup.length > 1) {
        combined.push(currentGroup);
      }
      currentGroup = [transports[i]];
    }
  }

  if (currentGroup.length > 1) {
    combined.push(currentGroup);
  }

  // For now, just log optimization opportunities
  // In a full implementation, this would reschedule transports
  if (combined.length > 0) {
    console.log(`Optimization opportunity: ${combined.length} transport groups from blood bank ${bloodBankId}`);
  }
};

/**
 * Optimize routes for multiple pickups to same hospital
 */
const optimizeHospitalRoutes = async (hospitalId, transports) => {
  // Similar logic for hospital-side optimization
  transports.sort((a, b) => a.estimatedDeliveryTime - b.estimatedDeliveryTime);

  const combined = [];
  let currentGroup = [transports[0]];

  for (let i = 1; i < transports.length; i++) {
    const timeDiff = (transports[i].estimatedDeliveryTime - currentGroup[0].estimatedDeliveryTime) / (1000 * 60);

    if (timeDiff <= 60) { // 1 hour window for deliveries
      currentGroup.push(transports[i]);
    } else {
      if (currentGroup.length > 1) {
        combined.push(currentGroup);
      }
      currentGroup = [transports[i]];
    }
  }

  if (currentGroup.length > 1) {
    combined.push(currentGroup);
  }

  if (combined.length > 0) {
    console.log(`Optimization opportunity: ${combined.length} transport groups to hospital ${hospitalId}`);
  }
};

module.exports = {
  createTransportation,
  updateTransportationStatus,
  logTemperature,
  getTransportationDetails,
  getTransportations,
  assignDriver,
  reportIssue,
  handleDeliveryCompletion,
  optimizeTransportationAssignments,
};
