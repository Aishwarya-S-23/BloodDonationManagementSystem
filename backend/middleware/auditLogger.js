const AuditLog = require('../models/AuditLog');

/**
 * Audit logger middleware
 * Logs all actions to audit log
 */
const auditLogger = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to capture response
  res.json = function (data) {
    // Log the action after response is sent
    if (req.user) {
      const entityType = getEntityTypeFromPath(req.path);
      const entityId = req.params.id || req.body.id || req.body.requestId || req.body.inventoryId;
      
      // Only log if we have a valid entityType and entityId
      if (entityType && entityType !== 'Unknown' && entityId) {
        const auditData = {
          userId: req.user._id || req.userId,
          userRole: req.user.role || req.userRole,
          action: getActionFromMethod(req.method),
          entityType: entityType,
          entityId: entityId,
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            body: sanitizeRequestBody(req.body),
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
        };

        // Don't await - log asynchronously
        AuditLog.create(auditData).catch((err) => {
          console.error('Audit log error:', err.message);
        });
      }
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Get action type from HTTP method
 */
const getActionFromMethod = (method) => {
  const methodMap = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };
  return methodMap[method] || 'read';
};

/**
 * Extract entity type from path
 */
const getEntityTypeFromPath = (path) => {
  // Valid entity types from AuditLog model
  const validEntityTypes = [
    'User',
    'Hospital',
    'BloodBank',
    'Donor',
    'College',
    'BloodRequest',
    'Inventory',
    'Donation',
    'Appointment',
    'Notification',
  ];

  // Map path patterns to entity types
  if (path.includes('/requests')) return 'BloodRequest';
  if (path.includes('/inventory')) return 'Inventory';
  if (path.includes('/donations')) return 'Donation';
  if (path.includes('/appointments')) return 'Appointment';
  if (path.includes('/notifications')) return 'Notification';
  if (path.includes('/hospitals')) return 'Hospital';
  if (path.includes('/blood-banks')) return 'BloodBank';
  if (path.includes('/donors')) return 'Donor';
  if (path.includes('/colleges')) return 'College';
  if (path.includes('/users') || path.includes('/profile')) return 'User';

  return null; // Return null for unmapped paths
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeRequestBody = (body) => {
  if (!body) return {};
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'auth'];
  
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

module.exports = auditLogger;

