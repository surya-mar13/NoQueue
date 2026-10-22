const express = require('express');
const { param, body } = require('express-validator');
const queueController = require('../controllers/queueController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const Location = require('../models/Location');
const QueueEntry = require('../models/QueueEntry');

const router = express.Router();

/**
 * Middleware: Verify that vendor owns the requested location
 */
const verifyLocationOwnership = async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  let locationId = req.params.locationId;

  if (!locationId && req.params.entryId) {
    const entry = await QueueEntry.findById(req.params.entryId).select('location');
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }
    locationId = entry.location;
  }

  const location = await Location.findById(locationId);
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }

  if (location.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permissions to manage this location',
    });
  }

  next();
};

// User Queue Actions (Requires Auth)
router.post(
  '/:locationId/join',
  authenticate,
  [param('locationId').isMongoId().withMessage('Invalid location ID')],
  validate,
  queueController.join
);

router.delete(
  '/:locationId/leave',
  authenticate,
  [param('locationId').isMongoId().withMessage('Invalid location ID')],
  validate,
  queueController.leave
);

router.get('/my/active', authenticate, queueController.getMyActive);
router.get('/my/history', authenticate, queueController.getMyHistory);

// Vendor & Admin Queue Management
router.get(
  '/:locationId',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  [param('locationId').isMongoId().withMessage('Invalid location ID')],
  validate,
  verifyLocationOwnership,
  queueController.getLiveQueue
);

router.post(
  '/:locationId/call-next',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  [param('locationId').isMongoId().withMessage('Invalid location ID')],
  validate,
  verifyLocationOwnership,
  queueController.callNext
);

router.patch(
  '/entry/:entryId/status',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  [
    param('entryId').isMongoId().withMessage('Invalid entry ID'),
    body('status')
      .isIn(['served', 'no_show', 'cancelled'])
      .withMessage('Status must be served, no_show, or cancelled'),
  ],
  validate,
  verifyLocationOwnership,
  queueController.updateStatus
);

module.exports = router;