const Donation = require('../models/Donation');
const BloodRequest = require('../models/BloodRequest');
const Inventory = require('../models/Inventory');
const Appointment = require('../models/Appointment');
const inventoryService = require('../services/inventoryService');
const notificationService = require('../services/notificationService');
const AuditLog = require('../models/AuditLog');

/**
 * Record test results for a donation
 */
const recordTestResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { testResults } = req.body;
    const bloodBankId = req.user.profileId;

    const donation = await Donation.findById(id).populate('bloodBankId');
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.bloodBankId._id.toString() !== bloodBankId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({ error: 'Donation must be completed before testing' });
    }

    // Update test results
    donation.testResults = {
      ...donation.testResults,
      ...testResults,
      testedAt: new Date(),
      testedBy: req.userId,
    };

    // Check if all tests passed
    const allTests = [
      testResults.hiv,
      testResults.hepatitisB,
      testResults.hepatitisC,
      testResults.syphilis,
      testResults.malaria,
    ];

    const allPassed = allTests.every((test) => test === 'negative');
    const anyFailed = allTests.some((test) => test === 'positive');
    const anyPending = allTests.some((test) => test === 'pending');

    if (anyFailed) {
      donation.testingStatus = 'failed';
      donation.status = 'discarded';
    } else if (!anyPending && allPassed) {
      donation.testingStatus = 'passed';
      donation.status = 'tested';
    } else {
      donation.testingStatus = 'in_progress';
    }

    await donation.save();

    // Audit log
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'test_blood',
      entityType: 'Donation',
      entityId: donation._id,
      details: { testingStatus: donation.testingStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Notify donor of test results
    const Donor = require('../models/Donor');
    const donor = await Donor.findById(donation.donorId).populate('userId');
    if (donor && donor.userId) {
      await notificationService.createNotification({
        recipientId: donor.userId._id,
        recipientModel: 'User',
        recipientRole: 'Donor',
        type: 'test_result',
        title: 'Blood Test Results',
        message: `Your donation test results: ${donation.testingStatus === 'passed' ? 'All tests passed' : 'Some tests failed'}`,
        relatedEntityId: donation._id,
        relatedEntityType: 'Donation',
        priority: 'medium',
      });
    }

    res.json({
      message: 'Test results recorded',
      donation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Issue tested blood to inventory
 */
const issueBlood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bloodBankId = req.user.profileId;

    const donation = await Donation.findById(id).populate('bloodBankId');
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.bloodBankId._id.toString() !== bloodBankId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (donation.testingStatus !== 'passed') {
      return res.status(400).json({ error: 'Only tested and passed donations can be issued' });
    }

    if (donation.status === 'issued') {
      return res.status(400).json({ error: 'Donation already issued' });
    }

    // Create inventory entry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 42); // 42 days expiry for whole blood

    const inventory = new Inventory({
      bloodBankId,
      bloodGroup: donation.bloodGroup,
      component: donation.component,
      units: donation.units,
      expiryDate,
      status: 'available',
      source: 'donation',
      donationId: donation._id,
      testResults: donation.testResults,
      batchNumber: require('../utils/helpers').generateBatchNumber(),
    });

    await inventory.save();

    // Update donation status
    donation.status = 'issued';
    await donation.save();

    // If this donation was for a request, check if request can be fulfilled
    if (donation.requestId) {
      await checkRequestFulfillment(donation.requestId);
    }

    // Audit log
    await AuditLog.create({
      userId: req.userId,
      userRole: req.userRole,
      action: 'issue_blood',
      entityType: 'Donation',
      entityId: donation._id,
      details: { inventoryId: inventory._id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Blood issued to inventory',
      donation,
      inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if request can be fulfilled with new inventory
 */
const checkRequestFulfillment = async (requestId) => {
  const request = await BloodRequest.findById(requestId);
  if (!request || request.status === 'fulfilled') return;

  // Try to fulfill from available inventory
  const assignedBanks = request.fulfillmentDetails.assignedBloodBanks.filter(
    (b) => b.status === 'assigned'
  );

  let totalFulfilled = request.issuedUnits || request.fulfillmentDetails.fulfilledUnits || 0;

  for (const bankAssignment of assignedBanks) {
    const available = await inventoryService.getAvailableInventory(
      bankAssignment.bloodBankId,
      request.bloodGroup,
      request.component
    );

    const availableUnits = available.reduce((sum, item) => sum + item.units, 0);
    const neededUnits = bankAssignment.units - (bankAssignment.fulfilledUnits || 0);

    if (availableUnits >= neededUnits) {
      // Reserve and issue
      try {
        const { reserved } = await inventoryService.reserveInventory(
          bankAssignment.bloodBankId,
          request.bloodGroup,
          request.component,
          neededUnits,
          request._id
        );

        await inventoryService.issueInventory(
          reserved.map((r) => r._id),
          request._id
        );

        bankAssignment.status = 'fulfilled';
        bankAssignment.fulfilledUnits = neededUnits;
        totalFulfilled += neededUnits;
      } catch (error) {
        console.error('Fulfillment error:', error);
      }
    }
  }

  request.issuedUnits = totalFulfilled;
  request.fulfillmentDetails.fulfilledUnits = totalFulfilled;

  if (totalFulfilled >= request.units) {
    request.status = 'fulfilled';
    
    // Stop donor mobilization
    const donorMobilizationService = require('../services/donorMobilizationService');
    await donorMobilizationService.stopMobilization(request._id);

    // Notify hospital
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findById(request.hospitalId).populate('userId');
    if (hospital && hospital.userId) {
      await notificationService.createNotification({
        recipientId: hospital.userId._id,
        recipientModel: 'User',
        recipientRole: 'Hospital',
        type: 'request_fulfilled',
        title: 'Blood Request Fulfilled',
        message: `Your request for ${request.units} units of ${request.bloodGroup} has been fulfilled.`,
        relatedEntityId: request._id,
        relatedEntityType: 'BloodRequest',
        priority: 'high',
      });
    }
  } else if (totalFulfilled > 0) {
    request.status = 'partially_fulfilled';
  }

  await request.save();
};

/**
 * Get blood bank's donations
 */
const getBloodBankDonations = async (req, res, next) => {
  try {
    const bloodBankId = req.user.profileId;
    const { status, testingStatus, limit = 50, skip = 0 } = req.query;

    const query = { bloodBankId };
    if (status) query.status = status;
    if (testingStatus) query.testingStatus = testingStatus;

    const donations = await Donation.find(query)
      .populate('donorId', 'bloodGroup')
      .populate('requestId', 'bloodGroup units urgency')
      .sort({ donationDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordTestResults,
  issueBlood,
  getBloodBankDonations,
};

