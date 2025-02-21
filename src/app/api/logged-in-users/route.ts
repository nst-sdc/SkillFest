import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/auth-options";
import { addUserToDatabase, getActiveUsers } from "@/lib/firebase";

// Add types for GitHub API responses
type GitHubRepo = {
  name: string;
};

type GitHubPR = {
  id: number;
  state: string;
};

type GitHubStats = {
  author?: {
    login: string;
  };
  total: number;
  weeks: Array<{
    a: number;
    d: number;
    c: number;
  }>;
};

// Add type for weekly stats
type WeeklyStats = {
  additions: number;
  deletions: number;
  commits: number;
};

export async function GET() {
  try {
    const activeUsers = await getActiveUsers();
    // Return all users without filtering
    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    console.log("No session found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const githubResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!githubResponse.ok) {
      throw new Error('Failed to fetch GitHub profile');
    }

    const githubUser = await githubResponse.json();
    console.log("GitHub user fetched:", githubUser.login);

    // Get all repositories in the organization
    const reposResponse = await fetch('https://api.github.com/orgs/nst-sdc/repos', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
    });

    const repos = (await reposResponse.json()) as GitHubRepo[];
    console.log("Found repositories:", repos.map(r => r.name));

    let totalContributions = 0;
    let allPRs: GitHubPR[] = [];

    // Get PRs using search API for more reliable results
    const searchPRsResponse = await fetch(
      `https://api.github.com/search/issues?q=type:pr+author:${githubUser.login}+org:nst-sdc`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache',
        },
      }
    );

    if (searchPRsResponse.ok) {
      const searchResult = await searchPRsResponse.json();
      allPRs = searchResult.items;
      console.log(`Found ${allPRs.length} total PRs through search`);
    }

    // Count merged PRs separately to ensure accuracy
    const mergedPRsResponse = await fetch(
      `https://api.github.com/search/issues?q=type:pr+author:${githubUser.login}+org:nst-sdc+is:merged`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache',
        },
      }
    );

    let mergedPRsCount = 0;
    if (mergedPRsResponse.ok) {
      const mergedResult = await mergedPRsResponse.json();
      mergedPRsCount = mergedResult.total_count;
      console.log(`Found ${mergedPRsCount} merged PRs`);
    }

    const prStats = {
      totalPRs: allPRs.length,
      mergedPRs: mergedPRsCount,
    };
    console.log("Final PR Stats:", prStats);

    // Get contributions using the statistics API
    for (const repo of repos) {
      try {
        console.log(`Fetching stats for ${repo.name}...`);
        const statsResponse = await fetch(
          `https://api.github.com/repos/nst-sdc/${repo.name}/stats/contributors`,
          {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Cache-Control': 'no-cache',
            },
          }
        );

        if (statsResponse.ok) {
          const stats = await statsResponse.json() as GitHubStats[];
          
          if (Array.isArray(stats)) {
            const userStats = stats.find(stat => stat.author?.login === githubUser.login);
            if (userStats) {
              totalContributions += userStats.total;
              
              const weeklyStats = userStats.weeks.map((week) => ({
                additions: week.a,
                deletions: week.d,
                commits: week.c
              } as WeeklyStats));
              
              console.log(`Found ${userStats.total} contributions in ${repo.name}`);
              console.log(`Weekly breakdown for ${repo.name}:`, weeklyStats);
            } else {
              console.log(`No contributions found for ${githubUser.login} in ${repo.name}`);
            }
          } else if (statsResponse.status === 202) {
            // GitHub is computing the statistics
            console.log(`GitHub is computing statistics for ${repo.name}. Try again in a moment.`);
          } else {
            console.log(`Unexpected stats format for ${repo.name}:`, stats);
          }
        } else {
          console.error(`Failed to fetch stats for ${repo.name}: ${statsResponse.status}`);
        }
      } catch (error) {
        console.error(`Error fetching stats for ${repo.name}:`, error);
      }
    }

    const userStats = {
      login: githubUser.login,
      lastActive: new Date(),
      stats: {
        totalPRs: prStats.totalPRs,
        mergedPRs: prStats.mergedPRs,
        contributions: totalContributions,
      }
    };
    
    console.log("Attempting to update Firebase with stats:", userStats);
    
    // Add user to Firebase with stats



    // const dbUpdateResult = await addUserToDatabase(githubUser.id.toString(), userStats);

    const dbUpdateResult = await addUserToDatabase(githubUser.login, userStats);
    console.log("Firebase update result:", dbUpdateResult);
    
    if (!dbUpdateResult) {
      throw new Error("Failed to update Firebase database");
    }
    
    return NextResponse.json({ 
      success: true,
      stats: {
        prs: prStats,
        contributions: totalContributions
      }
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ 
      error: "Failed to add user",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
