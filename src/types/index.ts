import { JwtPayload } from 'jsonwebtoken';

export interface UserDocument {
  _id: string;
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  contributions: number;
  lastLogin: Date;
  loginHistory: Array<{
    timestamp: Date;
    ipAddress: string;
  }>;
  activities: Array<{
    type: string;
    description: string;
    timestamp: Date;
    points: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtUser extends JwtPayload {
  userId: string;
  isAdmin: boolean;
}

export interface ActivityDocument {
  user: string | UserDocument;
  type: 'login' | 'contribution' | 'submission';
  description: string;
  points: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface SubmissionDocument {
  user: string | UserDocument;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  points: number;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string | UserDocument;
  feedback?: string;
}

export interface DashboardData {
  totalUsers?: number;
  activeUsersLast7Days?: number;
  totalSubmissions?: number;
  totalActivities?: number;
  activities?: Array<ActivityDocument>;
  submissions?: Array<SubmissionDocument>;
}
