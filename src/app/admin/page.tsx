'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, GitPullRequest, GitMerge, ExternalLink, X, Calendar, ChevronLeft, ChevronRight, Check, AlertTriangle, Trophy, Save, RefreshCw, Search, Users } from "lucide-react";
import Link from "next/link";
import { getActiveUsers } from "@/lib/firebase";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ref, update, get } from "firebase/database";
import { db } from "@/lib/firebase-config";
import debounce from 'lodash/debounce';

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
    hidden?: boolean;
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

// Add this type near other type definitions
type PointsUpdate = {
  username: string;
  points: number;
};

export default function AdminPortal() {
  const { /* data: session, status */ } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/api/auth/signin';
    },
  });

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
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  // The admin password - in a real app, this would be stored securely
  const ADMIN_PASSWORD = "backtester";

  // Add search and sort state
  const [searchTerm, setSearchTerm] = useState("");

  // Add this state with other state declarations
  const [tempPoints, setTempPoints] = useState<Record<string, number>>({});
  const [isUpdatingPoints, setIsUpdatingPoints] = useState<Record<string, boolean>>({});

  // Add this debounced function after state declarations
  const debouncedUpdatePoints = useCallback(
    debounce(async (update: PointsUpdate) => {
      try {
        setIsUpdatingPoints(prev => ({ ...prev, [update.username]: true }));
        await updateUserRank(update.username, null, update.points);
      } finally {
        setIsUpdatingPoints(prev => ({ ...prev, [update.username]: false }));
      }
    }, 1000),
    []
  );

  // Move fetchUsers outside useEffect and make it a function we can reuse
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get users
      const users = await getActiveUsers();
      
      // Get manual ranks and visibility settings
      const manualRanksRef = ref(db, 'test/manualRanks');
      const manualRanksSnapshot = await get(manualRanksRef);
      const manualRanks = manualRanksSnapshot.exists() ? manualRanksSnapshot.val() : {};
      
      // Combine user data with manual ranks and visibility
      const updatedUsers = users.map(user => ({
        ...user,
        stats: {
          ...user.stats,
          manualRank: manualRanks[user.login]?.manualRank || null,
          hidden: manualRanks[user.login]?.hidden || false
        }
      }));
      
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Use fetchUsers in useEffect
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

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

  // Update the updateUserRank function to use the fetchUsers function
  const updateUserRank = async (username: string, rank: number | null, points?: number) => {
    try {
      // First update the manual rank
      const response = await fetch('/api/admin/update-user-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, rank, points }), // Include points in the request
        credentials: 'include',
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
                  manualRank: rank,
                  points: points !== undefined ? points : user.stats.points // Update points if provided
                }
              };
            }
            return user;
          });
        });
        
        setSettingsMessage({ 
          type: 'success', 
          text: `Updated ${username}: ${rank ? `rank ${rank}` : 'cleared rank'}${points !== undefined ? `, points ${points}` : ''}` 
        });
        
        setTimeout(() => setSettingsMessage(null), 2000);
        
        if (isAuthenticated) {
          await fetchUsers();
        }
      } else {
        console.error("Failed to update user rank");
        setSettingsMessage({ 
          type: 'error', 
          text: 'Failed to update rank' 
        });
        setTimeout(() => setSettingsMessage(null), 2000);
      }
    } catch (error) {
      console.error("Error updating user rank:", error);
      setSettingsMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      setTimeout(() => setSettingsMessage(null), 2000);
    }
  };
  
  // Fix the saveLeaderboardSettings function
  const saveLeaderboardSettings = async () => {
    if (isSavingSettings) return;
    
    setIsSavingSettings(true);
    setSettingsMessage(null);
    
    try {
      const response = await fetch('/api/admin/leaderboard-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visible: leaderboardSettings.visible
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Settings saved successfully:", data);
      
      // Update the state with the response data
      setLeaderboardSettings({
        visible: data.data.visible,
        lastUpdated: data.data.lastUpdated
      });
      
      setSettingsMessage({ 
        type: 'success', 
        text: 'Leaderboard settings saved successfully!' 
      });
      
      // Keep the message visible for 3 seconds
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSettingsMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
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

  const initializeLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/initialize-leaderboard', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize leaderboard');
      }
      
      const data = await response.json();
      console.log("Initialization response:", data);
      alert("Leaderboard visibility setting initialized successfully!");
      
      // Update the state instead of reloading
      setLeaderboardSettings(prev => ({ ...prev, visible: data.value === true }));
    } catch (error) {
      console.error("Error initializing leaderboard visibility:", error);
      alert("Failed to initialize leaderboard visibility setting");
    }
  };

  // Add the renderLeaderboardManagement function
  const renderLeaderboardManagement = () => {
    if (!isAuthenticated) return null;
    
    // Calculate auto ranks once for all users
    const usersWithAutoRank = users
      ? [...users]
          .sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))
          .map((user, index) => ({
            ...user,
            autoRank: index + 1
          }))
      : [];
    
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-[#F778BA]" />
            Leaderboard Management
          </h2>
          
          {settingsMessage && (
            <div className={`px-3 py-1 rounded-md text-sm flex items-center ${
              settingsMessage.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {settingsMessage.type === 'success' ? 
                <Check className="w-4 h-4 mr-1" /> : 
                <AlertTriangle className="w-4 h-4 mr-1" />
              }
              {settingsMessage.text}
            </div>
          )}
          </div>

        {/* Manual ranks summary section */}
        {usersWithAutoRank.length > 0 && (
          <div className="mb-6 bg-[#0d1117] rounded-lg border border-[#30363d] p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Current Manual Rankings</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {usersWithAutoRank
                .sort((a, b) => (a.autoRank || 0) - (b.autoRank || 0))
                .map(user => (
                  <div key={user.login} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 flex items-center">
                    <div className="relative mr-2">
                      <Image 
                        src={user.avatar_url || `https://avatars.githubusercontent.com/${user.login}`}
                        alt={user.login}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F778BA] rounded-full flex items-center justify-center text-xs font-bold">
                        {user.autoRank}
                      </div>
                    </div>
                    <span className="text-xs">{user.login}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Visibility Controls */}
          <div className="lg:col-span-1">
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] h-full">
              <div className="p-4 border-b border-[#30363d]">
                <h3 className="font-medium mb-2">Settings</h3>
                <p className="text-xs text-[#8b949e]">Control leaderboard visibility and initialize settings</p>
              </div>
              
              <div className="p-4">
                <div className="flex flex-col space-y-6">
            <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Leaderboard Visibility</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                <input
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={leaderboardSettings.visible}
                          onChange={(e) => setLeaderboardSettings(prev => ({...prev, visible: e.target.checked}))}
                        />
                        <div className="w-11 h-6 bg-[#21262d] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#238636]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center text-xs text-[#8b949e] mb-4">
                      <div className={`w-2 h-2 rounded-full mr-2 ${leaderboardSettings.visible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {leaderboardSettings.visible ? 
                        "Leaderboard is visible to all users" : 
                        "Leaderboard is hidden from users"
                      }
              </div>
            </div>

                  {leaderboardSettings.lastUpdated && (
                    <div className="text-xs text-[#8b949e] flex items-center pb-4 border-b border-[#30363d]">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last updated: {new Date(leaderboardSettings.lastUpdated).toLocaleString()}
              </div>
            )}

                  <div className="flex flex-col gap-3 pt-2">
            <button
                      onClick={saveLeaderboardSettings}
                      disabled={isSavingSettings}
                      className={`py-2 px-4 rounded-md transition-colors flex items-center justify-center ${
                        isSavingSettings 
                          ? 'bg-[#238636]/50 cursor-not-allowed' 
                          : 'bg-[#238636] hover:bg-[#238636]/90'
                      } text-white font-medium`}
                    >
                      {isSavingSettings ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Saving...
                </>
              ) : (
                <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                </>
              )}
            </button>

                    <button
                      onClick={initializeLeaderboard}
                      className="py-2 px-4 rounded-md bg-[#21262d] hover:bg-[#30363d] text-white font-medium transition-colors flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Initialize Settings
                    </button>
          </div>
        </div>
      </div>
            </div>
            
            {/* Add batch ranking tools */}
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] mt-4">
              <div className="p-4 border-b border-[#30363d]">
                <h3 className="font-medium mb-2">Batch Ranking Tools</h3>
                <p className="text-xs text-[#8b949e]">Quickly assign ranks to multiple users</p>
        </div>

              <div className="p-4">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => assignTopRanks(10)}
                    className="py-2 px-4 rounded-md bg-[#238636]/20 hover:bg-[#238636]/30 text-[#238636] border border-[#238636]/30 font-medium transition-colors flex items-center justify-center"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Rank Top 10 Users
                  </button>
                  
                  <button
                    onClick={() => assignTopRanks(20)}
                    className="py-2 px-4 rounded-md bg-[#238636]/20 hover:bg-[#238636]/30 text-[#238636] border border-[#238636]/30 font-medium transition-colors flex items-center justify-center"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Rank Top 20 Users
                  </button>
                  
                  <button
                    onClick={clearAllManualRanks}
                    className="py-2 px-4 rounded-md bg-[#F778BA]/20 hover:bg-[#F778BA]/30 text-[#F778BA] border border-[#F778BA]/30 font-medium transition-colors flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear All Manual Ranks
                  </button>
            </div>
          </div>
            </div>
          </div>
          
          {/* User Rankings */}
          <div className="lg:col-span-3">
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] h-full">
              <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
                <div>
                  <h3 className="font-medium mb-1">Manual User Rankings</h3>
                  <p className="text-xs text-[#8b949e]">Assign custom ranks to override the automatic point-based ranking</p>
            </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8b949e]" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-sm bg-[#161b22] border border-[#30363d] rounded-md w-full focus:outline-none focus:ring-1 focus:ring-[#F778BA] focus:border-[#F778BA]"
                    />
          </div>
                  
                  {/* Add level filter dropdown */}
                  <select
                    value={levelFilter || 'all'}
                    onChange={(e) => setLevelFilter(e.target.value === 'all' ? null : e.target.value)}
                    className="py-1.5 px-3 text-sm bg-[#161b22] border border-[#30363d] rounded-md focus:outline-none focus:ring-1 focus:ring-[#F778BA] focus:border-[#F778BA]"
                  >
                    <option value="all">All Levels</option>
                    <option value="Expert">Expert</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Newcomer">Newcomer</option>
                  </select>
            </div>
          </div>
              
              {/* Level-based tabs for larger screens */}
              <div className="hidden lg:flex border-b border-[#30363d]">
                <button
                  onClick={() => setLevelFilter(null)}
                  className={`px-4 py-2 text-sm font-medium ${!levelFilter ? 'border-b-2 border-[#F778BA] text-white' : 'text-[#8b949e] hover:text-white'}`}
                >
                  All ({usersWithAutoRank.length})
                </button>
                <button
                  onClick={() => setLevelFilter('Expert')}
                  className={`px-4 py-2 text-sm font-medium ${levelFilter === 'Expert' ? 'border-b-2 border-[#F778BA] text-white' : 'text-[#8b949e] hover:text-white'}`}
                >
                  Expert ({usersWithAutoRank.filter(u => u.stats?.level === 'Expert').length})
                </button>
                <button
                  onClick={() => setLevelFilter('Advanced')}
                  className={`px-4 py-2 text-sm font-medium ${levelFilter === 'Advanced' ? 'border-b-2 border-[#F778BA] text-white' : 'text-[#8b949e] hover:text-white'}`}
                >
                  Advanced ({usersWithAutoRank.filter(u => u.stats?.level === 'Advanced').length})
                </button>
                <button
                  onClick={() => setLevelFilter('Intermediate')}
                  className={`px-4 py-2 text-sm font-medium ${levelFilter === 'Intermediate' ? 'border-b-2 border-[#F778BA] text-white' : 'text-[#8b949e] hover:text-white'}`}
                >
                  Intermediate ({usersWithAutoRank.filter(u => u.stats?.level === 'Intermediate').length})
                </button>
                <button
                  onClick={() => setLevelFilter('Beginner')}
                  className={`px-4 py-2 text-sm font-medium ${levelFilter === 'Beginner' ? 'border-b-2 border-[#F778BA] text-white' : 'text-[#8b949e] hover:text-white'}`}
                >
                  Beginner ({usersWithAutoRank.filter(u => u.stats?.level === 'Beginner').length})
                </button>
                <button
                  onClick={() => setLevelFilter('Newcomer')}
                  className={`px-4 py-2 text-sm font-medium ${levelFilter === 'Newcomer' ? 'border-b-2 border-[#F778BA] text-white' : 'text-[#8b949e] hover:text-white'}`}
                >
                  Newcomer ({usersWithAutoRank.filter(u => u.stats?.level === 'Newcomer').length})
                </button>
        </div>

              <div className="max-h-[400px] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#161b22] sticky top-0 z-10">
                      <tr className="text-left text-[#8b949e] border-b border-[#30363d]">
                        <th className="p-3">User</th>
                        <th className="p-3">Points</th>
                        <th className="p-3">Auto Rank</th>
                        <th className="p-3">Manual Rank</th>
                        <th className="p-3">Visibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .sort((a, b) => (b.stats.points || 0) - (a.stats.points || 0))
                        .map((user, index) => (
                          <tr key={user.login} className="border-t border-[#30363d] hover:bg-[#161b22]">
                            <td className="p-3 flex items-center gap-2">
                              <Image 
                                src={user.avatar_url || `https://avatars.githubusercontent.com/${user.login}`}
                                alt={user.login}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                              <span className="text-sm">{user.login}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={tempPoints[user.login] !== undefined ? tempPoints[user.login] : user.stats.points || 0}
                                  onChange={(e) => {
                                    const newPoints = parseInt(e.target.value) || 0;
                                    setTempPoints(prev => ({
                                      ...prev,
                                      [user.login]: newPoints
                                    }));
                                    debouncedUpdatePoints({ username: user.login, points: newPoints });
                                  }}
                                  className={`w-20 px-2 py-1 bg-[#0d1117] border ${
                                    isUpdatingPoints[user.login] 
                                      ? 'border-[#238636]' 
                                      : 'border-[#30363d]'
                                  } rounded-md`}
                                  disabled={isUpdatingPoints[user.login]}
                                />
                                {isUpdatingPoints[user.login] && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#238636] border-t-transparent"/>
                                )}
                              </div>
                            </td>
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
                                  updateUserRank(user.login, rank, user.stats.points);
                                }}
                                className="w-16 px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded-md"
                              />
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => toggleUserVisibility(user.login, !user.stats.hidden)}
                                className={`px-3 py-1 rounded-md text-sm ${
                                  user.stats.hidden
                                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                    : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                }`}
                              >
                                {user.stats.hidden ? 'Hidden' : 'Visible'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add the clearAllManualRanks function to remove all manual ranks
  const clearAllManualRanks = async () => {
    if (!users || users.length === 0) return;
    
    // Get users with manual ranks
    const usersWithManualRanks = users.filter(user => user.stats?.manualRank);
    
    if (usersWithManualRanks.length === 0) {
      setSettingsMessage({ 
        type: 'success', 
        text: 'No manual ranks to clear' 
      });
      setTimeout(() => setSettingsMessage(null), 2000);
      return;
    }
    
    // Confirm with the user
    if (!confirm(`Are you sure you want to clear manual ranks for ${usersWithManualRanks.length} users?`)) {
      return;
    }
    
    setSettingsMessage({ 
      type: 'success', 
      text: 'Clearing all manual ranks...' 
    });
    
    // Clear each user's manual rank
    for (const user of usersWithManualRanks) {
      await updateUserRank(user.login, null);
    }
    
    // Show success message
    setSettingsMessage({ 
      type: 'success', 
      text: `Cleared manual ranks for ${usersWithManualRanks.length} users` 
    });
    
    // Refresh the user list
    fetchUsers();
    
    // Clear the message after a few seconds
    setTimeout(() => setSettingsMessage(null), 3000);
  };

  // Add the assignTopRanks function to automatically assign ranks to top users
  const assignTopRanks = (count: number) => {
    if (!users || users.length === 0) return;
    
    // Sort users by points to find the top performers
    const topUsers = [...users]
      .sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))
      .slice(0, count);
    
    // Assign ranks 1 through count
    topUsers.forEach((user, index) => {
      updateUserRank(user.login, index + 1);
    });
    
    setSettingsMessage({ 
      type: 'success', 
      text: `Assigned ranks 1-${count} to top users by points` 
    });
    
    setTimeout(() => setSettingsMessage(null), 3000);
  };

  // Add this function near your other admin functions
  const toggleUserVisibility = async (username: string, hidden: boolean) => {
    try {
      const userRef = ref(db, `test/manualRanks/${username}`);
      
      // First get existing data to preserve other fields
      const snapshot = await get(userRef);
      const existingData = snapshot.exists() ? snapshot.val() : {};
      
      // Update with existing data plus new hidden status
      await update(userRef, {
        ...existingData,
        hidden,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.login === username) {
          return {
            ...user,
            stats: {
              ...user.stats,
              hidden
            }
          };
        }
        return user;
      }));
      
      console.log(`User ${username} visibility updated: ${hidden ? 'hidden' : 'visible'}`);
    } catch (error) {
      console.error("Error updating user visibility:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto mt-20 p-6 bg-[#161b22] border border-[#30363d] rounded-lg">
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
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Link href="/skillfest" className="mr-4">
                  <ArrowLeft className="w-5 h-5 text-[#8b949e] hover:text-white transition-colors" />
                </Link>
                <h1 className="text-2xl font-bold flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-[#F778BA]" />
                  Admin Portal
                </h1>
              </div>
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-2 text-[#F778BA]" />
                <span className="text-sm text-[#8b949e]">Restricted Access</span>
              </div>
            </div>
            
            {renderLeaderboardManagement()}
            
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
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F778BA] border-t-transparent"></div>
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
        </div>
        </div>
      )}
      
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
                    onChange={(e) => setLeaderboardSettings(prev => ({...prev, visible: e.target.checked}))}
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
                                updateUserRank(user.login, rank, user.stats.points);
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
      
      {/* Update the initialize button */}
      <div className="flex gap-3">
        <button
          onClick={initializeLeaderboard}
          className="px-4 py-2 text-sm bg-[#238636] hover:bg-[#238636]/90 text-white rounded-md transition-colors"
        >
          Initialize Leaderboard Setting
        </button>
        
        <button
          onClick={clearAllManualRanks}
          className="px-4 py-2 text-sm bg-[#30363d] hover:bg-[#21262d] text-white rounded-md transition-colors"
        >
          Clear All Manual Ranks
        </button>
      </div>

      {/* Add this to your admin navigation or dashboard */}
      <Link 
        href="/admin/applications" 
        className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg hover:border-[#238636] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#238636]/10">
            <Users className="w-5 h-5 text-[#238636]" />
          </div>
          <div>
            <h3 className="font-medium text-white">Fresher Applications</h3>
            <p className="text-sm text-[#8b949e]">View and manage applications</p>
          </div>
        </div>
      </Link>
    </div>
  );
} 