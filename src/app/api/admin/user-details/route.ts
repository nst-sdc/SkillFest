import { NextResponse } from "next/server";
import { getUserPullRequests, getActiveUsers } from "@/lib/firebase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth-options";

export async function GET(request: Request) {
  console.log("User details API called");
  
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    console.log("No session found, returning unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  
  console.log(`Requested username: ${username}`);
  
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }
  
  try {
    // Get user stats first to verify the user exists
    const users = await getActiveUsers();
    const userStats = users.find(user => user.login === username);
    
    if (!userStats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Try to get PRs from Firebase
    let pullRequests = await getUserPullRequests(username);
    console.log(`Retrieved ${pullRequests.length} PRs from Firebase for ${username}`);
    
    // If no PRs found in Firebase, try to fetch directly from GitHub
    if (pullRequests.length === 0 && session.accessToken) {
      console.log(`No PRs found in Firebase, fetching from GitHub for ${username}`);
      
      // Fetch merged PRs
      const mergedPRsResponse = await fetch(
        `https://api.github.com/search/issues?q=type:pr+author:${username}+is:merged&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache',
          },
        }
      );
      
      // Fetch open PRs
      const openPRsResponse = await fetch(
        `https://api.github.com/search/issues?q=type:pr+author:${username}+is:open&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache',
          },
        }
      );
      
      const githubPRs = [];
      
      if (mergedPRsResponse.ok) {
        const mergedPRsData = await mergedPRsResponse.json();
        for (const item of mergedPRsData.items) {
          const isOrg = item.repository_url.includes('nst-sdc');
          githubPRs.push({
            id: item.id,
            title: item.title,
            url: item.html_url,
            state: 'merged',
            created_at: item.created_at,
            merged_at: item.closed_at,
            isOrg
          });
        }
      }
      
      if (openPRsResponse.ok) {
        const openPRsData = await openPRsResponse.json();
        for (const item of openPRsData.items) {
          const isOrg = item.repository_url.includes('nst-sdc');
          githubPRs.push({
            id: item.id,
            title: item.title,
            url: item.html_url,
            state: 'open',
            created_at: item.created_at,
            isOrg
          });
        }
      }
      
      console.log(`Fetched ${githubPRs.length} PRs directly from GitHub`);
      pullRequests = githubPRs;
    }
    
    // Return the data
    return NextResponse.json({
      login: username,
      avatar_url: `https://avatars.githubusercontent.com/${username}`,
      pullRequests: pullRequests
    });
  } catch (error) {
    console.error("Error in user details API:", error);
    
    return NextResponse.json({ 
      error: "Failed to fetch user details",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 