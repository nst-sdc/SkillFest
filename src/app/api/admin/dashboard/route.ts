import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activity from '@/models/Activity';
import Submission from '@/models/Submission';
import { getJwtSecret } from '@/lib/auth-config';

export async function GET(req: Request) {
  try {
    const headersList = headers();
    const token = headersList.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'overview';

    let data: any = {};

    // Get overview statistics
    if (view === 'overview') {
      const [userCount, activeUsers, submissions, activities] = await Promise.all([
        User.countDocuments(),
        User.distinct('_id', { 
          lastLogin: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          }
        }),
        Submission.countDocuments(),
        Activity.countDocuments()
      ]);

      data = {
        totalUsers: userCount,
        activeUsersLast7Days: activeUsers.length,
        totalSubmissions: submissions,
        totalActivities: activities
      };
    }

    // Get recent activities
    else if (view === 'activities') {
      data.activities = await Activity.find()
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('user', 'username email');
    }

    // Get recent submissions
    else if (view === 'submissions') {
      data.submissions = await Submission.find()
        .sort({ submittedAt: -1 })
        .limit(50)
        .populate('user', 'username email')
        .populate('reviewedBy', 'username');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const headersList = headers();
    const token = headersList.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, action, data } = await req.json();

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'updateRole') {
      user.isAdmin = data.isAdmin;
      await user.save();
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
