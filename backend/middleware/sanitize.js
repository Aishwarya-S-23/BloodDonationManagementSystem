const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitize user input to prevent NoSQL injection attacks
 * Removes any keys that start with '$' or contain '.'
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize req.body, req.query, req.params
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body, {
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`Sanitized potentially malicious input: ${key}`);
      },
    });
  }
  
  if (req.query) {
    req.query = mongoSanitize.sanitize(req.query, {
      replaceWith: '_',
    });
  }
  
  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params, {
      replaceWith: '_',
    });
  }
  
  next();
};

/**
 * Validate MongoDB ObjectId format
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
    
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        field: paramName 
      });
    }
    
    next();
  };
};

/**
 * Sanitize string to prevent XSS attacks
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove any HTML tags and script tags
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

/**
 * Deep sanitize object for XSS prevention
 */
const deepSanitize = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = deepSanitize(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * XSS protection middleware
 */
const xssProtection = (req, res, next) => {
  if (req.body) {
    req.body = deepSanitize(req.body);
  }
  
  if (req.query) {
    req.query = deepSanitize(req.query);
  }
  
  if (req.params) {
    req.params = deepSanitize(req.params);
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  validateObjectId,
  xssProtection,
  sanitizeString,
};

