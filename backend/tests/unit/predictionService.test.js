const Location = require('../../src/models/Location');
const QueueEntry = require('../../src/models/QueueEntry');
const User = require('../../src/models/User');
const predictionService = require('../../src/services/predictionService');

describe('Prediction Service - Unit Tests', () => {
  let location, adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin Pred',
      email: 'pred_admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    location = await Location.create({
      name: 'Metro City Bank',
      address: '77 Commerce Blvd',
      category: 'bank',
      avgServiceTime: 12,
      status: 'open',
      createdBy: adminUser._id,
    });
  });

  test('getWeightsForRecord assigns decaying weights based on age', () => {
    const recentDate = new Date();
    const mediumDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

    expect(predictionService.getWeightsForRecord(recentDate)).toBe(3.0);
    expect(predictionService.getWeightsForRecord(mediumDate)).toBe(1.5);
    expect(predictionService.getWeightsForRecord(oldDate)).toBe(1.0);
  });

  test('predictWaitTime falls back to location avgServiceTime when no history exists', async () => {
    const prediction = await predictionService.predictWaitTime(location._id, 3);

    expect(prediction.avgWaitPerPerson).toBe(12);
    expect(prediction.estimatedWaitMinutes).toBe(36);
  });

  test('predictWaitTime uses weighted average bucket when at least 3 historical records exist', async () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    const dummyUser = await User.create({
      name: 'Hist User',
      email: 'hist@test.com',
      password: 'password123',
    });

    for (let i = 0; i < 3; i++) {
      await QueueEntry.create({
        user: dummyUser._id,
        location: location._id,
        status: 'served',
        tokenNumber: `B-10${i}`,
        hourOfDay,
        dayOfWeek,
        serviceDuration: 20,
        joinedAt: new Date(Date.now() - 100000),
        servedAt: new Date(),
      });
    }

    const prediction = await predictionService.predictWaitTime(location._id, 2);

    expect(prediction.avgWaitPerPerson).toBe(20);
    expect(prediction.estimatedWaitMinutes).toBe(40);
  });

  test('predictCrowdTrends returns 12 hourly intervals with calculated crowd levels', async () => {
    const crowdTrends = await predictionService.predictCrowdTrends(location._id);

    expect(crowdTrends).toBeDefined();
    expect(crowdTrends.locationName).toBe('Metro City Bank');
    expect(crowdTrends.predictions).toHaveLength(12);
    expect(crowdTrends.predictions[0]).toHaveProperty('crowdLevel');
    expect(['Low', 'Medium', 'High']).toContain(crowdTrends.predictions[0].crowdLevel);
  });
});