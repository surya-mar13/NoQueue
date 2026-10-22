const QueueEntry = require('../models/QueueEntry');
const Location = require('../models/Location');

const getLocationAnalytics = async (locationId) => {
  const location = await Location.findById(locationId).lean();
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 1. Current Queue Length
  const currentQueueLength = await QueueEntry.countDocuments({
    location: locationId,
    status: { $in: ['waiting', 'called'] },
  });

  // 2. Total Served Today
  const totalServedToday = await QueueEntry.countDocuments({
    location: locationId,
    status: 'served',
    servedAt: { $gte: startOfToday },
  });

  // 3. Average Wait Time (joinedAt to calledAt/servedAt)
  const servedEntries = await QueueEntry.find({
    location: locationId,
    status: 'served',
    serviceDuration: { $exists: true,$ne: null },
  }).lean();

  const totalServiceDuration = servedEntries.reduce((sum, item) => sum + (item.serviceDuration || 0), 0);
  const averageWaitTime = servedEntries.length > 0 ? Math.round(totalServiceDuration / servedEntries.length) : location.avgServiceTime;

  // 4. Peak Hours Breakdown (Aggregated by hourOfDay)
  const peakHoursAggregate = await QueueEntry.aggregate([
    { $match: { location: location._id } },
    {
      $group: {
        _id: '$hourOfDay',
        count: { $sum: 1 },       },     },     {$sort: { _id: 1 } },
  ]);

  const peakHoursChart = Array.from({ length: 24 }, (_, hour) => {
    const found = peakHoursAggregate.find((item) => item._id === hour);
    return {
      hour,
      label: `${hour}:00`,
      visitors: found ? found.count : 0,
    };
  });

  return {
    locationId: location._id,
    locationName: location.name,
    currentQueueLength,
    totalServedToday,
    averageWaitTime,
    peakHoursChart,
  };
};

module.exports = {
  getLocationAnalytics,
};