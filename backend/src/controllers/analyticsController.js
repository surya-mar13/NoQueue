const analyticsService = require('../services/analyticsService');

const getLocationAnalytics = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const analytics = await analyticsService.getLocationAnalytics(locationId);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLocationAnalytics,
};