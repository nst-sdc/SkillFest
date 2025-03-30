import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/auth-options";
import { ref, update } from "firebase/database";
import { db } from "@/lib/firebase-config";

export async function POST(request: Request) {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Validate status
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    
    // Update the application status in test/applications path
    const applicationRef = ref(db, `test/applications/${id}`);
    await update(applicationRef, { 
      status,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Application status updated successfully`,
      data: { id, status }
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    
    return NextResponse.json({ 
      error: "Failed to update application status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 