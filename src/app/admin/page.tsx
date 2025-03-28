'use client';

import { useState } from "react";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, GitPullRequest, GitMerge, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { getActiveUsers } from "@/lib/firebase";
import Image from "next/image";

// Define types for our admin portal
type AdminUser = {
  login: string;
  avatar_url: string;
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
    setLoading(true);
    setError("");

    try {
      // Simple password check
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        
        // Fetch users after authentication
        const fetchedUsers = await getActiveUsers();
        
        // Format users for display
        const formattedUsers = fetchedUsers.map(user => ({
          login: user.login,
          avatar_url: `https://avatars.githubusercontent.com/${user.login}`,
          lastActive: user.lastActive,
          stats: {
            totalPRs: user.stats.totalPRs,
            mergedPRs: user.stats.mergedPRs,
            contributions: user.stats.contributions,
            orgPRs: user.stats.orgPRs || 0,
            orgMergedPRs: user.stats.orgMergedPRs || 0,
            points: user.stats.points || 0,
            level: user.stats.level || 'Newcomer'
          }
        }));
        
        setUsers(formattedUsers);
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (login: string) => {
    setSelectedUser(login);
    setLoadingDetail(true);
    setUserDetail(null);
    
    try {
      console.log(`Fetching details for user: ${login}`);
      
      // Use a more robust fetch with error handling
      const response = await fetch(`/api/admin/user-details?username=${login}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received user details:`, data);
      
      setUserDetail(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Don't set userDetail to null here, so we can show the error state
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white p-8">
        <div className="max-w-md mx-auto bg-[#161b22] border border-[#30363d] rounded-xl p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-[#F778BA] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
            <p className="text-[#8b949e]">Enter the admin password to access the dashboard.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#8b949e] mb-2">
                <Lock className="w-4 h-4" />
                Admin Login
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F778BA] focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8b949e] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[#f85149] text-sm bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                <>
                  Login as Admin
                </>
              )}
            </button>

            <Link href="/" className="block text-center text-[#8b949e] hover:text-white text-sm">
              <ArrowLeft className="inline-block w-4 h-4 mr-1" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#8b949e] hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="bg-[#238636] text-white px-3 py-1 rounded-full text-sm font-medium">
            Admin Access
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <div className="text-[#8b949e] text-sm mb-2">Total Users</div>
            <div className="text-3xl font-bold">
              {users.length}
            </div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <div className="text-[#8b949e] text-sm mb-2">Total PRs</div>
            <div className="text-3xl font-bold">
              {users.reduce((sum, user) => sum + user.stats.totalPRs, 0)}
            </div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <div className="text-[#8b949e] text-sm mb-2">Merged PRs</div>
            <div className="text-3xl font-bold">
              {users.reduce((sum, user) => sum + user.stats.mergedPRs, 0)}
            </div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <div className="text-[#8b949e] text-sm mb-2">Total Contributions</div>
            <div className="text-3xl font-bold">
              {users.reduce((sum, user) => sum + user.stats.contributions, 0)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">User List</h2>
              <div className="overflow-y-auto max-h-[600px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      <th className="text-left py-3 px-4 text-[#8b949e]">User</th>
                      <th className="text-left py-3 px-4 text-[#8b949e]">Level</th>
                      <th className="text-left py-3 px-4 text-[#8b949e]">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.sort((a, b) => b.stats.points - a.stats.points).map((user) => (
                      <tr 
                        key={user.login} 
                        className={`border-b border-[#30363d] hover:bg-[#30363d]/30 cursor-pointer ${selectedUser === user.login ? 'bg-[#30363d]/50' : ''}`}
                        onClick={() => selectUser(user.login)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Image 
                              src={user.avatar_url} 
                              alt={user.login}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <span className="text-white">
                              {user.login}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.stats.level === 'Expert' ? 'bg-[#8957e5]/20 text-[#8957e5]' :
                            user.stats.level === 'Advanced' ? 'bg-[#f778ba]/20 text-[#f778ba]' :
                            user.stats.level === 'Intermediate' ? 'bg-[#3fb950]/20 text-[#3fb950]' :
                            user.stats.level === 'Beginner' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' :
                            'bg-[#8b949e]/20 text-[#8b949e]'
                          }`}>
                            {user.stats.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#238636]">{user.stats.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 h-full">
              {selectedUser ? (
                loadingDetail ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F778BA]"></div>
                  </div>
                ) : userDetail ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <Image 
                          src={userDetail.avatar_url} 
                          alt={userDetail.login}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                        <div>
                          <h2 className="text-xl font-bold">{userDetail.login}</h2>
                          <a 
                            href={`https://github.com/${userDetail.login}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#58a6ff] text-sm flex items-center gap-1 hover:underline"
                          >
                            View GitHub Profile
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedUser(null);
                          setUserDetail(null);
                        }}
                        className="text-[#8b949e] hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">User Stats</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {users.find(u => u.login === selectedUser)?.stats && (
                          <>
                            <div key="total-prs" className="bg-[#0d1117] rounded-lg p-4">
                              <div className="text-[#8b949e] text-xs mb-1">Total PRs</div>
                              <div className="text-xl font-bold">{users.find(u => u.login === selectedUser)?.stats.totalPRs}</div>
                            </div>
                            <div key="merged-prs" className="bg-[#0d1117] rounded-lg p-4">
                              <div className="text-[#8b949e] text-xs mb-1">Merged PRs</div>
                              <div className="text-xl font-bold">{users.find(u => u.login === selectedUser)?.stats.mergedPRs}</div>
                            </div>
                            <div key="org-prs" className="bg-[#0d1117] rounded-lg p-4">
                              <div className="text-[#8b949e] text-xs mb-1">Org PRs</div>
                              <div className="text-xl font-bold">{users.find(u => u.login === selectedUser)?.stats.orgPRs} / {users.find(u => u.login === selectedUser)?.stats.orgMergedPRs}</div>
                            </div>
                            <div key="points" className="bg-[#0d1117] rounded-lg p-4">
                              <div className="text-[#8b949e] text-xs mb-1">Points</div>
                              <div className="text-xl font-bold text-[#238636]">{users.find(u => u.login === selectedUser)?.stats.points}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Points Breakdown</h3>
                      <div className="bg-[#0d1117] rounded-lg p-4">
                        {users.find(u => u.login === selectedUser)?.stats && (
                          <>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-center py-2 border-b border-[#30363d]">
                                <div className="text-[#8b949e]">Organization PRs Created</div>
                                <div className="flex items-center">
                                  <span className="text-white font-medium mr-2">
                                    {users.find(u => u.login === selectedUser)?.stats.orgPRs || 0}
                                  </span>
                                  <span className="text-[#8b949e]">×</span>
                                  <span className="text-[#f778ba] mx-2">5</span>
                                  <span className="text-[#8b949e]">=</span>
                                  <span className="text-[#238636] font-bold ml-2">
                                    {(users.find(u => u.login === selectedUser)?.stats.orgPRs || 0) * 5}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center py-2 border-b border-[#30363d]">
                                <div className="text-[#8b949e]">Organization PRs Merged</div>
                                <div className="flex items-center">
                                  <span className="text-white font-medium mr-2">
                                    {users.find(u => u.login === selectedUser)?.stats.orgMergedPRs || 0}
                                  </span>
                                  <span className="text-[#8b949e]">×</span>
                                  <span className="text-[#f778ba] mx-2">15</span>
                                  <span className="text-[#8b949e]">=</span>
                                  <span className="text-[#238636] font-bold ml-2">
                                    {(users.find(u => u.login === selectedUser)?.stats.orgMergedPRs || 0) * 15}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center py-2 border-b border-[#30363d]">
                                <div className="text-[#8b949e]">Contributions (Commits)</div>
                                <div className="flex items-center">
                                  <span className="text-white font-medium mr-2">
                                    {users.find(u => u.login === selectedUser)?.stats.contributions || 0}
                                  </span>
                                  <span className="text-[#8b949e]">×</span>
                                  <span className="text-[#f778ba] mx-2">2</span>
                                  <span className="text-[#8b949e]">=</span>
                                  <span className="text-[#238636] font-bold ml-2">
                                    {(users.find(u => u.login === selectedUser)?.stats.contributions || 0) * 2}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center py-2 mt-2">
                                <div className="text-white font-medium">Total Points</div>
                                <div className="text-xl font-bold text-[#238636]">
                                  {users.find(u => u.login === selectedUser)?.stats.points}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 text-xs text-[#8b949e] bg-[#161b22] p-3 rounded border border-[#30363d]">
                              <p className="mb-1">Points are calculated based on:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Organization PRs Created: 5 points each</li>
                                <li>Organization PRs Merged: 15 points each</li>
                                <li>Contributions (Commits): 2 points each</li>
                              </ul>
                              <p className="mt-2">Note: General PRs outside the organization are tracked but don&apos;t contribute to points.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex space-x-2 mb-4">
                        <button
                          key="filter-all"
                          onClick={() => setPrFilter('all')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            prFilter === 'all' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                          }`}
                        >
                          All
                        </button>
                        <button
                          key="filter-open"
                          onClick={() => setPrFilter('open')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            prFilter === 'open' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                          }`}
                        >
                          Open
                        </button>
                        <button
                          key="filter-merged"
                          onClick={() => setPrFilter('merged')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            prFilter === 'merged' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                          }`}
                        >
                          Merged
                        </button>
                      </div>
                      <div className="flex space-x-2 mb-4">
                        <button
                          key="org-all"
                          onClick={() => setOrgFilter('all')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            orgFilter === 'all' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                          }`}
                        >
                          All Repositories
                        </button>
                        <button
                          key="org-org"
                          onClick={() => setOrgFilter('org')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            orgFilter === 'org' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                          }`}
                        >
                          Organization Only
                        </button>
                        <button
                          key="org-personal"
                          onClick={() => setOrgFilter('personal')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            orgFilter === 'personal' ? 'bg-[#30363d] text-white' : 'bg-[#0d1117] text-[#8b949e]'
                          }`}
                        >
                          Personal Only
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Pull Requests</h3>
                      {userDetail.pullRequests && userDetail.pullRequests.length > 0 ? (
                        <div className="space-y-3">
                          {userDetail.pullRequests
                            .filter(pr => {
                              if (prFilter === 'all') return true;
                              if (prFilter === 'open') return pr.state === 'open';
                              if (prFilter === 'merged') return pr.state === 'merged';
                              return true;
                            })
                            .filter(pr => {
                              if (orgFilter === 'all') return true;
                              if (orgFilter === 'org') return pr.isOrg;
                              if (orgFilter === 'personal') return !pr.isOrg;
                              return true;
                            })
                            .map(pr => (
                              <a 
                                key={pr.id}
                                href={pr.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-[#0d1117] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/30 transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3">
                                    {pr.state === 'merged' ? (
                                      <GitMerge className="w-5 h-5 text-[#8957e5] mt-1" />
                                    ) : pr.state === 'open' ? (
                                      <GitPullRequest className="w-5 h-5 text-[#3fb950] mt-1" />
                                    ) : (
                                      <GitPullRequest className="w-5 h-5 text-[#8b949e] mt-1" />
                                    )}
                                    <div>
                                      <div className="font-medium text-white">{pr.title}</div>
                                      <div className="text-sm text-[#8b949e] mt-1">
                                        Created: {new Date(pr.created_at).toLocaleDateString()}
                                        {pr.merged_at && ` • Merged: ${new Date(pr.merged_at).toLocaleDateString()}`}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    {pr.isOrg && (
                                      <span className="px-2 py-1 bg-[#238636]/10 text-[#238636] text-xs rounded-full">
                                        Organization
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </a>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-[#0d1117] rounded-lg text-[#8b949e]">
                          <GitPullRequest className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No pull requests found</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-[#8b949e]">
                    <GitPullRequest className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg mb-2">Failed to load user details</p>
                    <p className="text-sm">Please try selecting another user</p>
                  </div>
                )
              ) : (
                <div className="text-center py-20 text-[#8b949e]">
                  <GitPullRequest className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Select a user to view details</p>
                  <p className="text-sm max-w-md mx-auto">
                    View detailed GitHub activity, pull requests, and contribution statistics for each user.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 