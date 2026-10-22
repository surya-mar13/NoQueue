const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Location = require('../../src/models/Location');
const jwt = require('jsonwebtoken');
const env = require('../../src/config/env');

describe('Queue Endpoints Integration Tests', () => {
  let userToken, adminToken, location;

  beforeEach(async () => {
    const admin = await User.create({
      name: 'Admin Flow',
      email: 'adminflow@test.com',
      password: 'password123',
      role: 'admin',
    });
    adminToken = jwt.sign({ id: admin._id }, env.JWT_SECRET);

    const user = await User.create({
      name: 'Regular Customer',
      email: 'regular@test.com',
      password: 'password123',
      role: 'user',
    });
    userToken = jwt.sign({ id: user._id }, env.JWT_SECRET);

    location = await Location.create({
      name: 'Downtown Clinic',
      address: '400 Main Street',
      category: 'hospital',
      avgServiceTime: 10,
      createdBy: admin._id,
    });
  });

  test('POST /api/queues/:locationId/join allows authenticated user to join', async () => {
    const res = await request(app)
      .post(`/api/queues/${location._id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.position).toBe(1);
    expect(res.body.data.status).toBe('waiting');
  });

  test('GET /api/queues/my/active retrieves active ticket', async () => {
    await request(app)
      .post(`/api/queues/${location._id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    const res = await request(app)
      .get('/api/queues/my/active')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.location._id.toString()).toBe(location._id.toString());
  });

  test('Admin Flow: call-next and mark served', async () => {
    await request(app)
      .post(`/api/queues/${location._id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    const callRes = await request(app)
      .post(`/api/queues/${location._id}/call-next`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(callRes.status).toBe(200);
    expect(callRes.body.data.status).toBe('called');

    const entryId = callRes.body.data._id;

    const servedRes = await request(app)
      .patch(`/api/queues/entry/${entryId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'served' });

    expect(servedRes.status).toBe(200);
    expect(servedRes.body.data.status).toBe('served');
  });
});