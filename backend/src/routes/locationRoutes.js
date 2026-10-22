const express = require('express');
const { body, param } = require('express-validator');
const locationController = require('../controllers/locationController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');

const router = express.Router();

// Optional user identity for scoped filtering
router.get('/', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}, locationController.getAll);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid location ID')],
  validate,
  locationController.getById
);

// Vendors & Admins can create locations
router.post(
  '/',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
    body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 250 }),
    body('category')
      .isIn(['hospital', 'bank', 'government', 'restaurant', 'retail', 'other'])
      .withMessage('Invalid category'),
    body('avgServiceTime')
      .optional()
      .isInt({ min: 1, max: 180 })
      .withMessage('Average service time must be between 1 and 180 minutes'),
  ],
  validate,
  locationController.create
);

// Vendors & Admins can edit their own locations
router.put(
  '/:id',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid location ID'),
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('status').optional().isIn(['open', 'paused', 'closed']).withMessage('Invalid status'),
    body('avgServiceTime').optional().isInt({ min: 1, max: 180 }),
  ],
  validate,
  locationController.update
);

// Vendors & Admins can delete their own locations
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  [param('id').isMongoId().withMessage('Invalid location ID')],
  validate,
  locationController.remove
);

module.exports = router;