import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getJwtSecret } from '@/lib/auth-config';

const verifyAdmin = (token: string) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    return decoded.isAdmin;
  } catch (error) {
    return false;
  }
};

export async function GET(req: Request) {
  try {
    const headersList = headers();
    const token = headersList.get('authorization')?.split(' ')[1];

    if (!token || !verifyAdmin(token)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all users with their activity data
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    const userStats = {
      totalUsers: users.length,
      activeUsers: users.filter(user => 
        new Date(user.lastLogin).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length,
      totalContributions: users.reduce((sum, user) => sum + user.contributions, 0),
      users: users.map(user => ({
        username: user.username,
        email: user.email,
        contributions: user.contributions,
        lastLogin: user.lastLogin,
        loginHistory: user.loginHistory,
        activities: user.activities,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      })),
    };

    return NextResponse.json(userStats);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
