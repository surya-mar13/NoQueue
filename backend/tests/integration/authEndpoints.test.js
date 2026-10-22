const request = require('supertest');
const app = require('../../src/app');

describe('Auth Endpoints Integration Tests', () => {
  test('POST /api/auth/register creates user and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'janedoe@example.com',
        password: 'securePassword123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('janedoe@example.com');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('POST /api/auth/login logs in user successfully', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'janedoe@example.com',
      password: 'securePassword123',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'janedoe@example.com',
        password: 'securePassword123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('GET /api/auth/me returns authenticated user details', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'janedoe@example.com',
      password: 'securePassword123',
    });

    const token = regRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('janedoe@example.com');
  });
});