const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const adminController = require('../controllers/adminController');

// All routes require Admin role
router.use(authenticateJWT);
router.use(authorizeRole('Admin'));
router.use(auditLogger);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// Statistics
router.get('/statistics', adminController.getStatistics);

// Test data management (for development/testing)
router.post('/test/add-inventory', adminController.addTestInventory);

module.exports = router;

