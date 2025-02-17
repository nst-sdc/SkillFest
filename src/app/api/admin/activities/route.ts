import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query: any = {};
    
    if (type) query.type = type;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .populate('user', 'name email githubUsername')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ timestamp: -1 });

    const total = await Activity.countDocuments(query);

    // Get activity statistics
    const stats = await Activity.aggregate([
      { $match: query },
      { $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' }
      }}
    ]);

    return NextResponse.json({
      activities,
      stats,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// Endpoint to get login history
export async function POST(req: Request) {
  try {
    const { userId, startDate, endDate } = await req.json();
    
    await connectDB();
    
    const query: any = {
      type: 'login',
    };
    
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const loginHistory = await Activity.find(query)
      .populate('user', 'name email githubUsername')
      .sort({ timestamp: -1 });

    return NextResponse.json({ loginHistory });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    );
  }
}
