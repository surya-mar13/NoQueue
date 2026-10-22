const Location = require('../models/Location');
const QueueEntry = require('../models/QueueEntry');
const { generateTokenNumber } = require('../utils/tokenGenerator');

/**
 * Helper to recalculate queue positions for all waiting users at a location
 */
const recalculatePositions = async (locationId) => {
  const waitingEntries = await QueueEntry.find({
    location: locationId,
    status: 'waiting',
  }).sort({ joinedAt: 1 });

  const bulkOps = waitingEntries.map((entry, index) => ({
    updateOne: {
      filter: { _id: entry._id },
      update: { $set: { position: index + 1 } },
    },
  }));

  if (bulkOps.length > 0) {
    await QueueEntry.bulkWrite(bulkOps);
  }

  return waitingEntries.length;
};

const joinQueue = async (userId, locationId) => {
  const location = await Location.findById(locationId);
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  if (location.status !== 'open') {
    const error = new Error(`Queue is currently ${location.status} for this location`);
    error.statusCode = 400;
    throw error;
  }

  // Ensure user cannot join the same queue twice simultaneously
  const existingActive = await QueueEntry.findOne({
    user: userId,
    location: locationId,
    status: { $in: ['waiting', 'called'] },
  });

  if (existingActive) {
    const error = new Error('You already have an active ticket in this queue');
    error.statusCode = 409;
    throw error;
  }

  const currentWaitingCount = await QueueEntry.countDocuments({
    location: locationId,
    status: 'waiting',
  });

  const now = new Date();
  const tokenNumber = generateTokenNumber(location.category);

  const entry = await QueueEntry.create({
    user: userId,
    location: locationId,
    status: 'waiting',
    position: currentWaitingCount + 1,
    tokenNumber,
    joinedAt: now,
    hourOfDay: now.getHours(),
    dayOfWeek: now.getDay(),
    queueLengthAtJoin: currentWaitingCount,
  });

  await entry.populate('location', 'name address category avgServiceTime status');
  return entry;
};

const leaveQueue = async (userId, locationId) => {
  const entry = await QueueEntry.findOne({
    user: userId,
    location: locationId,
    status: { $in: ['waiting', 'called'] },
  });

  if (!entry) {
    const error = new Error('No active queue entry found for this user at this location');
    error.statusCode = 404;
    throw error;
  }

  entry.status = 'cancelled';
  entry.position = 0;
  await entry.save();

  // Recalculate remaining positions
  await recalculatePositions(locationId);

  return entry;
};

const getLiveQueue = async (locationId) => {
  const location = await Location.findById(locationId);
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  const entries = await QueueEntry.find({
    location: locationId,
    status: { $in: ['waiting', 'called'] },
  })
    .populate('user', 'name email')
    .sort({ status: 1, position: 1, joinedAt: 1 });

  return entries;
};

const getMyActiveQueue = async (userId) => {
  const entry = await QueueEntry.findOne({
    user: userId,
    status: { $in: ['waiting', 'called'] },
  })
    .populate('location', 'name address category avgServiceTime status')
    .populate('user', 'name email');

  return entry;
};

const getMyQueueHistory = async (userId) => {
  const history = await QueueEntry.find({
    user: userId,
    status: { $in: ['served', 'cancelled', 'no_show'] },
  })
    .populate('location', 'name address category')
    .sort({ joinedAt: -1 })
    .limit(50);

  return history;
};

const callNext = async (locationId) => {
  // Check if someone is already in 'called' status
  const alreadyCalled = await QueueEntry.findOne({
    location: locationId,
    status: 'called',
  });

  if (alreadyCalled) {
    const error = new Error('A user is already in called status. Mark them served or no-show first.');
    error.statusCode = 400;
    throw error;
  }

  const nextEntry = await QueueEntry.findOne({
    location: locationId,
    status: 'waiting',
  })
    .sort({ joinedAt: 1 })
    .populate('user', 'name email')
    .populate('location', 'name address');

  if (!nextEntry) {
    const error = new Error('No users waiting in the queue');
    error.statusCode = 404;
    throw error;
  }

  nextEntry.status = 'called';
  nextEntry.calledAt = new Date();
  nextEntry.position = 0;
  await nextEntry.save();

  // Re-adjust remaining waiting entries
  await recalculatePositions(locationId);

  return nextEntry;
};

const updateEntryStatus = async (entryId, targetStatus) => {
  const validTransitions = ['served', 'no_show', 'cancelled'];
  if (!validTransitions.includes(targetStatus)) {
    const error = new Error(`Status must be one of: ${validTransitions.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const entry = await QueueEntry.findById(entryId);
  if (!entry) {
    const error = new Error('Queue entry not found');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  entry.status = targetStatus;
  entry.position = 0;

  if (targetStatus === 'served') {
    entry.servedAt = now;
    const startTime = entry.calledAt || entry.joinedAt;
    entry.serviceDuration = Math.max(1, Math.round((now - startTime) / 60000)); // duration in minutes
  }

  await entry.save();
  await recalculatePositions(entry.location);

  return entry;
};

module.exports = {
  recalculatePositions,
  joinQueue,
  leaveQueue,
  getLiveQueue,
  getMyActiveQueue,
  getMyQueueHistory,
  callNext,
  updateEntryStatus,
};