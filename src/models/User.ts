import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  contributions: {
    type: Number,
    default: 0,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
  }],
  activities: [{
    type: {
      type: String,
      required: true,
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    points: Number,
  }],
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema);
