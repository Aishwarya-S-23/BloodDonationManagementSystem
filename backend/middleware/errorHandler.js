const { formatError } = require('../utils/helpers');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format - Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `Duplicate value: ${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired. Please login again.';
    error = { message, statusCode: 401 };
  }

  // Rate limit errors (429)
  if (err.statusCode === 429 || err.status === 429) {
    const retryAfter = err.retryAfter || Math.ceil((err.windowMs || 900000) / 1000);
    res.setHeader('Retry-After', retryAfter);
    const message = err.message || 'Too many requests, please try again later.';
    return res.status(429).json({
      success: false,
      message,
      retryAfter,
    });
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || 'Internal Server Error';

  // Standard error response format
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack,
      name: err.name,
    } : null,
  });
};

module.exports = errorHandler;

