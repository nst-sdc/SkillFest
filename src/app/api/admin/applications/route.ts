import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth-options";
import { getAllApplications, getApplicationById } from "@/lib/firebase-fresher";

export async function GET(request: Request) {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (id) {
      // Get a specific application
      const application = await getApplicationById(id);
      
      if (!application) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }
      
      return NextResponse.json(application);
    } else {
      // Get all applications
      const applications = await getAllApplications();
      return NextResponse.json(applications);
    }
  } catch (error) {
    console.error("Error fetching applications:", error);
    
    return NextResponse.json({ 
      error: "Failed to fetch applications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 