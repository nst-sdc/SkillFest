import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/(drive\.google\.com|www\.icloud\.com|github\.com|dropbox\.com|onedrive\.live\.com)/.test(v);
      },
      message: 'Please provide a valid cloud storage URL (Google Drive, iCloud, GitHub, Dropbox, or OneDrive)'
    }
  },
  platform: {
    type: String,
    enum: ['google_drive', 'icloud', 'github', 'dropbox', 'onedrive'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp on save
submissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
