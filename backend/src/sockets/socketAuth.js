const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Socket.io middleware to verify JWT token during handshake
 * Supports token in auth payload ({ token: "..." }) or authorization header
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return next(new Error('Authentication error: User no longer exists'));
    }

    // Attach user profile to socket instance
    socket.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return next(new Error(`Authentication error: ${error.message}`));
  }
};

module.exports = socketAuthMiddleware;