const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const inventoryController = require('../controllers/inventoryController');
const donationController = require('../controllers/donationController');
const { body } = require('express-validator');
const { testResultsValidator } = require('../utils/validators');

// All routes require BloodBank role
router.use(authenticateJWT);
router.use(authorizeRole('BloodBank'));
router.use(auditLogger);

// Inventory routes
router.get('/inventory', inventoryController.getInventory);
router.post(
  '/inventory',
  [
    body('bloodBankId').isMongoId(),
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('component').isIn(['whole', 'platelets', 'plasma', 'red_cells']),
    body('units').isInt({ min: 1 }),
    body('expiryDate').isISO8601(),
    body('source').isIn(['donation', 'transfer', 'purchase']),
  ],
  inventoryController.addInventory
);
router.post(
  '/inventory/fulfill',
  [
    body('requestId').isMongoId(),
    body('units').isInt({ min: 1 }),
  ],
  inventoryController.fulfillRequest
);
router.get('/inventory/expiring', inventoryController.getExpiringInventory);
router.post('/inventory/mark-expired', inventoryController.markExpired);

// Donation routes
router.get('/donations', donationController.getBloodBankDonations);
router.post(
  '/donations/:id/test',
  testResultsValidator,
  donationController.recordTestResults
);
router.post('/donations/:id/issue', donationController.issueBlood);

// Get assigned requests
router.get('/requests', async (req, res, next) => {
  try {
    const BloodRequest = require('../models/BloodRequest');
    const { sendSuccess } = require('../utils/helpers');
    const bloodBankId = req.user.profileId;
    
    const { limit = 50, skip = 0 } = req.query;

    const query = {
      'fulfillmentDetails.assignedBloodBanks.bloodBankId': bloodBankId,
      status: { $in: ['pending', 'processing', 'partially_fulfilled'] },
    };

    const requests = await BloodRequest.find(query)
      .populate('hospitalId', 'name address')
      .sort({ urgency: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await BloodRequest.countDocuments(query);

    return sendSuccess(res, 200, 'Assigned requests retrieved successfully', {
      requests,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

