import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/auth-options";

// Store active sessions in memory (this is just for development)
const activeUsers = new Map<string, { login: string, lastActive: Date }>();

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current user's GitHub profile
    const githubResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!githubResponse.ok) {
      throw new Error('Failed to fetch GitHub profile');
    }

    const currentUser = await githubResponse.json();
    
    // Update the active users map
    activeUsers.set(currentUser.id.toString(), {
      login: currentUser.login,
      lastActive: new Date()
    });

    // Clean up inactive users (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const [id, userData] of activeUsers.entries()) {
      if (userData.lastActive < twentyFourHoursAgo) {
        activeUsers.delete(id);
      }
    }

    // Return all active users
    return NextResponse.json(
      Array.from(activeUsers.values()).map(user => ({ login: user.login }))
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const githubResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!githubResponse.ok) {
      throw new Error('Failed to fetch GitHub profile');
    }

    const githubUser = await githubResponse.json();
    activeUsers.set(githubUser.id.toString(), {
      login: githubUser.login,
      lastActive: new Date()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}
