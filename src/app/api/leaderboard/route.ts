/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activity from '@/models/Activity';

export async function GET() {
  try {
    await connectDB();
    
    // Get top users by points
    const leaderboard = await User.find({})
      .select('name points githubUsername')
      .sort({ points: -1 })
      .limit(100);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectDB();
    
    // Update points (this would typically be called by other parts of the application)
    const activities = await Activity.aggregate([
      { $group: {
        _id: '$user',
        totalPoints: { $sum: '$points' }
      }}
    ]);

    for (const activity of activities) {
      await User.findByIdAndUpdate(activity._id, {
        $set: { points: activity.totalPoints }
      });
    }

    return NextResponse.json({ message: 'Leaderboard updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}
