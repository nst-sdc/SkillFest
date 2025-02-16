import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Here you would fetch from your database
    // For now, we'll return a mock list
    const loggedInUsers = [
      // Using GitHub login instead of display name
      { login: session.user?.email?.split('@')[0] || session.user?.name }
    ];

    return NextResponse.json(loggedInUsers);
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
