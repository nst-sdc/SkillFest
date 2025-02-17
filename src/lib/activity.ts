import Activity from '@/models/Activity';
import { ObjectId } from 'mongodb';

export type ActivityType = 'login' | 'submission' | 'contribution' | 'admin_action';

interface LogActivityParams {
  userId: string | ObjectId;
  type: ActivityType;
  description: string;
  points?: number;
  metadata?: Record<string, any>;
}

export async function logActivity({
  userId,
  type,
  description,
  points = 0,
  metadata = {}
}: LogActivityParams) {
  try {
    const activity = await Activity.create({
      user: userId,
      type,
      description,
      points,
      metadata,
      timestamp: new Date()
    });

    // Update user points if applicable
    if (points > 0) {
      await Activity.aggregate([
        {
          $match: { user: new ObjectId(userId) }
        },
        {
          $group: {
            _id: '$user',
            totalPoints: { $sum: '$points' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            totalPoints: 1
          }
        }
      ]).then(async ([result]) => {
        if (result) {
          const User = Activity.db.model('User');
          await User.findByIdAndUpdate(userId, {
            $set: { points: result.totalPoints }
          });
        }
      });
    }

    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
}

// Point values for different activities
export const ACTIVITY_POINTS = {
  submission: 10,
  login: 1,
  contribution: 5
} as const;
