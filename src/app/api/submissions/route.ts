/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Activity from '@/models/Activity';
import { z } from 'zod';

// Validation schema for submission data
const submissionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  logoUrl: z.string().url('Invalid URL').regex(
    /^https?:\/\/(drive\.google\.com|www\.icloud\.com|github\.com|dropbox\.com|onedrive\.live\.com)/,
    'URL must be from a supported cloud storage provider'
  ),
  platform: z.enum(['google_drive', 'icloud', 'github', 'dropbox', 'onedrive'])
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const data = await req.json();
    
    // Validate submission data
    const validatedData = submissionSchema.parse(data);

    // Create submission
    const submission = await Submission.create({
      user: token.sub,
      username: token.name || 'Anonymous',
      ...validatedData
    });

    // Record activity
    await Activity.create({
      user: token.sub,
      type: 'submission',
      description: `Submitted logo: ${validatedData.title}`,
      points: 10, // Award points for submission
    });

    return NextResponse.json({ submission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'approved';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    const query = { status };
    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('username title description logoUrl platform createdAt');

    const total = await Submission.countDocuments(query);

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
