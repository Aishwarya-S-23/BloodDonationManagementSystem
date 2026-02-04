/**
 * Get compatible blood groups for a given blood group
 * @param {string} bloodGroup - Requested blood group
 * @returns {Array} Array of compatible blood groups
 */
const getCompatibleBloodGroups = (bloodGroup) => {
  const compatibilityMap = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
  };

  return compatibilityMap[bloodGroup] || [];
};

/**
 * Check if blood group is rare
 * @param {string} bloodGroup - Blood group to check
 * @returns {boolean} True if rare
 */
const isRareBloodGroup = (bloodGroup) => {
  const rareGroups = ['AB-', 'B-', 'A-', 'O-'];
  return rareGroups.includes(bloodGroup);
};

/**
 * Calculate days until expiry
 * @param {Date} expiryDate - Expiry date
 * @returns {number} Days until expiry
 */
const daysUntilExpiry = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if inventory is expiring soon
 * @param {Date} expiryDate - Expiry date
 * @param {number} thresholdDays - Days threshold (default 7)
 * @returns {boolean} True if expiring soon
 */
const isExpiringSoon = (expiryDate, thresholdDays = 7) => {
  return daysUntilExpiry(expiryDate) <= thresholdDays;
};

/**
 * Format error message for API response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
const formatError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return { error: 'Validation error', details: errors };
  }

  if (error.name === 'CastError') {
    return { error: 'Invalid ID format' };
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return { error: `${field} already exists` };
  }

  return { error: error.message || 'Internal server error' };
};

/**
 * Sanitize input string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Generate unique batch number
 * @returns {string} Batch number
 */
const generateBatchNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
};

/**
 * Calculate cooldown end date
 * @param {Date} lastDonationDate - Last donation date
 * @param {number} cooldownDays - Cooldown period in days
 * @returns {Date} Cooldown end date
 */
const getCooldownEndDate = (lastDonationDate, cooldownDays = 56) => {
  const endDate = new Date(lastDonationDate);
  endDate.setDate(endDate.getDate() + cooldownDays);
  return endDate;
};

/**
 * Check if donor can donate based on cooldown
 * @param {Date} lastDonationDate - Last donation date
 * @param {number} cooldownDays - Cooldown period in days
 * @returns {boolean} True if can donate
 */
const canDonateAfterCooldown = (lastDonationDate, cooldownDays = 56) => {
  if (!lastDonationDate) return true;
  const cooldownEnd = getCooldownEndDate(lastDonationDate, cooldownDays);
  return new Date() >= cooldownEnd;
};

/**
 * Standard API success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
    data,
    error: null,
  };
  
  // Remove data field if null
  if (data === null) {
    delete response.data;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Standard API error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} error - Error details
 */
const sendError = (res, statusCode = 500, message = 'An error occurred', error = null) => {
  const response = {
    success: false,
    message,
    data: null,
    error,
  };
  
  return res.status(statusCode).json(response);
};

module.exports = {
  getCompatibleBloodGroups,
  isRareBloodGroup,
  daysUntilExpiry,
  isExpiringSoon,
  formatError,
  sanitizeString,
  generateBatchNumber,
  getCooldownEndDate,
  canDonateAfterCooldown,
  sendSuccess,
  sendError,
};

