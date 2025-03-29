import { NextResponse } from "next/server";
import { getUserPullRequests, getActiveUsers } from "@/lib/firebase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth-options";

// Define a type for GitHub PR items
interface GitHubPRItem {
  id: number;
  title: string;
  html_url: string;
  created_at: string;
  closed_at?: string;
  repository_url: string;
}

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
      
      // Fetch merged PRs with pagination
      const fetchAllPRs = async (state: 'merged' | 'open') => {
        let page = 1;
        let allPRs: GitHubPRItem[] = [];
        let hasMorePages = true;
        
        while (hasMorePages && page <= 5) { // Limit to 5 pages (500 PRs) to avoid rate limits
          const query = state === 'merged' 
            ? `https://api.github.com/search/issues?q=type:pr+author:${username}+is:merged&per_page=100&page=${page}`
            : `https://api.github.com/search/issues?q=type:pr+author:${username}+is:open&per_page=100&page=${page}`;
          
          const response = await fetch(query, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Cache-Control': 'no-cache',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              allPRs = [...allPRs, ...data.items];
              // If we got fewer than 100 items, we've reached the end
              hasMorePages = data.items.length === 100;
              page++;
            } else {
              hasMorePages = false;
            }
          } else {
            hasMorePages = false;
          }
        }
        
        return allPRs;
      };
      
      // Fetch both merged and open PRs
      const [mergedPRsItems, openPRsItems] = await Promise.all([
        fetchAllPRs('merged'),
        fetchAllPRs('open')
      ]);
      
      const githubPRs = [];
      
      // Process merged PRs
      for (const item of mergedPRsItems) {
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
      
      // Process open PRs
      for (const item of openPRsItems) {
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