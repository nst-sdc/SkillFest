import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getJwtSecret } from '@/lib/auth-config';

// Middleware to verify JWT token
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

export async function GET(req: Request) {
  try {
    await connectDB();

    const headersList = headers();
    const token = headersList.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get leaderboard data
    const leaderboard = await User.find({})
      .select('username contributions activities -_id')
      .sort({ contributions: -1 })
      .limit(100);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin endpoint to update user contributions
export async function POST(req: Request) {
  try {
    const headersList = headers();
    const token = headersList.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, points, activityType, description } = await req.json();

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user contributions and add activity
    user.contributions += points;
    user.activities.push({
      type: activityType,
      description,
      points,
      timestamp: new Date(),
    });

    await user.save();

    return NextResponse.json({
      message: 'Contribution updated successfully',
      user: {
        username: user.username,
        contributions: user.contributions,
      },
    });
  } catch (error) {
    console.error('Update contribution error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
