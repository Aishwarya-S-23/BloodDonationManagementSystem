const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const bloodRequestController = require('../controllers/bloodRequestController');
const { bloodRequestValidator } = require('../utils/validators');

// All routes require Hospital role
router.use(authenticateJWT);
router.use(authorizeRole('Hospital'));
router.use(auditLogger);

// Blood request routes
router.post(
  '/requests',
  bloodRequestValidator,
  bloodRequestController.createRequest
);

router.get('/requests', bloodRequestController.getHospitalRequests);
router.get('/requests/:id', bloodRequestController.getRequestDetails);
router.get('/requests/:id/fulfillment-status', bloodRequestController.getFulfillmentStatus);
router.put('/requests/:id/cancel', bloodRequestController.cancelRequest);
router.post('/requests/:id/escalate', bloodRequestController.forceEscalateRequest);

// Place details endpoint for accepted fulfillments
router.get('/place-details/:placeId', bloodRequestController.getPlaceDetails);

module.exports = router;

