const locationService = require('../services/locationService');

const getAll = async (req, res, next) => {
  try {
    const locations = await locationService.getAllLocations(req.query, req.user);
    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const location = await locationService.getLocationById(req.params.id);
    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const location = await locationService.createLocation(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const location = await locationService.updateLocation(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const location = await locationService.deleteLocation(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Location and associated queues deleted successfully',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};