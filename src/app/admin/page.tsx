'use client';

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, GitPullRequest, GitMerge, ExternalLink, X, Calendar, ChevronLeft, ChevronRight, Check, AlertTriangle, Trophy } from "lucide-react";
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
    manualRank?: number | null;
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
  reviewStatus?: 'reviewed' | 'invalid' | null;
};

type UserDetail = {
  login: string;
  avatar_url: string;
  pullRequests: PullRequest[];
};

// Add a calendar component for better date selection
function DatePicker({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedDate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (date: Date | null) => void;
  selectedDate: Date | null;
}) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Get days in month
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  
  // Get first day of month
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  // Create calendar days
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isSelected = selectedDate && 
      date.getDate() === selectedDate.getDate() && 
      date.getMonth() === selectedDate.getMonth() && 
      date.getFullYear() === selectedDate.getFullYear();
    
    days.push(
      <button
        key={day}
        onClick={() => onSelect(date)}
        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm
          ${isSelected 
            ? 'bg-[#F778BA] text-white' 
            : 'hover:bg-[#30363d] text-[#8b949e]'}`
        }
      >
        {day}
      </button>
    );
  }
  
  return (
    <div 
      ref={calendarRef}
      className="absolute right-0 mt-2 p-4 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-10 w-64"
    >
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 rounded-full hover:bg-[#30363d]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 rounded-full hover:bg-[#30363d]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-[#8b949e]">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => onSelect(new Date())}
          className="px-3 py-1 text-xs bg-[#30363d] text-white rounded-md hover:bg-[#30363d]/70"
        >
          Today
        </button>
        <button
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className="px-3 py-1 text-xs bg-[#30363d] text-white rounded-md hover:bg-[#30363d]/70"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// Add leaderboard settings type
type LeaderboardSettings = {
  visible: boolean;
  lastUpdated: string;
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
  const [recalculatingPoints, setRecalculatingPoints] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reviewedPRs, setReviewedPRs] = useState<Record<number, 'reviewed' | 'invalid'>>({});
  const [showLeaderboardSettings, setShowLeaderboardSettings] = useState(false);
  const [leaderboardSettings, setLeaderboardSettings] = useState<LeaderboardSettings>({
    visible: true,
    lastUpdated: new Date().toISOString()
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
    setRecalculatingPoints(true);
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
      const usersWithAvatars = updatedUsers.map(user => ({
        ...user,
        avatar_url: `https://avatars.githubusercontent.com/${user.login}`
      }));
      setUsers(usersWithAvatars);
      
      // If a user was selected, refresh their details
      if (selectedUser) {
        fetchUserDetails(selectedUser);
      }
    } catch (error) {
      console.error("Error recalculating points:", error);
    } finally {
      setRecalculatingPoints(false);
    }
  };

  // Function to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Function to clear date filter
  const clearDateFilter = () => {
    setDateFilter(null);
  };

  // Function to check if PR is after the selected date
  const isPRAfterDate = (prDate: string, filterDate: Date | null) => {
    if (!filterDate) return true;
    const prDateTime = new Date(prDate).getTime();
    return prDateTime >= filterDate.getTime();
  };

  // Function to update user's manual rank
  const updateUserRank = async (username: string, rank: number | null) => {
    try {
      const response = await fetch('/api/admin/update-user-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, rank }),
      });
      
      if (response.ok) {
        // Update local state with proper typing
        setUsers((prevUsers) => {
          return prevUsers.map((user) => {
            if (user.login === username) {
              return {
                ...user,
                stats: {
                  ...user.stats,
                  manualRank: rank
                }
              };
            }
            return user;
          });
        });
      } else {
        console.error("Failed to update user rank");
      }
    } catch (error) {
      console.error("Error updating user rank:", error);
    }
  };
  
  // Function to save leaderboard settings
  const saveLeaderboardSettings = async () => {
    setIsSavingSettings(true);
    try {
      console.log("Admin: Saving leaderboard visibility as numeric value");
      
      // Use a direct numeric value (1 or 0) instead of a boolean
      const visibilityValue = leaderboardSettings.visible ? 1 : 0;
      
      const response = await fetch('/api/admin/leaderboard-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visible: visibilityValue
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Admin: Save response:", data);
      
      alert("Leaderboard settings saved successfully!");
      setShowLeaderboardSettings(false);
      
      // Force reload to ensure changes take effect
      window.location.reload();
    } catch (error) {
      console.error("Admin: Error saving leaderboard settings:", error);
      alert(`Error saving settings: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Function to mark a PR as reviewed or invalid
  const markPR = (prId: number, status: 'reviewed' | 'invalid') => {
    setReviewedPRs(prev => {
      // If already marked with same status, remove the mark (toggle)
      if (prev[prId] === status) {
        const newState = {...prev};
        delete newState[prId];
        return newState;
      }
      // Otherwise set the new status
      return {...prev, [prId]: status};
    });
    
    // Save to localStorage for persistence
    setTimeout(() => {
      localStorage.setItem('admin-reviewed-prs', JSON.stringify({
        ...reviewedPRs,
        [prId]: status
      }));
    }, 0);
  };
  
  // Load leaderboard settings on component mount
  useEffect(() => {
    const fetchLeaderboardSettings = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch('/api/admin/leaderboard-settings');
        if (response.ok) {
          const data = await response.json();
          console.log("Admin: Fetched leaderboard settings:", data);
          setLeaderboardSettings(data);
        } else {
          console.error("Admin: Failed to fetch leaderboard settings");
        }
      } catch (error) {
        console.error("Admin: Error fetching leaderboard settings:", error);
      }
    };
    
    fetchLeaderboardSettings();
  }, [isAuthenticated]);

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
                <div className="flex gap-2">
                  <button
                    onClick={handleRecalculatePoints}
                    disabled={recalculatingPoints}
                    className={`px-3 py-1 text-xs ${
                      recalculatingPoints 
                        ? 'bg-[#F778BA]/50 cursor-not-allowed' 
                        : 'bg-[#F778BA] hover:bg-[#F778BA]/90'
                    } text-white rounded-md transition-colors flex items-center gap-1`}
                  >
                    {recalculatingPoints ? 'Recalculating...' : 'Recalculate Points'}
                  </button>
                  
                  <button
                    onClick={() => setShowLeaderboardSettings(true)}
                    className="px-3 py-1 text-xs bg-[#30363d] hover:bg-[#30363d]/70 text-white rounded-md transition-colors flex items-center gap-1"
                  >
                    <Trophy className="w-3 h-3" />
                    <span>Leaderboard Settings</span>
                  </button>
                </div>
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
                      
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Pull Requests</h3>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-[#0d1117] text-[#8b949e] hover:bg-[#30363d]/50"
                          >
                            <Calendar className="w-4 h-4" />
                            {dateFilter ? formatDate(dateFilter) : "Filter by date"}
                          </button>
                          
                          <DatePicker
                            isOpen={showDatePicker}
                            onClose={() => setShowDatePicker(false)}
                            onSelect={(date) => {
                              setDateFilter(date);
                              setShowDatePicker(false);
                            }}
                            selectedDate={dateFilter}
                          />
                        </div>
                      </div>
                      
                      {userDetail && userDetail.pullRequests.length < (users.find(u => u.login === selectedUser)?.stats.totalPRs || 0) && (
                        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-900/30 text-yellow-400 rounded-md text-sm">
                          <p className="font-medium">Note: Only showing {userDetail.pullRequests.length} of {users.find(u => u.login === selectedUser)?.stats.totalPRs} total PRs</p>
                          <p>GitHub API limits prevent showing all PRs. Points are calculated based on all PRs.</p>
                        </div>
                      )}
                      
                      <div className="space-y-3">
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
                            
                            if (dateFilter && !isPRAfterDate(pr.created_at, dateFilter)) {
                              return false;
                            }
                            
                            return true;
                          })
                          .map(pr => (
                            <a
                              key={pr.id}
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block p-4 rounded-lg border ${
                                reviewedPRs[pr.id] === 'reviewed' 
                                  ? 'border-green-600 bg-green-900/10' 
                                  : reviewedPRs[pr.id] === 'invalid'
                                    ? 'border-red-600 bg-red-900/10'
                                    : 'border-[#30363d] bg-[#0d1117]'
                              } hover:border-[#58a6ff]/30 transition-colors`}
                            >
                              <div className="flex justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {pr.state === 'merged' ? (
                                      <GitMerge className="w-4 h-4 text-purple-500" />
                                    ) : (
                                      <GitPullRequest className="w-4 h-4 text-green-500" />
                                    )}
                                    <span className="font-medium text-white">{pr.title}</span>
                                    {pr.isOrg && (
                                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900/30 text-blue-400 border border-blue-900/50">
                                        Organization
                                      </span>
                                    )}
                                    {/* Add point tag */}
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/30 text-green-400 border border-green-900/50">
                                      +{pr.isOrg 
                                        ? (pr.state === 'merged' ? '15' : '10') 
                                        : (pr.state === 'merged' ? '7' : '5')
                                      } pts
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                                    <span>
                                      {pr.state === 'merged'
                                        ? `Merged on ${new Date(pr.merged_at!).toLocaleDateString()}`
                                        : `Created on ${new Date(pr.created_at).toLocaleDateString()}`}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-[#8b949e]" />
                                  </div>
                                </div>
                                
                                {/* Add review action buttons */}
                                <div className="flex items-start gap-2 ml-4" onClick={(e) => e.preventDefault()}>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      markPR(pr.id, 'reviewed');
                                    }}
                                    className={`p-2 rounded-md ${
                                      reviewedPRs[pr.id] === 'reviewed'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-[#21262d] text-[#8b949e] hover:bg-green-900/30 hover:text-green-400'
                                    }`}
                                    title="Mark as Reviewed"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      markPR(pr.id, 'invalid');
                                    }}
                                    className={`p-2 rounded-md ${
                                      reviewedPRs[pr.id] === 'invalid'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-[#21262d] text-[#8b949e] hover:bg-red-900/30 hover:text-red-400'
                                    }`}
                                    title="Mark as Invalid"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                </div>
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
                          
                          if (dateFilter && !isPRAfterDate(pr.created_at, dateFilter)) {
                            return false;
                          }
                          
                          return true;
                        }).length === 0 && (
                        <div className="text-center py-8 text-[#8b949e]">
                          <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No pull requests found matching the current filters.</p>
                          {dateFilter && (
                            <button 
                              onClick={clearDateFilter}
                              className="mt-2 px-3 py-1 text-sm bg-[#30363d] rounded-md hover:bg-[#30363d]/70"
                            >
                              Clear date filter
                            </button>
                          )}
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
      
      {/* Add leaderboard settings modal */}
      {showLeaderboardSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Leaderboard Settings</h2>
              <button
                onClick={() => setShowLeaderboardSettings(false)}
                className="p-2 rounded-full hover:bg-[#30363d] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium mb-1">Leaderboard Visibility</h3>
                  <p className="text-sm text-[#8b949e]">Control whether users can see the leaderboard</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={leaderboardSettings.visible}
                    onChange={() => setLeaderboardSettings(prev => ({...prev, visible: !prev.visible}))}
                  />
                  <div className="w-11 h-6 bg-[#21262d] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F778BA]"></div>
                </label>
              </div>
              
              {leaderboardSettings.lastUpdated && (
                <div className="text-sm text-[#8b949e]">
                  Last updated: {new Date(leaderboardSettings.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-4">Manual User Rankings</h3>
              <p className="text-sm text-[#8b949e] mb-4">
                Assign custom ranks to users. These ranks will override the automatic point-based ranking.
                Leave blank to use automatic ranking.
              </p>
              
              <div className="max-h-80 overflow-y-auto border border-[#30363d] rounded-lg">
                <table className="w-full">
                  <thead className="bg-[#161b22] sticky top-0">
                    <tr>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Points</th>
                      <th className="p-3 text-left">Auto Rank</th>
                      <th className="p-3 text-left">Manual Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .sort((a, b) => (b.stats.points || 0) - (a.stats.points || 0))
                      .map((user, index) => (
                        <tr key={user.login} className="border-t border-[#30363d]">
                          <td className="p-3 flex items-center gap-2">
                            <Image 
                              src={user.avatar_url || `https://avatars.githubusercontent.com/${user.login}`}
                              alt={user.login}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                            <span>{user.login}</span>
                          </td>
                          <td className="p-3">{user.stats.points}</td>
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="1"
                              placeholder="Auto"
                              value={user.stats.manualRank || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                const rank = value === '' ? null : parseInt(value);
                                updateUserRank(user.login, rank);
                              }}
                              className="w-16 px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded-md"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaderboardSettings(false)}
                className="px-4 py-2 text-sm bg-[#21262d] hover:bg-[#30363d] text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLeaderboardSettings}
                disabled={isSavingSettings}
                className={`px-4 py-2 text-sm ${
                  isSavingSettings 
                    ? 'bg-[#F778BA]/50 cursor-not-allowed' 
                    : 'bg-[#F778BA] hover:bg-[#F778BA]/90'
                } text-white rounded-md transition-colors flex items-center gap-2`}
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add this button to your admin panel */}
      <button
        onClick={async () => {
          try {
            const response = await fetch('/api/admin/initialize-leaderboard');
            const data = await response.json();
            console.log("Initialization response:", data);
            alert("Leaderboard visibility setting initialized successfully!");
            window.location.reload();
          } catch (error) {
            console.error("Error initializing leaderboard visibility:", error);
            alert("Failed to initialize leaderboard visibility setting");
          }
        }}
        className="px-4 py-2 text-sm bg-[#238636] hover:bg-[#238636]/90 text-white rounded-md transition-colors"
      >
        Initialize Leaderboard Setting
      </button>
    </div>
  );
}