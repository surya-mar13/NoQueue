const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['waiting', 'called', 'served', 'cancelled', 'no_show'],
        message: '{VALUE} is not a valid status',
      },
      default: 'waiting',
      required: true,
    },
    position: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokenNumber: {
      type: String,
      required: [true, 'Token number is required'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    servedAt: {
      type: Date,
      default: null,
    },
    serviceDuration: {
      type: Number,
      default: null,
      min: 0,
    },
    hourOfDay: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    queueLengthAtJoin: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

queueEntrySchema.index({ location: 1, status: 1, joinedAt: 1 });
queueEntrySchema.index({ user: 1, status: 1 });
queueEntrySchema.index({ location: 1, dayOfWeek: 1, hourOfDay: 1, status: 1 });
queueEntrySchema.index({ joinedAt: 1 });

const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

module.exports = QueueEntry;
