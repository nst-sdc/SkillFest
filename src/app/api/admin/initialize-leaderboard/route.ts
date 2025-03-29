import { NextResponse } from "next/server";
import { ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase-config";

// This endpoint will initialize the leaderboard visibility setting
export async function GET() {
  try {
    console.log("Initializing leaderboard visibility setting");
    
    // Use the "test" path which already has permissions
    const visibilityRef = ref(db, 'test/leaderboardVisible');
    
    // Check if it already exists
    const snapshot = await get(visibilityRef);
    
    if (snapshot.exists()) {
      console.log("Leaderboard visibility setting already exists:", snapshot.val());
      return NextResponse.json({
        success: true,
        message: "Leaderboard visibility setting already exists",
        value: snapshot.val()
      });
    } else {
      // Create the setting with a default value of true (visible)
      await set(visibilityRef, true);
      console.log("Created leaderboard visibility setting with default value: true");
      
      return NextResponse.json({
        success: true,
        message: "Leaderboard visibility setting initialized",
        value: true
      });
    }
  } catch (error) {
    console.error("Error initializing leaderboard visibility setting:", error);
    
    return NextResponse.json({
      error: "Failed to initialize leaderboard visibility setting",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 