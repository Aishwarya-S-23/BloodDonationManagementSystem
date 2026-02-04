require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const appConfig = require('./config/app');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInput, xssProtection } = require('./middleware/sanitize');

// Import routes
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const bloodBankRoutes = require('./routes/bloodBankRoutes');
const donorRoutes = require('./routes/donorRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const transportationRoutes = require('./routes/transportationRoutes');
const antiWastageService = require('./services/antiWastageService');
const fulfillmentMonitoringService = require('./services/fulfillmentMonitoringService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: appConfig.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io available to routes and controllers
app.set('io', io);
app.locals.io = io;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
app.use(cors({ 
  origin: appConfig.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
}));
// Request body size limits to prevent DoS attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Security middleware - Apply to all routes
app.use(sanitizeInput); // Prevent NoSQL injection
app.use(xssProtection);  // Prevent XSS attacks

// Helper function to create rate limiter with Retry-After header
const createRateLimiter = (options) => {
  const limiter = rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Calculate retry-after in seconds
      const retryAfter = Math.ceil(options.windowMs / 1000);
      
      // Set Retry-After header (in seconds)
      res.setHeader('Retry-After', retryAfter);
      
      // Send 429 response with proper format
      res.status(429).json({
        success: false,
        message: options.message?.error || 'Too many requests, please try again later.',
        error: options.message?.error || 'Too many requests, please try again later.',
        retryAfter: retryAfter,
        retryAfterFormatted: options.message?.retryAfter || `${Math.ceil(retryAfter / 60)} minutes`,
        data: null,
      });
    },
  });
  
  return limiter;
};

// Rate limiting configuration
const limiter = createRateLimiter({
  ...appConfig.rateLimit,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: `${Math.ceil(appConfig.rateLimit.windowMs / (60 * 1000))} minutes`
  }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // In development we keep this high to avoid blocking local testing flows.
  max: appConfig.nodeEnv === 'development' ? 200 : 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
});

// Rate limiter for profile operations
const profileLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    error: 'Too many profile operations, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Rate limiter for request creation
const requestLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  // In development we keep this high to avoid blocking local testing flows.
  max: appConfig.nodeEnv === 'development' ? 200 : 10,
  message: {
    error: 'Too many request creation attempts. Please try again later.',
    retryAfter: '5 minutes'
  }
});

// Apply general rate limiting to all API routes
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Blood Connect API is running' });
});

// Routes
// Public routes (no authentication required)
app.use('/api/public', publicRoutes);

// Protected routes with specific rate limiting
app.use('/api/auth/login', authLimiter); // Stricter limit for login
app.use('/api/auth/register', authLimiter); // Stricter limit for registration
app.use('/api/auth', authRoutes);

app.use('/api/hospitals/requests', requestLimiter); // Rate limit request creation
app.use('/api/hospitals', hospitalRoutes);

app.use('/api/blood-banks', bloodBankRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transportation', transportationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Schedule maintenance tasks (anti-wastage + transportation optimization)
const maintenanceInterval = 60 * 60 * 1000; // Run every hour
setInterval(async () => {
  try {
    await antiWastageService.runMaintenanceTasks();

    // Run transportation optimization
    const transportationService = require('./services/transportationService');
    await transportationService.optimizeTransportationAssignments();

  } catch (error) {
    console.error('Maintenance task error:', error);
  }
}, maintenanceInterval);

// Run initial maintenance check
setTimeout(async () => {
  try {
    console.log('Running initial maintenance check...');
    await antiWastageService.runMaintenanceTasks();

    // Run initial transportation optimization
    const transportationService = require('./services/transportationService');
    await transportationService.optimizeTransportationAssignments();

  } catch (error) {
    console.error('Initial maintenance check error:', error);
  }
}, 30000); // Run 30 seconds after startup

// Socket.IO setup
require('./socket')(io);

// Start fulfillment monitoring service
setTimeout(async () => {
  try {
    console.log('Starting fulfillment monitoring service...');
    fulfillmentMonitoringService.start();
  } catch (error) {
    console.error('Fulfillment monitoring service startup error:', error);
  }
}, 15000); // Start 15 seconds after server startup

// Start server
const PORT = appConfig.port; // Revert to original port configuration
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${appConfig.nodeEnv} mode`);
  console.log(`Anti-wastage maintenance tasks scheduled to run every ${maintenanceInterval / (60 * 1000)} minutes`);
  console.log(`Socket.IO server initialized`);
});

module.exports = { app, server, io };

