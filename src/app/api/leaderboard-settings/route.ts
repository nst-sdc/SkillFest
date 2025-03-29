import { NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase-config";

export async function GET() {
  try {
    console.log("Public API: Fetching leaderboard visibility");
    // Use the same path as the admin API
    const visibilityRef = ref(db, 'test/leaderboardVisible');
    const snapshot = await get(visibilityRef);
    
    if (snapshot.exists()) {
      const isVisible = snapshot.val();
      console.log("Public API: Retrieved visibility value:", isVisible);
      
      // Convert to boolean for the frontend
      return NextResponse.json({
        visible: isVisible === true,
        lastUpdated: new Date().toISOString()
      });
    } else {
      console.log("Public API: No visibility setting found, returning default");
      // Default to visible if no setting exists
      return NextResponse.json({
        visible: true,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Public API: Error fetching leaderboard visibility:", error);
    
    // Default to visible if there's an error
    return NextResponse.json({ 
      visible: true,
      lastUpdated: new Date().toISOString()
    });
  }
} 