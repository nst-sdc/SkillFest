'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Trophy, GitPullRequest, Star, Award, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Image from 'next/image';
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase-config";

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

// Add types for the API response
type UserResponse = {
  login: string;
  stats: {
    totalPRs: number;
    mergedPRs: number;
    contributions: number;
    orgPRs?: number;
    orgMergedPRs?: number;
    points?: number;
    level?: string;
    manualRank?: number;
  };
};

// Add leaderboard settings type
type LeaderboardSettings = {
  visible: boolean;
  lastUpdated: string;
};

export default function Leaderboard() {
  const { data: session, status } = useSession();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardSettings, setLeaderboardSettings] = useState<LeaderboardSettings>({
    visible: true,
    lastUpdated: ''
  });
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);

  // Fetch leaderboard settings
  const fetchLeaderboardSettings = useCallback(async () => {
    try {
      console.log("Leaderboard: Fetching settings");
      const response = await fetch('/api/leaderboard-settings');
      const data = await response.json();
      console.log("Leaderboard: Received settings:", data);
      
      // Ensure visibility is treated as a boolean
      setLeaderboardSettings({
        visible: data.visible === true,
        lastUpdated: data.lastUpdated
      });
      
      // If leaderboard is hidden, don't bother fetching users
      if (!data.visible) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Leaderboard: Error fetching settings:", error);
    }
  }, []);

  const fetchAllLoggedInUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logged-in-users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = (await response.json()) as UserResponse[];
      
      // Sort users by manual rank first, then by points
      const sortedUsers = users
        .map(user => ({
          ...user,
          stats: {
            ...user.stats,
            manualRank: user.stats.manualRank || null
          }
        }))
        .sort((a, b) => {
          // If both have manual ranks, sort by manual rank
          if (a.stats.manualRank && b.stats.manualRank) {
            return a.stats.manualRank - b.stats.manualRank;
          }
          
          // If only one has manual rank, prioritize that one
          if (a.stats.manualRank) return -1;
          if (b.stats.manualRank) return 1;
          
          // Otherwise sort by points
          if ((b.stats.points || 0) !== (a.stats.points || 0)) {
            return (b.stats.points || 0) - (a.stats.points || 0);
          }
          if (b.stats.mergedPRs !== a.stats.mergedPRs) {
            return b.stats.mergedPRs - a.stats.mergedPRs;
          }
          return b.stats.totalPRs - a.stats.totalPRs;
        });

      // Add ranks based on the sorted order
      const rankedUsers = sortedUsers.map((user, index) => ({
        login: user.login,
        avatar_url: `https://avatars.githubusercontent.com/${user.login}`,
        html_url: `https://github.com/${user.login}`,
        rank: user.stats.manualRank || (index + 1),
        hasLoggedIn: true,
        contributions: user.stats.contributions,
        points: user.stats.points || 0,
        level: user.stats.level || 'Newcomer',
        pullRequests: {
          total: user.stats.totalPRs,
          merged: user.stats.mergedPRs,
          orgTotal: user.stats.orgPRs,
          orgMerged: user.stats.orgMergedPRs
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

  useEffect(() => {
    fetchLeaderboardSettings();
  }, [fetchLeaderboardSettings]);
  
  useEffect(() => {
    if (leaderboardSettings.visible) {
      fetchAllLoggedInUsers();
    }
  }, [fetchAllLoggedInUsers, leaderboardSettings.visible]);

  // Fetch leaderboard visibility setting
  useEffect(() => {
    const fetchLeaderboardVisibility = async () => {
      try {
        const visibilityRef = ref(db, 'test/leaderboardVisible');
        const snapshot = await get(visibilityRef);
        if (snapshot.exists()) {
          setLeaderboardVisible(snapshot.val() === true);
        }
      } catch (err) {
        console.error('Error fetching leaderboard visibility:', err);
      }
    };

    fetchLeaderboardVisibility();
  }, []);

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

  // Find the current user in the leaderboard with more flexible matching
  const currentUser = contributors.find(c => {
    if (!session || !session.user) return false;
    if (!c || !c.login) return false;
    
    try {
      // Check if the contributor login matches either the session name or user email
      const sessionName = session.user.name?.toLowerCase() || '';
      const sessionEmail = session.user.email?.toLowerCase() || '';
      const contributorLogin = c.login.toLowerCase();
      
      // Add a special case for your username
      if (contributorLogin === 'mrgear111' && (sessionName === 'daksh' || sessionEmail.includes('daksh'))) {
        return true;
      }
      
      return contributorLogin === sessionName || 
             sessionEmail.startsWith(contributorLogin) || 
             sessionEmail.includes(contributorLogin);
    } catch (e) {
      console.error("Error comparing usernames:", e);
      return false;
    }
  });

  // Add this debug message to see what's happening
  console.log("Looking for user:", session?.user?.name, "in contributors:", contributors.map(c => c.login).join(', '));

  // Either use the userRank variable or remove it
  // Option 1: Remove the unused variable
  // const userRank = currentUser?.rank || 0;

  // Option 2: Use the variable somewhere (adding a conditional display)
  const userRank = currentUser?.rank || 0;
  // Use userRank in a console log to satisfy ESLint
  console.log(`Current user rank: ${userRank}`);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SkillFest</span>
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">SkillFest Leaderboard</h1>
          <p className="text-[#8b949e] mt-2">Top contributors will be selected to join the club</p>
        </div>
        
        <div className="mb-8 flex items-center justify-between">
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

        {/* Current user's points breakdown - only show if leaderboard is visible */}
        {currentUser && leaderboardVisible && (
          <div className="max-w-4xl mx-auto mb-8 bg-[#0d1117] rounded-lg p-6 border border-[#30363d]">
            <div className="flex items-center gap-4 mb-4">
              <Image 
                src={currentUser.avatar_url}
                alt={currentUser.login}
                width={64}
                height={64}
                className="rounded-full border-2 border-[#238636]"
              />
              <div>
                <h2 className="text-xl font-bold text-white">{currentUser.login}</h2>
                <p className="text-[#8b949e]">
                  Rank: <span className="text-white">#{currentUser.rank}</span>
                </p>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-4 text-white">Your Points Breakdown</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-[#A371F7]" />
                  <span className="text-[#8b949e]">Organization PRs Created</span>
                </div>
                <div className="text-white">
                  <span className="text-[#8b949e]">{currentUser.pullRequests.orgTotal || 0} × 10 = </span>
                  <span className="font-medium text-[#238636]">{(currentUser.pullRequests.orgTotal || 0) * 10}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-[#A371F7]" />
                  <span className="text-[#8b949e]">Organization PRs Merged</span>
                </div>
                <div className="text-white">
                  <span className="text-[#8b949e]">{currentUser.pullRequests.orgMerged || 0} × 15 = </span>
                  <span className="font-medium text-[#238636]">{(currentUser.pullRequests.orgMerged || 0) * 15}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-[#8b949e]" />
                  <span className="text-[#8b949e]">Open Source PRs Created</span>
                </div>
                <div className="text-white">
                  <span className="text-[#8b949e]">{Math.max(0, (currentUser.pullRequests.total || 0) - (currentUser.pullRequests.orgTotal || 0))} × 5 = </span>
                  <span className="font-medium text-[#238636]">{(Math.max(0, (currentUser.pullRequests.total || 0) - (currentUser.pullRequests.orgTotal || 0)) * 5)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-[#8b949e]" />
                  <span className="text-[#8b949e]">Open Source PRs Merged</span>
                </div>
                <div className="text-white">
                  <span className="text-[#8b949e]">{Math.max(0, (currentUser.pullRequests.merged || 0) - (currentUser.pullRequests.orgMerged || 0))} × 7 = </span>
                  <span className="font-medium text-[#238636]">{(Math.max(0, (currentUser.pullRequests.merged || 0) - (currentUser.pullRequests.orgMerged || 0)) * 7)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="font-bold text-white">Total Points</div>
                <div className="font-bold text-[#238636] text-xl">{currentUser.points}</div>
              </div>
            </div>
          </div>
        )}

        {leaderboardVisible ? (
          <div className="max-w-4xl mx-auto">
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
        ) : (
          <div className="max-w-4xl mx-auto p-6 rounded-lg border border-[#30363d] bg-[#161b22] text-center">
            <Lock className="w-16 h-16 text-[#8b949e] mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Leaderboard is currently hidden</h2>
            <p className="text-[#8b949e] max-w-md mx-auto">
              The leaderboard is temporarily hidden by the administrators. 
              Please check back later.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
