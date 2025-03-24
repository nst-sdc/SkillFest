'use client';

import { ArrowLeft, Trophy, GitPullRequest, Star, Award } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Image from 'next/image';
import { subscribeToUsers } from '@/lib/firebase';

type UserStats = {
  login: string;
  stats?: {
    totalPRs: number;
    mergedPRs: number;
    contributions: number;
    orgPRs?: number;
    orgMergedPRs?: number;
    points?: number;
    level?: string;
  };
};

type Contributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  rank?: number;
  hasLoggedIn?: boolean;
  contributions?: number;
  points?: number;
  level?: string;
  pullRequests: {
    total: number;
    merged: number;
    orgTotal?: number;
    orgMerged?: number;
  };
};

export default function Leaderboard() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const processUsers = useCallback((users: UserStats[]) => {
    const sortedUsers = users
      .filter(user => user.stats) // Filter out users without stats
      .sort((a, b) => {
        const pointsA = a.stats?.points || 0;
        const pointsB = b.stats?.points || 0;
        const mergedPRsA = a.stats?.mergedPRs || 0;
        const mergedPRsB = b.stats?.mergedPRs || 0;
        const totalPRsA = a.stats?.totalPRs || 0;
        const totalPRsB = b.stats?.totalPRs || 0;

        if (pointsB !== pointsA) {
          return pointsB - pointsA;
        }
        if (mergedPRsB !== mergedPRsA) {
          return mergedPRsB - mergedPRsA;
        }
        return totalPRsB - totalPRsA;
      });

    return sortedUsers.map((user, index) => ({
      login: user.login,
      avatar_url: `https://avatars.githubusercontent.com/${user.login}`,
      html_url: `https://github.com/${user.login}`,
      rank: index + 1,
      hasLoggedIn: true,
      contributions: user.stats?.contributions || 0,
      points: user.stats?.points || 0,
      level: user.stats?.level || 'Newcomer',
      pullRequests: {
        total: user.stats?.totalPRs || 0,
        merged: user.stats?.mergedPRs || 0,
        orgTotal: user.stats?.orgPRs,
        orgMerged: user.stats?.orgMergedPRs
      }
    }));
  }, []);

  const fetchAllLoggedInUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logged-in-users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = await response.json();
      const processedUsers = processUsers(users);
      setContributors(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [processUsers]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllLoggedInUsers();
    setRefreshing(false);
  }, [fetchAllLoggedInUsers]);

  // Single useEffect for setting up real-time updates
  useEffect(() => {
    // Initial fetch
    fetchAllLoggedInUsers();

    // Set up real-time listener
    const unsubscribe = subscribeToUsers((users) => {
      const processedUsers = processUsers(users);
      setContributors(processedUsers);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [fetchAllLoggedInUsers, processUsers]);

  const getPositionStyle = (rank: number) => {
    switch(rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-amber-700 to-amber-800';
      default: return 'from-[#238636]/50 to-[#2ea043]/50';
    }
  };

  // Add a helper function to get level color
  function getLevelColor(level: string): string {
    switch (level) {
      case 'Expert': return 'text-purple-400';
      case 'Advanced': return 'text-blue-400';
      case 'Intermediate': return 'text-green-400';
      case 'Beginner': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  }

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
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className={`px-4 py-2 rounded-lg text-sm ${
              refreshing || loading
                ? 'bg-[#30363d] text-[#8b949e]'
                : 'bg-[#238636] text-white hover:bg-[#2ea043]'
            } transition-colors duration-200`}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
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
                              <span>{contributor.points} points</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              <span className={getLevelColor(contributor.level || 'Newcomer')}>
                                {contributor.level}
                              </span>
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
