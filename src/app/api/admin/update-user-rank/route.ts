import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth-options";
import { ref, update } from "firebase/database";
import { db } from "@/lib/firebase-config";

export async function POST(request: Request) {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { username, rank } = await request.json();
    console.log(`Admin API: Updating rank for ${username} to ${rank}`);
    
    // Use the test path for storing manual ranks
    const userRef = ref(db, `test/manualRanks/${username}`);
    
    // If rank is null, remove the manual rank
    if (rank === null) {
      await update(userRef, { manualRank: null });
      console.log(`Admin API: Removed manual rank for ${username}`);
    } else {
      // Otherwise, set the manual rank
      await update(userRef, { manualRank: rank });
      console.log(`Admin API: Set manual rank for ${username} to ${rank}`);
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