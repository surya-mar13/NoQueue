const jwt = require('jsonwebtoken');
const authenticate = require('../../src/middleware/auth');
const authorizeRoles = require('../../src/middleware/role');
const User = require('../../src/models/User');
const env = require('../../src/config/env');

describe('Auth & Role Middleware - Unit Tests', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({
      name: 'Auth Test User',
      email: 'authtest@example.com',
      password: 'password123',
      role: 'user',
    });
  });

  test('authenticate fails when no header is provided', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication token missing or invalid' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('authenticate populates req.user when valid token is provided', async () => {
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET);
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(user._id.toString());
    expect(next).toHaveBeenCalled();
  });

  test('authorizeRoles allows permitted role', () => {
    const req = { user: { role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middleware = authorizeRoles('admin');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('authorizeRoles blocks forbidden role with 403', () => {
    const req = { user: { role: 'user' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middleware = authorizeRoles('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});