import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['login', 'submission', 'contribution'],
    required: true,
  },
  description: String,
  points: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

// Index for efficient querying
activitySchema.index({ user: 1, type: 1, timestamp: -1 });

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema);
