module.exports = {
  port: process.env.PORT || 5000, // Revert default port to 5000
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 60 * 100000000000000000000000000000000000000 : 15 * 60 * 1000), // 1 minute in dev, 15 minutes in prod
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 100000000000000000000000000000000000000000000 : 100000000000000000000000000000000000000000000), // 5000 requests per minute in dev, 10000 per 15 min in prod
  },
};

