import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth-options";
import { getActiveUsers, addUserToDatabase } from "@/lib/firebase";
import { calculatePoints, getContributionLevel } from "@/lib/points-calculator";

export async function POST() {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Get all users
    const users = await getActiveUsers();
    const updatedUsers = [];
    
    // Recalculate points for each user
    for (const user of users) {
      const contributionData = {
        totalPRs: user.stats.totalPRs || 0,
        mergedPRs: user.stats.mergedPRs || 0,
        contributions: user.stats.contributions || 0,
        orgPRs: user.stats.orgPRs || 0,
        orgMergedPRs: user.stats.orgMergedPRs || 0
      };
      
      // Calculate points
      const points = calculatePoints(contributionData);
      const level = getContributionLevel(points);
      
      // Update user stats
      const updatedUser = {
        ...user,
        stats: {
          ...user.stats,
          points,
          level
        }
      };
      
      // Update in database
      await addUserToDatabase(user.login, updatedUser);
      updatedUsers.push(updatedUser);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated points for ${updatedUsers.length} users`,
      users: updatedUsers.map(u => ({
        login: u.login,
        points: u.stats.points,
        level: u.stats.level
      }))
    });
  } catch (error) {
    console.error("Error recalculating points:", error);
    
    return NextResponse.json({ 
      error: "Failed to recalculate points",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 