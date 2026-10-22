const QueueEntry = require('../models/QueueEntry');
const Location = require('../models/Location');

/**
 * PREDICTION ALGORITHM:
 * 1. Historical Bucketing:
 *    Groups completed services ('served') by location, dayOfWeek (0-6), and hourOfDay (0-23).
 *
 * 2. Exponential Recency Weighting (Weighted Moving Average):
 *    Recent entries receive progressively higher weights:
 *    - Records from the last 7 days: weight = 3.0
 *    - Records from 8-30 days ago: weight = 1.5
 *    - Records older than 30 days: weight = 1.0
 *
 * 3. Fallback Hierarchy:
 *    - Specific bucket: (dayOfWeek, hourOfDay) >= 3 records
 *    - General location average: overall historical avg of that location
 *    - Location default configured baseline: location.avgServiceTime
 *
 * 4. Wait Time Calculation:
 *    Estimated Wait = (Number of People Ahead + 1) * Predicted Avg Service Time
 */

const getWeightsForRecord = (recordDate) => {
  const diffDays = (Date.now() - new Date(recordDate).getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) return 3.0;
  if (diffDays <= 30) return 1.5;
  return 1.0;
};

const getPredictedServiceTime = async (locationId, dayOfWeek, hourOfDay) => {
  const location = await Location.findById(locationId).lean();
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  // Retrieve historical entries served for this time bucket
  const bucketEntries = await QueueEntry.find({
    location: locationId,
    status: 'served',
    dayOfWeek,
    hourOfDay,
    serviceDuration: { $exists: true, $ne: null,$gt: 0 },
  })
    .sort({ servedAt: -1 })
    .limit(100)
    .lean();

  if (bucketEntries.length >= 3) {
    let totalWeightedDuration = 0;
    let totalWeight = 0;

    bucketEntries.forEach((entry) => {
      const weight = getWeightsForRecord(entry.servedAt || entry.joinedAt);
      totalWeightedDuration += entry.serviceDuration * weight;
      totalWeight += weight;
    });

    return Math.max(1, Math.round(totalWeightedDuration / totalWeight));
  }

  // Fallback 1: Overall location historical average across all hours
  const overallEntries = await QueueEntry.find({
    location: locationId,
    status: 'served',
    serviceDuration: { $exists: true, $ne: null,$gt: 0 },
  })
    .limit(150)
    .lean();

  if (overallEntries.length >= 3) {
    const sum = overallEntries.reduce((acc, curr) => acc + curr.serviceDuration, 0);
    return Math.max(1, Math.round(sum / overallEntries.length));
  }

  // Fallback 2: Static location-level default
  return location.avgServiceTime || 10;
};

/**
 * Predicts total remaining wait time for a given position
 */
const predictWaitTime = async (locationId, peopleAhead = 0) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hourOfDay = now.getHours();

  const avgWaitPerPerson = await getPredictedServiceTime(locationId, dayOfWeek, hourOfDay);
  const estimatedWaitMinutes = Math.max(0, peopleAhead * avgWaitPerPerson);

  return {
    peopleAhead,
    avgWaitPerPerson,
    estimatedWaitMinutes,
    timeBucket: { dayOfWeek, hourOfDay },
  };
};

/**
 * Hourly crowd prediction for the next 12 hours
 * Categorizes crowd levels into Low, Medium, and High based on historical queues
 */
const predictCrowdTrends = async (locationId) => {
  const location = await Location.findById(locationId).lean();
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  const current = new Date();
  const hourlyPredictions = [];

  for (let i = 0; i < 12; i++) {
    const forecastTime = new Date(current.getTime() + i * 60 * 60 * 1000);
    const targetHour = forecastTime.getHours();
    const targetDay = forecastTime.getDay();

    // Query historical volume joined at this specific hour and day
    const entriesCount = await QueueEntry.countDocuments({
      location: locationId,
      dayOfWeek: targetDay,
      hourOfDay: targetHour,
    });

    // Determine crowd density level thresholds
    let crowdLevel = 'Low';
    let expectedQueueLength = Math.max(1, Math.round(entriesCount / 4));

    if (entriesCount >= 20) {
      crowdLevel = 'High';
    } else if (entriesCount >= 8) {
      crowdLevel = 'Medium';
    }

    hourlyPredictions.push({
      time: forecastTime.toISOString(),
      hour: targetHour,
      dayOfWeek: targetDay,
      formattedHour: `${targetHour % 12 === 0 ? 12 : targetHour % 12}:00 ${targetHour >= 12 ? 'PM' : 'AM'}`,
      crowdLevel,
      expectedQueueLength,
    });
  }

  return {
    locationId,
    locationName: location.name,
    predictions: hourlyPredictions,
  };
};

module.exports = {
  predictWaitTime,
  predictCrowdTrends,
  getPredictedServiceTime,
  getWeightsForRecord,
};