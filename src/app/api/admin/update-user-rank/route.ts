import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth-options";
import { ref, update, get } from "firebase/database";
import { db } from "@/lib/firebase-config";

export async function POST(request: Request) {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { username, rank, points } = await request.json();
    console.log(`Admin API: Updating rank for ${username} to ${rank}`);
    
    // Get existing data first
    const userRef = ref(db, `test/manualRanks/${username}`);
    const snapshot = await get(userRef);
    const existingData = snapshot.exists() ? snapshot.val() : {};
    
    // Update with new data
    const updates = {
      ...existingData,
      manualRank: rank,
      points: points !== undefined ? points : existingData.points, // Only update points if provided
      updatedAt: new Date().toISOString()
    };
    
    await update(userRef, updates);
    
    // Also update the user's points in the main users collection if points were provided
    if (points !== undefined) {
      const userStatsRef = ref(db, `users/${username}/stats`);
      await update(userStatsRef, { points });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `User rank for ${username} updated successfully`,
      data: { username, rank }
    });
  } catch (error) {
    console.error("Admin API: Error updating user rank:", error);
    
    return NextResponse.json({ 
      error: "Failed to update user rank",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 