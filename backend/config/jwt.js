module.exports = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRE || '7d',
};

