'use client';

import { useState } from "react";
import { ArrowLeft, Shield, Lock, Eye, EyeOff } from "lucide-react";
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

export default function AdminPortal() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white p-8">
        <div className="max-w-md mx-auto bg-[#161b22] border border-[#30363d] rounded-xl p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-[#F778BA] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
            <p className="text-[#8b949e] mb-6">
              Enter the admin password to access the dashboard.
            </p>
          </div>
          
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#F778BA]" />
              Admin Login
            </h2>
            
            {error && (
              <div className="bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm text-[#8b949e] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-white p-2 rounded-lg focus:outline-none"
                  placeholder="Enter admin password"
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
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Login as Admin</span>
                </>
              )}
            </button>
          </div>
          
          <div className="text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-[#8b949e] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard view
  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#8b949e] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="bg-[#238636] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Admin Access
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0d1117] p-4 rounded-lg">
              <div className="text-[#8b949e] text-sm mb-1">Total Users</div>
              <div className="text-2xl font-bold text-white">{users.length}</div>
            </div>
            <div className="bg-[#0d1117] p-4 rounded-lg">
              <div className="text-[#8b949e] text-sm mb-1">Total PRs</div>
              <div className="text-2xl font-bold text-white">
                {users.reduce((sum, user) => sum + user.stats.totalPRs, 0)}
              </div>
            </div>
            <div className="bg-[#0d1117] p-4 rounded-lg">
              <div className="text-[#8b949e] text-sm mb-1">Merged PRs</div>
              <div className="text-2xl font-bold text-white">
                {users.reduce((sum, user) => sum + user.stats.mergedPRs, 0)}
              </div>
            </div>
            <div className="bg-[#0d1117] p-4 rounded-lg">
              <div className="text-[#8b949e] text-sm mb-1">Total Contributions</div>
              <div className="text-2xl font-bold text-white">
                {users.reduce((sum, user) => sum + user.stats.contributions, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">User List</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#30363d]">
                  <th className="text-left py-3 px-4 text-[#8b949e]">User</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Level</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Points</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">PRs</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Merged PRs</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Org PRs</th>
                  <th className="text-left py-3 px-4 text-[#8b949e]">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users.sort((a, b) => b.stats.points - a.stats.points).map((user) => (
                  <tr key={user.login} className="border-b border-[#30363d] hover:bg-[#30363d]/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Image 
                          src={user.avatar_url} 
                          alt={user.login}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <a 
                          href={`https://github.com/${user.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#58a6ff] transition-colors"
                        >
                          {user.login}
                        </a>
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
                    <td className="py-3 px-4">{user.stats.totalPRs}</td>
                    <td className="py-3 px-4">{user.stats.mergedPRs}</td>
                    <td className="py-3 px-4">{user.stats.orgPRs} / {user.stats.orgMergedPRs}</td>
                    <td className="py-3 px-4 text-[#8b949e]">
                      {user.lastActive.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 