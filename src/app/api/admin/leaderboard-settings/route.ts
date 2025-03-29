import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth-options";
import { ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase-config";

// GET endpoint to retrieve current leaderboard settings
export async function GET() {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log("Admin API: Fetching leaderboard visibility");
    // Use a very simple path with just a single value
    const visibilityRef = ref(db, 'test/leaderboardVisible');
    const snapshot = await get(visibilityRef);
    
    if (snapshot.exists()) {
      const isVisible = snapshot.val();
      console.log("Admin API: Retrieved visibility:", isVisible);
      return NextResponse.json({
        visible: isVisible === true,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Default settings if none exist
      const defaultVisible = true;
      console.log("Admin API: No visibility setting found, setting default:", defaultVisible);
      await set(visibilityRef, defaultVisible);
      return NextResponse.json({
        visible: defaultVisible,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Admin API: Error fetching leaderboard visibility:", error);
    
    return NextResponse.json({ 
      error: "Failed to fetch leaderboard settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// POST endpoint to update leaderboard settings
export async function POST(request: Request) {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const settings = await request.json();
    console.log("Admin API: Received settings to save:", settings);
    
    // Use a very simple path
    const visibilityRef = ref(db, 'test/leaderboardVisible');
    
    // Convert to boolean explicitly
    const visibleValue = Boolean(settings.visible);
    
    console.log("Admin API: Saving visibility as:", visibleValue);
    
    // Force set the value, creating it if it doesn't exist
    await set(visibilityRef, visibleValue);
    
    return NextResponse.json({ 
      success: true, 
      message: "Leaderboard visibility updated successfully",
      data: {
        visible: visibleValue,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Admin API: Error updating leaderboard visibility:", error);
    
    return NextResponse.json({ 
      error: "Failed to update leaderboard settings",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 