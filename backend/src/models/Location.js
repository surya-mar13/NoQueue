const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [120, 'Location name cannot exceed 120 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['hospital', 'bank', 'government', 'restaurant', 'retail', 'other'],
        message: '{VALUE} is not a supported category',
      },
      default: 'other',
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'paused', 'closed'],
        message: '{VALUE} is not a valid queue status',
      },
      default: 'open',
    },
    avgServiceTime: {
      type: Number,
      required: [true, 'Default average service time (in minutes) is required'],
      min: [1, 'Average service time must be at least 1 minute'],
      max: [180, 'Average service time cannot exceed 180 minutes'],
      default: 10,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ status: 1 });
locationSchema.index({ category: 1 });
locationSchema.index({ name: 'text', address: 'text' });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
