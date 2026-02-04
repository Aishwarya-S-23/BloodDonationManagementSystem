const { body, param, query } = require('express-validator');

// Blood group validation
const bloodGroupValidator = param('bloodGroup').isIn([
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
]);

// Component validation
const componentValidator = (field = 'component') => {
  return body(field).isIn(['whole', 'platelets', 'plasma', 'red_cells']);
};

// Urgency validation
const urgencyValidator = body('urgency').isIn(['low', 'medium', 'high', 'critical']);

// Status validation
const statusValidator = (field = 'status') => {
  return body(field).isIn([
    'pending', 'processing', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired'
  ]);
};

// Coordinates validation
const coordinatesValidator = [
  body('coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

// Blood request validation
const bloodRequestValidator = [
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  componentValidator(),
  body('units').isInt({ min: 1 }).withMessage('Units must be at least 1'),
  urgencyValidator,
  body('deadline').isISO8601().withMessage('Deadline must be a valid date'),
];

// Test results validation
const testResultsValidator = [
  body('testResults.hiv').optional().isIn(['negative', 'positive', 'pending']),
  body('testResults.hepatitisB').optional().isIn(['negative', 'positive', 'pending']),
  body('testResults.hepatitisC').optional().isIn(['negative', 'positive', 'pending']),
  body('testResults.syphilis').optional().isIn(['negative', 'positive', 'pending']),
  body('testResults.malaria').optional().isIn(['negative', 'positive', 'pending']),
];

module.exports = {
  bloodGroupValidator,
  componentValidator,
  urgencyValidator,
  statusValidator,
  coordinatesValidator,
  bloodRequestValidator,
  testResultsValidator,
};

