const Location = require('../models/Location');
const QueueEntry = require('../models/QueueEntry');

const getAllLocations = async (filters = {}, currentUser = null) => {
  const query = {};
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;

  // If a vendor specifically requests their dashboard view (?scoped=true)
  if (filters.scoped === 'true' && currentUser) {
    if (currentUser.role === 'vendor') {
      query.createdBy = currentUser._id;
    }
  }

  const locations = await Location.find(query).sort({ createdAt: -1 }).lean();

  const locationsWithCounts = await Promise.all(
    locations.map(async (loc) => {
      const activeQueueCount = await QueueEntry.countDocuments({
        location: loc._id,
        status: { $in: ['waiting', 'called'] },
      });
      return {
        ...loc,
        currentQueueLength: activeQueueCount,
        estimatedWaitTime: activeQueueCount * loc.avgServiceTime,
      };
    })
  );

  return locationsWithCounts;
};

const getLocationById = async (locationId) => {
  const location = await Location.findById(locationId).lean();
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  const activeQueueCount = await QueueEntry.countDocuments({
    location: location._id,
    status: { $in: ['waiting', 'called'] },
  });

  return {
    ...location,
    currentQueueLength: activeQueueCount,
    estimatedWaitTime: activeQueueCount * location.avgServiceTime,
  };
};

const createLocation = async (data, creatorId) => {
  const location = await Location.create({
    ...data,
    createdBy: creatorId,
  });
  return location;
};

const updateLocation = async (locationId, updateData, user) => {
  const location = await Location.findById(locationId);
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  // Enforce vendor isolation: only location owner or admin can update
  if (user.role !== 'admin' && location.createdBy.toString() !== user._id.toString()) {
    const error = new Error('Unauthorized: You can only edit locations created by your account');
    error.statusCode = 403;
    throw error;
  }

  Object.assign(location, updateData);
  await location.save();
  return location;
};

const deleteLocation = async (locationId, user) => {
  const location = await Location.findById(locationId);
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  // Enforce vendor isolation: only location owner or admin can delete
  if (user.role !== 'admin' && location.createdBy.toString() !== user._id.toString()) {
    const error = new Error('Unauthorized: You can only delete locations created by your account');
    error.statusCode = 403;
    throw error;
  }

  await Location.findByIdAndDelete(locationId);

  // Cancel any active entries at this location
  await QueueEntry.updateMany(
    { location: locationId, status: { $in: ['waiting', 'called'] } },
    { status: 'cancelled' }
  );

  return location;
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};