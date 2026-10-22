const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const generateJWT = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User already exists with this email');
    error.statusCode = 400;
    throw error;
  }

  // Allow self-registration as 'user' or 'vendor'
  const userRole = role === 'vendor' ? 'vendor' : 'user';

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
  });

  const token = generateJWT(user._id);

  return {
    user: user.toSafeObject(),
    token,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateJWT(user._id);

  return {
    user: user.toSafeObject(),
    token,
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};