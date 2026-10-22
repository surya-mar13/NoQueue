const predictionService = require('../services/predictionService');
const QueueEntry = require('../models/QueueEntry');

const getWaitTimePrediction = async (req, res, next) => {
  try {
    const { locationId } = req.params;

    // Check if authenticated user has a position in queue
    let peopleAhead = 0;
    if (req.user) {
      const activeEntry = await QueueEntry.findOne({
        location: locationId,
        user: req.user._id,
        status: 'waiting',
      });
      if (activeEntry && activeEntry.position > 1) {
        peopleAhead = activeEntry.position - 1;
      }
    }

    // Allow query param override: ?peopleAhead=X
    if (req.query.peopleAhead !== undefined) {
      peopleAhead = parseInt(req.query.peopleAhead, 10) || 0;
    }

    const prediction = await predictionService.predictWaitTime(locationId, peopleAhead);
    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    next(error);
  }
};

const getCrowdPrediction = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const crowdTrends = await predictionService.predictCrowdTrends(locationId);
    res.status(200).json({
      success: true,
      data: crowdTrends,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWaitTimePrediction,
  getCrowdPrediction,
};