const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};

