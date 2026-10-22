const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Location = require('../../src/models/Location');
const QueueEntry = require('../../src/models/QueueEntry');
const queueService = require('../../src/services/queueService');

describe('Queue Service - Unit Tests', () => {
  let adminUser, testUser1, testUser2, location;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin Queue Test',
      email: 'admin_queue@test.com',
      password: 'password123',
      role: 'admin',
    });

    testUser1 = await User.create({
      name: 'User One',
      email: 'user1@test.com',
      password: 'password123',
      role: 'user',
    });

    testUser2 = await User.create({
      name: 'User Two',
      email: 'user2@test.com',
      password: 'password123',
      role: 'user',
    });

    location = await Location.create({
      name: 'General Hospital',
      address: '123 Health Ave',
      category: 'hospital',
      avgServiceTime: 15,
      status: 'open',
      createdBy: adminUser._id,
    });
  });

  test('joinQueue creates entry with position 1 for first user', async () => {
    const entry = await queueService.joinQueue(testUser1._id, location._id);

    expect(entry).toBeDefined();
    expect(entry.status).toBe('waiting');
    expect(entry.position).toBe(1);
    expect(entry.tokenNumber).toMatch(/^H-\d+/);
  });

  test('joinQueue assigns sequential positions to subsequent users', async () => {
    const entry1 = await queueService.joinQueue(testUser1._id, location._id);
    const entry2 = await queueService.joinQueue(testUser2._id, location._id);

    expect(entry1.position).toBe(1);
    expect(entry2.position).toBe(2);
  });

  test('joinQueue prevents user from joining the same queue twice', async () => {
    await queueService.joinQueue(testUser1._id, location._id);

    await expect(queueService.joinQueue(testUser1._id, location._id)).rejects.toThrow(
      'You already have an active ticket in this queue'
    );
  });

  test('leaveQueue cancels active ticket and shifts subsequent positions', async () => {
    await queueService.joinQueue(testUser1._id, location._id);
    const entry2 = await queueService.joinQueue(testUser2._id, location._id);

    expect(entry2.position).toBe(2);

    await queueService.leaveQueue(testUser1._id, location._id);

    const refreshedEntry2 = await QueueEntry.findById(entry2._id);
    expect(refreshedEntry2.position).toBe(1);
  });

  test('callNext moves waiting user to called and frees position', async () => {
    await queueService.joinQueue(testUser1._id, location._id);
    await queueService.joinQueue(testUser2._id, location._id);

    const called = await queueService.callNext(location._id);
    expect(called.status).toBe('called');
    expect(called.position).toBe(0);

    const user2Entry = await QueueEntry.findOne({ user: testUser2._id, status: 'waiting' });
    expect(user2Entry.position).toBe(1);
  });

  test('callNext throws error if a user is already in called status', async () => {
    await queueService.joinQueue(testUser1._id, location._id);
    await queueService.callNext(location._id);

    await expect(queueService.callNext(location._id)).rejects.toThrow(
      'A user is already in called status'
    );
  });

  test('updateEntryStatus marks user served and records serviceDuration', async () => {
    const entry = await queueService.joinQueue(testUser1._id, location._id);
    const called = await queueService.callNext(location._id);

    const served = await queueService.updateEntryStatus(called._id, 'served');
    expect(served.status).toBe('served');
    expect(served.serviceDuration).toBeGreaterThanOrEqual(1);
    expect(served.servedAt).toBeDefined();
  });
});