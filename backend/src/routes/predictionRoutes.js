const express = require('express');
const { param } = require('express-validator');
const predictionController = require('../controllers/predictionController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get(
  '/:locationId/wait',
  [param('locationId').isMongoId().withMessage('Invalid location ID')],
  validate,
  predictionController.getWaitTimePrediction
);

router.get(
  '/:locationId/crowd',
  [param('locationId').isMongoId().withMessage('Invalid location ID')],
  validate,
  predictionController.getCrowdPrediction
);

module.exports = router;