'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Trophy, GitPullRequest, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Image from 'next/image';

type Contributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  rank?: number;
  hasLoggedIn?: boolean;
  contributions?: number;
  pullRequests: {
    total: number;
    merged: number;
  };
};

// Add types for the API response
type UserResponse = {
  login: string;
  stats: {
    totalPRs: number;
    mergedPRs: number;
    contributions: number;
  };
};

export default function Leaderboard() {
  const { data: session, status } = useSession();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllLoggedInUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logged-in-users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = (await response.json()) as UserResponse[];
      
      // Sort users by merged PRs first, then total PRs
      const sortedUsers = users.sort((a, b) => {
        if (b.stats.mergedPRs !== a.stats.mergedPRs) {
          return b.stats.mergedPRs - a.stats.mergedPRs;
        }
        return b.stats.totalPRs - a.stats.totalPRs;
      });

      // Add ranks and use avatars.githubusercontent.com for images
      const rankedUsers = sortedUsers.map((user, index: number) => ({
        login: user.login,
        avatar_url: `https://avatars.githubusercontent.com/${user.login}`,
        html_url: `https://github.com/${user.login}`,
        rank: index + 1,
        hasLoggedIn: true,
        contributions: user.stats.contributions,
        pullRequests: {
          total: user.stats.totalPRs,
          merged: user.stats.mergedPRs,
        }
      }));

      setContributors(rankedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUserStats = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setRefreshing(true);
    try {
      // Force refresh stats from GitHub
      const response = await fetch('/api/logged-in-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh stats');
      }
    
      // Fetch updated data
      await fetchAllLoggedInUsers();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setRefreshing(false);
    }
  }, [session?.accessToken, fetchAllLoggedInUsers]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      refreshUserStats();
      fetchAllLoggedInUsers();

      const interval = setInterval(() => {
        if (session?.accessToken) {
          refreshUserStats();
          fetchAllLoggedInUsers();
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [status, session, refreshUserStats, fetchAllLoggedInUsers]);

  const getPositionStyle = (rank: number) => {
    switch(rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-amber-700 to-amber-800';
      default: return 'from-[#238636]/50 to-[#2ea043]/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/skillfest"
            className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to SkillFest</span>
          </Link>
          
          <button
            onClick={refreshUserStats}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#238636]/10 text-[#238636] hover:bg-[#238636]/20 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-[#238636] border-t-transparent rounded-full animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Refresh Stats</span>
              </>
            )}
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4 text-foreground">SkillFest Leaderboard</h1>
            <p className="text-[#8b949e]">Top contributors will be selected to join the club</p>
          </div>

          <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22]">
            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238636]" />
                </div>
              ) : contributors.length > 0 ? (
                contributors.map((contributor) => (
                  <a
                    key={contributor.login}
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                  >
                    <div className={`
                      absolute -inset-0.5 bg-gradient-to-r 
                      ${getPositionStyle(contributor.rank!)}
                      rounded-lg opacity-75 group-hover:opacity-100 transition duration-200
                      ${contributor.rank === 1 ? 'animate-pulse' : ''}
                    `} />
                    <div className="relative p-4 bg-[#161b22] rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-[#8b949e] w-8">
                          #{contributor.rank}
                        </div>
                        <Image 
                          src={contributor.avatar_url}
                          alt={contributor.login}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {contributor.login}
                            </span>
                            {contributor.rank === 1 && (
                              <Trophy className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[#8b949e]">
                            <div className="flex items-center gap-1">
                              <GitPullRequest className="w-4 h-4" />
                              <span>{contributor.pullRequests.merged}/{contributor.pullRequests.total} PRs</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              <span>{contributor.contributions} contributions</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {contributor.hasLoggedIn && (
                            <div className="text-xs px-2 py-1 rounded-full bg-[#238636]/20 text-[#238636] border border-[#238636]/20 mb-2">
                              Logged In
                            </div>
                          )}
                          {(contributor.rank !== undefined && contributor.rank <= 15) && (
                            <div className="text-xs px-2 py-1 rounded-full bg-[#238636]/20 text-[#238636] border border-[#238636]/20">
                              Qualifying
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-center py-12 text-[#8b949e]">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No contributors yet</p>
                  <p className="text-sm">Be the first to contribute!</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-[#238636]/10 to-transparent border border-[#238636]/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#238636]/10">
                <Star className="w-6 h-6 text-[#238636]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#238636] mb-2">Selection Criteria</h3>
                <div className="space-y-2 text-[#8b949e]">
                  <p>• Top 15 contributors will be selected</p>
                  <p>• Minimum 3 quality pull requests required</p>
                  <p>• Code quality and complexity considered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
