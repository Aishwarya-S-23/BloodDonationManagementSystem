const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateJWT);

// Get notifications
router.get('/', notificationController.getNotifications);

// Mark as read
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;

