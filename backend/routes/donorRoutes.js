const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const donorController = require('../controllers/donorController');

// All routes require Donor role
router.use(authenticateJWT);
router.use(authorizeRole('Donor'));
router.use(auditLogger);

// Profile routes
router.get('/profile', donorController.getProfile);
router.put('/profile', donorController.updateProfile);

// Appointment routes
router.get('/appointments', donorController.getAppointments);
router.post('/appointments/:id/confirm', donorController.confirmAppointment);

// Eligibility
router.get('/eligibility', donorController.checkEligibility);

// Donation requests and responses
router.get('/requests', donorController.getDonationRequests);
router.post('/requests/:requestId/respond', donorController.respondToRequest);

// Notifications
router.get('/notifications', donorController.getNotifications);
router.put('/notifications/:notificationId/read', donorController.markNotificationRead);

// Donation history
router.get('/history', donorController.getDonationHistory);

// Availability
router.put('/availability', donorController.updateAvailability);

module.exports = router;

