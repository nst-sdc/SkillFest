'use client';

import React, { useState } from "react";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, GitPullRequest, GitMerge, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { getActiveUsers } from "@/lib/firebase";
import Image from "next/image";

// Define types for our admin portal
type AdminUser = {
  login: string;
  avatar_url?: string;
  lastActive: Date;
  stats: {
    totalPRs: number;
    mergedPRs: number;
    contributions: number;
    orgPRs: number;
    orgMergedPRs: number;
    points: number;
    level: string;
  };
};

type PullRequest = {
  id: number;
  title: string;
  url: string;
  state: string;
  created_at: string;
  merged_at?: string;
  isOrg: boolean;
};

type UserDetail = {
  login: string;
  avatar_url: string;
  pullRequests: PullRequest[];
};

export default function AdminPortal() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [prFilter, setPrFilter] = useState<'all' | 'merged' | 'open'>('all');
  const [orgFilter, setOrgFilter] = useState<'all' | 'org' | 'personal'>('all');

  // The admin password - in a real app, this would be stored securely
  const ADMIN_PASSWORD = "skillfest2025";

  const handleLogin = async () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
      setLoading(true);
      
      try {
        const users = await getActiveUsers();
        // Map the users to include avatar_url
        const usersWithAvatars = users.map(user => ({
          ...user,
          avatar_url: `https://avatars.githubusercontent.com/${user.login}`
        }));
        setUsers(usersWithAvatars);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Invalid password");
    }
  };

  const fetchUserDetails = async (username: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/admin/user-details?username=${username}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }
      const data = await response.json();
      setUserDetail(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRecalculatePoints = async () => {
    try {
      const response = await fetch('/api/admin/recalculate-points', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error("Failed to recalculate points");
      }
      
      const data = await response.json();
      console.log("Points recalculated:", data);
      
      // Refresh the user list
      const updatedUsers = await getActiveUsers();
      setUsers(updatedUsers);
      
      // If a user was selected, refresh their details
      if (selectedUser) {
        fetchUserDetails(selectedUser);
      }
    } catch (error) {
      console.error("Error recalculating points:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Link href="/skillfest" className="p-2 rounded-full hover:bg-[#30363d] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#F778BA]" />
              Admin Portal
            </h1>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="max-w-md mx-auto mt-16 p-8 rounded-lg border border-[#30363d] bg-[#161b22]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#F778BA]" />
              Authentication Required
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-900/30 text-red-400 rounded-md">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#8b949e] mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F778BA]/50 focus:border-[#F778BA]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8b949e] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full py-2 px-4 bg-[#F778BA] hover:bg-[#F778BA]/90 text-white font-medium rounded-md transition-colors"
            >
              Login
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
                <h2 className="font-bold">Users ({users.length})</h2>
                <button
                  onClick={handleRecalculatePoints}
                  className="px-3 py-1 text-xs bg-[#F778BA] hover:bg-[#F778BA]/90 text-white rounded-md transition-colors"
                >
                  Recalculate Points
                </button>
              </div>
              
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F778BA]"></div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {users
                      .sort((a, b) => {
                        // Sort by points (descending)
                        const aPoints = (() => {
                          const orgPRs = a.stats.orgPRs || 0;
                          const orgMergedPRs = a.stats.orgMergedPRs || 0;
                          const totalPRs = a.stats.totalPRs || 0;
                          const mergedPRs = a.stats.mergedPRs || 0;
                          
                          const orgPRPoints = orgPRs * 10;
                          const orgMergedPRPoints = orgMergedPRs * 15;
                          const generalPRs = Math.max(0, totalPRs - orgPRs);
                          const generalMergedPRs = Math.max(0, mergedPRs - orgMergedPRs);
                          const generalPRPoints = generalPRs * 5;
                          const generalMergedPRPoints = generalMergedPRs * 7;
                          
                          return orgPRPoints + orgMergedPRPoints + generalPRPoints + generalMergedPRPoints;
                        })();
                        
                        const bPoints = (() => {
                          const orgPRs = b.stats.orgPRs || 0;
                          const orgMergedPRs = b.stats.orgMergedPRs || 0;
                          const totalPRs = b.stats.totalPRs || 0;
                          const mergedPRs = b.stats.mergedPRs || 0;
                          
                          const orgPRPoints = orgPRs * 10;
                          const orgMergedPRPoints = orgMergedPRs * 15;
                          const generalPRs = Math.max(0, totalPRs - orgPRs);
                          const generalMergedPRs = Math.max(0, mergedPRs - orgMergedPRs);
                          const generalPRPoints = generalPRs * 5;
                          const generalMergedPRPoints = generalMergedPRs * 7;
                          
                          return orgPRPoints + orgMergedPRPoints + generalPRPoints + generalMergedPRPoints;
                        })();
                        
                        return bPoints - aPoints;
                      })
                      .map(user => {
                        // Calculate points for display
                        const orgPRs = user.stats.orgPRs || 0;
                        const orgMergedPRs = user.stats.orgMergedPRs || 0;
                        const totalPRs = user.stats.totalPRs || 0;
                        const mergedPRs = user.stats.mergedPRs || 0;
                        
                        const orgPRPoints = orgPRs * 10;
                        const orgMergedPRPoints = orgMergedPRs * 15;
                        const generalPRs = Math.max(0, totalPRs - orgPRs);
                        const generalMergedPRs = Math.max(0, mergedPRs - orgMergedPRs);
                        const generalPRPoints = generalPRs * 5;
                        const generalMergedPRPoints = generalMergedPRs * 7;
                        
                        const calculatedPoints = orgPRPoints + orgMergedPRPoints + generalPRPoints + generalMergedPRPoints;
                        
                        return (
                          <div
                            key={user.login}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedUser === user.login ? 'bg-[#30363d]' : 'bg-[#0d1117] hover:bg-[#30363d]/50'
                            }`}
                            onClick={() => {
                              setSelectedUser(user.login);
                              fetchUserDetails(user.login);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Image
                                src={user.avatar_url || `https://avatars.githubusercontent.com/${user.login}`}
                                alt={user.login}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                              <div>
                                <div className="font-medium">{user.login}</div>
                                <div className="text-xs text-[#8b949e]">
                                  {user.stats.level} • {calculatedPoints} points
                                </div>
                              </div>
                            </div>
                            <div className="text-[#8b949e] text-sm">
                              {user.stats.totalPRs} PRs
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              {selectedUser ? (
                loadingDetail ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F778BA]"></div>
                  </div>
                ) : userDetail ? (
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <Image 
                          src={userDetail.avatar_url}
                          alt={userDetail.login}
                          width={64}
                          height={64}
                          className="rounded-full"
                        />
                        <div>
                          <h2 className="text-2xl font-bold">{userDetail.login}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <a 
                              href={`https://github.com/${userDetail.login}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8b949e] hover:text-white flex items-center gap-1"
                            >
                              <span>View on GitHub</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="p-2 rounded-full hover:bg-[#30363d] transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#0d1117] p-4 rounded-lg">
                        <h3 className="text-[#8b949e] text-sm mb-2">Contribution Stats</h3>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">Total PRs</div>
                            <div className="font-medium">{users.find(u => u.login === selectedUser)?.stats.totalPRs || 0}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">Merged PRs</div>
                            <div className="font-medium">{users.find(u => u.login === selectedUser)?.stats.mergedPRs || 0}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">Org PRs</div>
                            <div className="font-medium">{users.find(u => u.login === selectedUser)?.stats.orgPRs || 0}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">Org Merged PRs</div>
                            <div className="font-medium">{users.find(u => u.login === selectedUser)?.stats.orgMergedPRs || 0}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#0d1117] p-4 rounded-lg">
                        <h3 className="text-[#8b949e] text-sm mb-2">Points Breakdown</h3>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">Org PRs</div>
                            <div className="font-medium">
                              {(users.find(u => u.login === selectedUser)?.stats.orgPRs || 0) * 10}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">Org Merged PRs</div>
                            <div className="font-medium">
                              {(users.find(u => u.login === selectedUser)?.stats.orgMergedPRs || 0) * 15}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">General PRs</div>
                            <div className="font-medium">
                              {(() => {
                                const user = users.find(u => u.login === selectedUser);
                                if (!user) return 0;
                                const totalPRs = user.stats.totalPRs || 0;
                                const orgPRs = user.stats.orgPRs || 0;
                                return Math.max(0, totalPRs - orgPRs) * 5;
                              })()}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-[#8b949e]">General Merged PRs</div>
                            <div className="font-medium">
                              {(() => {
                                const user = users.find(u => u.login === selectedUser);
                                if (!user) return 0;
                                const mergedPRs = user.stats.mergedPRs || 0;
                                const orgMergedPRs = user.stats.orgMergedPRs || 0;
                                return Math.max(0, mergedPRs - orgMergedPRs) * 7;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 mt-2">
                      <div className="text-white font-medium">Total Points</div>
                      <div className="text-xl font-bold text-[#238636]">
                        {(() => {
                          const user = users.find(u => u.login === selectedUser);
                          if (!user) return 0;
                          
                          const orgPRs = user.stats.orgPRs || 0;
                          const orgMergedPRs = user.stats.orgMergedPRs || 0;
                          const totalPRs = user.stats.totalPRs || 0;
                          const mergedPRs = user.stats.mergedPRs || 0;
                          
                          const orgPRPoints = orgPRs * 10;
                          const orgMergedPRPoints = orgMergedPRs * 15;
                          const generalPRs = Math.max(0, totalPRs - orgPRs);
                          const generalMergedPRs = Math.max(0, mergedPRs - orgMergedPRs);
                          const generalPRPoints = generalPRs * 5;
                          const generalMergedPRPoints = generalMergedPRs * 7;
                          
                          return orgPRPoints + orgMergedPRPoints + generalPRPoints + generalMergedPRPoints;
                        })()}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium mb-4">Pull Requests</h3>
                      
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setOrgFilter('all')}
                            className={`px-3 py-1 text-sm rounded-md ${
                              orgFilter === 'all' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                            }`}
                          >
                            All Repos
                          </button>
                          <button
                            onClick={() => setOrgFilter('org')}
                            className={`px-3 py-1 text-sm rounded-md ${
                              orgFilter === 'org' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                            }`}
                          >
                            NST-SDC Only
                          </button>
                          <button
                            onClick={() => setOrgFilter('personal')}
                            className={`px-3 py-1 text-sm rounded-md ${
                              orgFilter === 'personal' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                            }`}
                          >
                            Other Repos
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex space-x-2 mb-4">
                          <button
                            onClick={() => setPrFilter('all')}
                            className={`px-3 py-1 text-sm rounded-md ${
                              prFilter === 'all' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                            }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setPrFilter('open')}
                            className={`px-3 py-1 text-sm rounded-md ${
                              prFilter === 'open' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                            }`}
                          >
                            Open
                          </button>
                          <button
                            onClick={() => setPrFilter('merged')}
                            className={`px-3 py-1 text-sm rounded-md ${
                              prFilter === 'merged' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                            }`}
                          >
                            Merged
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        {userDetail.pullRequests
                          .filter(pr => {
                            if (prFilter !== 'all') {
                              if (prFilter === 'merged' && pr.state !== 'merged') return false;
                              if (prFilter === 'open' && pr.state !== 'open') return false;
                            }
                            
                            if (orgFilter !== 'all') {
                              if (orgFilter === 'org' && !pr.isOrg) return false;
                              if (orgFilter === 'personal' && pr.isOrg) return false;
                            }
                            
                            return true;
                          })
                          .map(pr => (
                            <a
                              key={pr.id}
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 bg-[#0d1117] rounded-lg hover:bg-[#30363d]/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  {pr.state === 'merged' ? (
                                    <GitMerge className="w-5 h-5 text-purple-400 mt-1" />
                                  ) : (
                                    <GitPullRequest className="w-5 h-5 text-green-400 mt-1" />
                                  )}
                                  <div>
                                    <div className="font-medium">{pr.title}</div>
                                    <div className="text-xs text-[#8b949e] mt-1">
                                      {new Date(pr.created_at).toLocaleDateString()} • 
                                      {pr.isOrg ? (
                                        <span className="text-[#F778BA] ml-1">NST-SDC</span>
                                      ) : (
                                        <span className="text-[#8b949e] ml-1">Other Repo</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-[#8b949e]" />
                              </div>
                            </a>
                          ))}
                      </div>
                      
                      {userDetail.pullRequests
                        .filter(pr => {
                          if (prFilter !== 'all') {
                            if (prFilter === 'merged' && pr.state !== 'merged') return false;
                            if (prFilter === 'open' && pr.state !== 'open') return false;
                          }
                          
                          if (orgFilter !== 'all') {
                            if (orgFilter === 'org' && !pr.isOrg) return false;
                            if (orgFilter === 'personal' && pr.isOrg) return false;
                          }
                          
                          return true;
                        }).length === 0 && (
                        <div className="text-center py-8 text-[#8b949e]">
                          <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No pull requests found matching the current filters.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F778BA]"></div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-64 text-[#8b949e]">
                  <div className="text-center">
                    <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a user to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}