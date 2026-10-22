const express = require('express');
const { param } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const Location = require('../models/Location');

const router = express.Router();

const verifyAnalyticsOwnership = async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  const location = await Location.findById(req.params.locationId);
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }

  if (location.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You cannot view analytics for locations you do not own',
    });
  }

  next();
};

router.get(
  '/:locationId',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  [param('locationId').isMongoId().withMessage('Invalid location ID')],
  validate,
  verifyAnalyticsOwnership,
  analyticsController.getLocationAnalytics
);

module.exports = router;