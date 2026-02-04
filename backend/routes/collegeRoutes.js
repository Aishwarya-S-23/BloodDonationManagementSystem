const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const collegeController = require('../controllers/collegeController');
const { body } = require('express-validator');

// All routes require College role
router.use(authenticateJWT);
router.use(authorizeRole('College'));
router.use(auditLogger);

// Get escalated requests
router.get('/requests', collegeController.getEscalatedRequests);

// Mobilize donors
router.post(
  '/donors/mobilize',
  [body('requestId').isMongoId()],
  collegeController.mobilizeDonors
);

module.exports = router;

