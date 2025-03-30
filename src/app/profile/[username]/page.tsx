'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getUserProfile } from "@/lib/firebase";
import type { UserProfile } from "@/lib/firebase";
import Link from "next/link";
import { ArrowLeft, GitPullRequest, GitMerge, Trophy } from "lucide-react";
import Image from "next/image";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase-config";

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (typeof username !== 'string') {
          throw new Error('Invalid username parameter');
        }
        
        // Fetch the user profile data
        const userData = await getUserProfile(username);
        setUser(userData);
        
        // Also fetch the leaderboard visibility setting
        const visibilityRef = ref(db, 'test/leaderboardVisible');
        const snapshot = await get(visibilityRef);
        if (snapshot.exists()) {
          setLeaderboardVisible(snapshot.val() === true);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  // Rest of your component...

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="container mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#238636]"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        ) : user ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User profile card */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 md:col-span-1">
              {/* User avatar and basic info */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 mb-4">
                  <Image 
                    src={user.avatar_url || '/default-avatar.png'} 
                    alt={`${username}'s avatar`}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">{username}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-[#F778BA]" />
                  <span className="text-[#F778BA] font-medium">
                    Rank #{user.stats?.rank || 'N/A'}
                  </span>
                </div>
                
                <div className="w-full pt-4 border-t border-[#30363d]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{user.stats?.points || 0}</div>
                      <div className="text-sm text-[#8b949e]">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{user.stats?.level || 'Beginner'}</div>
                      <div className="text-sm text-[#8b949e]">Level</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Points breakdown and activity */}
            <div className="md:col-span-2 space-y-6">
              {/* Only show points breakdown if leaderboard is visible */}
              {leaderboardVisible && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Points Breakdown</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="w-5 h-5 text-[#A371F7]" />
                        <span className="text-[#8b949e]">Organization PRs Created</span>
                      </div>
                      <div className="text-white">
                        <span className="text-[#8b949e]">{user.stats?.orgPRs || 0} × 10 = </span>
                        <span className="font-medium text-[#238636]">{(user.stats?.orgPRs || 0) * 10}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-[#A371F7]" />
                        <span className="text-[#8b949e]">Organization PRs Merged</span>
                      </div>
                      <div className="text-white">
                        <span className="text-[#8b949e]">{user.stats?.orgMergedPRs || 0} × 15 = </span>
                        <span className="font-medium text-[#238636]">{(user.stats?.orgMergedPRs || 0) * 15}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="w-5 h-5 text-[#8b949e]" />
                        <span className="text-[#8b949e]">Open Source PRs Created</span>
                      </div>
                      <div className="text-white">
                        <span className="text-[#8b949e]">{(user.stats?.totalPRs || 0) - (user.stats?.orgPRs || 0)} × 5 = </span>
                        <span className="font-medium text-[#238636]">{((user.stats?.totalPRs || 0) - (user.stats?.orgPRs || 0)) * 5}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-[#8b949e]" />
                        <span className="text-[#8b949e]">Open Source PRs Merged</span>
                      </div>
                      <div className="text-white">
                        <span className="text-[#8b949e]">{(user.stats?.mergedPRs || 0) - (user.stats?.orgMergedPRs || 0)} × 7 = </span>
                        <span className="font-medium text-[#238636]">{((user.stats?.mergedPRs || 0) - (user.stats?.orgMergedPRs || 0)) * 7}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="font-bold text-white">Total Points</div>
                      <div className="font-bold text-[#238636] text-xl">{user.stats?.points || 0}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* If leaderboard is hidden, show a message */}
              {!leaderboardVisible && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 mb-4 text-[#8b949e]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V6a3 3 0 00-3-3H6a3 3 0 00-3 3v6a3 3 0 003 3h6a3 3 0 003-3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Points breakdown is hidden</h3>
                  <p className="text-[#8b949e] max-w-md">
                    The leaderboard is currently hidden by the administrators. 
                    Points breakdown will be available when the leaderboard is made visible again.
                  </p>
                </div>
              )}
              
              {/* Recent activity section can remain visible */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                
                {user.pullRequests && user.pullRequests.length > 0 ? (
                  <div className="space-y-4">
                    {user.pullRequests.slice(0, 5).map((pr) => (
                      <div key={pr.id} className="flex items-start gap-3 pb-3 border-b border-[#30363d]">
                        <div className={`mt-1 p-1 rounded ${pr.state === 'open' ? 'bg-[#238636]/10 text-[#238636]' : pr.state === 'closed' ? 'bg-[#F778BA]/10 text-[#F778BA]' : 'bg-[#8b949e]/10 text-[#8b949e]'}`}>
                          {pr.state === 'open' ? (
                            <GitPullRequest className="w-4 h-4" />
                          ) : (
                            <GitMerge className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <a 
                            href={pr.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#58a6ff] hover:underline font-medium"
                          >
                            {pr.title}
                          </a>
                          <div className="text-xs text-[#8b949e] mt-1">
                            {new Date(pr.created_at).toLocaleDateString()} • {pr.isOrg ? 'Organization' : 'Open Source'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[#8b949e] text-center py-4">
                    No recent activity found
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400">
            User not found
          </div>
        )}
      </div>
    </div>
  );
} 