const crypto = require('crypto');

/**
 * Generates an alphanumeric human-readable token number
 * Format: [PREFIX]-[3-DIGIT-RANDOM] e.g., A-104, B-892
 */
const generateTokenNumber = (category = 'other') => {
  const prefixMap = {
    hospital: 'H',
    bank: 'B',
    government: 'G',
    restaurant: 'R',
    retail: 'S',
    other: 'Q',
  };

  const prefix = prefixMap[category.toLowerCase()] || 'Q';
  const randomNum = Math.floor(100 + Math.random() * 900);
  const randomSuffix = crypto.randomBytes(1).toString('hex').toUpperCase().slice(0, 1);

  return `${prefix}-${randomNum}${randomSuffix}`;
};

module.exports = {
  generateTokenNumber,
};