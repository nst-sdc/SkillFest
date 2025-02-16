'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Github, Terminal, Code, GitPullRequest, ExternalLink, Star, Trophy, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { useEffect, useState } from "react";
import { LoginPopup } from "@/components/login-popup";

type Issue = {
  id: number;
  title: string;
  html_url: string;
  repository: {
    name: string;
  };
  labels: {
    name: string;
    color: string;
  }[];
};

type StarPosition = {
  left: string;
  top: string;
  delay: string;
};

type Contributor = {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
};

// Update the session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export default function SkillFest() {
  const { data: session, status } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [stars, setStars] = useState<StarPosition[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    // Generate star positions on the client side
    const newStars = Array.from({ length: 50 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`
    }));
    setStars(newStars);
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      fetchIssues(session.accessToken);
      fetchContributors(session.accessToken);
    }
  }, [session]);

  const fetchIssues = async (token: string) => {
    setLoading(true);
    try {
      // First, get all repositories from the organization
      const reposResponse = await fetch('https://api.github.com/orgs/nst-sdc/repos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!reposResponse.ok) {
        throw new Error(`GitHub API error: ${reposResponse.status}`);
      }

      const repos = await reposResponse.json();
      
      // Then, fetch issues from each repository
      const allIssuesPromises = repos.map(async (repo: { name: string }) => {
        const issuesResponse = await fetch(
          `https://api.github.com/repos/nst-sdc/${repo.name}/issues?state=open`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        
        if (issuesResponse.ok) {
          const issues = await issuesResponse.json();
          return issues.map((issue: any) => ({
            ...issue,
            repository: {
              name: repo.name,
            },
          }));
        }
        return [];
      });

      const allIssues = await Promise.all(allIssuesPromises);
      const flattenedIssues = allIssues.flat();
      setIssues(flattenedIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
    setLoading(false);
  };

  const fetchContributors = async (token: string) => {
    try {
      const reposResponse = await fetch('https://api.github.com/orgs/nst-sdc/repos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!reposResponse.ok) {
        throw new Error(`GitHub API error: ${reposResponse.status}`);
      }

      const repos = await reposResponse.json();
      
      // Fetch contributors from each repo
      const allContributorsPromises = repos.map(async (repo: { name: string }) => {
        const contributorsResponse = await fetch(
          `https://api.github.com/repos/nst-sdc/${repo.name}/contributors`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );
        
        if (contributorsResponse.ok) {
          return await contributorsResponse.json();
        }
        return [];
      });

      const allContributors = await Promise.all(allContributorsPromises);
      
      // Combine and aggregate contributions
      const contributorMap = new Map<string, Contributor>();
      
      allContributors.flat().forEach((contributor: any) => {
        if (contributorMap.has(contributor.login)) {
          const existing = contributorMap.get(contributor.login)!;
          existing.contributions += contributor.contributions;
        } else {
          contributorMap.set(contributor.login, {
            login: contributor.login,
            avatar_url: contributor.avatar_url,
            contributions: contributor.contributions,
            html_url: contributor.html_url,
          });
        }
      });

      // Convert to array and sort by contributions
      const sortedContributors = Array.from(contributorMap.values())
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 5); // Get top 5

      setContributors(sortedContributors);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowLoginPopup(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars-container">
          {stars.map((star, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: star.left,
                top: star.top,
                animationDelay: star.delay
              }}
            />
          ))}
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#238636] to-[#2ea043] mb-8 transform hover:scale-110 transition-transform">
              <Terminal className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 text-foreground bg-gradient-to-r from-[#238636] to-[#2ea043] text-transparent bg-clip-text">
              Welcome to SkillFest 2024
            </h1>
            <p className="text-xl text-[#8b949e] max-w-2xl mx-auto">
              Showcase your skills, contribute to open source, and join our development team
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center text-white mb-8">Top Contributors</h2>
            <div className="grid grid-cols-5 gap-4">
              {contributors.map((contributor, index) => (
                <a
                  key={contributor.login}
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <div className={`
                    absolute -inset-0.5 bg-gradient-to-r 
                    ${index === 0 ? 'from-yellow-400 to-yellow-600' : 
                      index === 1 ? 'from-gray-300 to-gray-400' :
                      index === 2 ? 'from-amber-700 to-amber-800' :
                      'from-[#238636]/50 to-[#2ea043]/50'}
                    rounded-lg opacity-75 group-hover:opacity-100 transition duration-200
                    ${index === 0 ? 'animate-pulse' : ''}
                  `} />
                  <div className="relative p-4 bg-[#161b22] rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={contributor.avatar_url}
                          alt={contributor.login}
                          className="w-16 h-16 rounded-full mb-2"
                        />
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-white font-medium text-sm truncate max-w-full">
                        {contributor.login}
                      </span>
                      <span className="text-[#8b949e] text-xs">
                        {contributor.contributions} contributions
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatsCard 
              icon={<GitPullRequest className="w-6 h-6" />}
              title="Open Issues"
              value={issues.length.toString()}
              description="Available challenges"
            />
            <StatsCard 
              icon={<Trophy className="w-6 h-6" />}
              title="Top Contributors"
              value="10"
              description="Positions available"
            />
            <StatsCard 
              icon={<Users className="w-6 h-6" />}
              title="Active Participants"
              value="25+"
              description="Join the community"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <Link 
              href={session ? "/skillfest/issues" : "#"}
              onClick={handleApplyClick}
              className="p-6 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#238636] group transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#238636]/10">
                  <Code className="w-6 h-6 text-[#238636]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#238636] transition-colors">
                    Browse Challenges
                  </h3>
                  <p className="text-[#8b949e] mb-4">
                    Find issues to work on and start contributing
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#238636]">{issues.length} open issues</span>
                    <span className="text-[#8b949e]">•</span>
                    <span className="text-[#8b949e]">Various difficulty levels</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link 
              href="/skillfest/leaderboard"
              className="p-6 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#238636] group transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#238636]/10">
                  <Trophy className="w-6 h-6 text-[#238636]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#238636] transition-colors">
                    View Leaderboard
                  </h3>
                  <p className="text-[#8b949e] mb-4">
                    Track your ranking and see top contributors
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#238636]">{contributors.length} participants</span>
                    <span className="text-[#8b949e]">•</span>
                    <span className="text-[#8b949e]">Top 15 qualify</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-lg border border-[#30363d] bg-[#161b22]">
              <h4 className="text-sm font-medium text-[#8b949e] mb-2">Next Steps</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#238636]" />
                  <span className="text-white">Fork the repository</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8b949e]" />
                  <span className="text-[#8b949e]">Submit first PR</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8b949e]" />
                  <span className="text-[#8b949e]">Complete 3 contributions</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-[#30363d] bg-[#161b22]">
              <h4 className="text-sm font-medium text-[#8b949e] mb-2">Your Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Repositories</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Issues Solved</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Code Reviews</span>
                  <span className="text-white">0</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-[#30363d] bg-[#161b22]">
              <h4 className="text-sm font-medium text-[#8b949e] mb-2">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Started</span>
                  <span className="text-white">Mar 15, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Deadline</span>
                  <span className="text-white">Apr 15, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Days Left</span>
                  <span className="text-white">30</span>
                </div>
              </div>
            </div>
          </div>

          {status === 'loading' ? (
            <LoadingState />
          ) : !session ? (
            <SignInPrompt />
          ) : (
            <div className="space-y-8">
              <div className="p-8 rounded-lg border border-[#30363d] bg-[#161b22] backdrop-blur-sm">
                <div className="flex items-center gap-6 mb-8">
                  <img 
                    src={session.user?.image!} 
                    alt={session.user?.name!} 
                    className="w-16 h-16 rounded-full border-4 border-[#238636]"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome, {session.user?.name}</h2>
                    <p className="text-[#8b949e]">Ready to start contributing? Choose an issue below!</p>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Search issues..."
                    className="flex-1 px-4 py-2 rounded-lg bg-[#1f2428] border border-[#30363d] text-white focus:outline-none focus:border-[#238636]"
                  />
                  <select className="px-4 py-2 rounded-lg bg-[#1f2428] border border-[#30363d] text-white focus:outline-none focus:border-[#238636]">
                    <option value="all">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <LoadingState />
                  ) : issues.length > 0 ? (
                    issues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </div>

                <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-[#238636]/10 to-transparent border border-[#238636]/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-[#238636]/10">
                      <Star className="w-6 h-6 text-[#238636]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#238636] mb-2">How to Get Selected</h3>
                      <div className="space-y-2 text-[#8b949e]">
                        <p>1. Fork repositories and start contributing</p>
                        <p>2. Submit quality pull requests</p>
                        <p>3. Top contributors will be invited to join the team</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <a 
      href={issue.html_url}
      target="_blank"
      rel="noopener noreferrer" 
      className="group block p-4 rounded-lg border border-[#30363d] hover:border-[#8b949e] transition-all duration-200 hover:bg-[#1f2428]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-[#238636]" />
            <p className="text-sm text-[#8b949e]">{issue.repository.name}</p>
          </div>
          <h3 className="text-white font-medium group-hover:text-[#238636] transition-colors">{issue.title}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {issue.labels.map((label) => (
              <span 
                key={label.name}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ 
                  backgroundColor: `#${label.color}20`,
                  color: `#${label.color}`,
                  border: `1px solid #${label.color}40`
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-[#8b949e] group-hover:text-[#238636] transition-colors" />
      </div>
    </a>
  );
}

function StatsCard({ icon, title, value, description }: { 
  icon: React.ReactNode; 
  title: string; 
  value: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#238636] transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-[#238636]/10">
          {icon}
        </div>
        <div>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
          <p className="text-sm text-[#8b949e]">{title}</p>
          <p className="text-xs text-[#8b949e] mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238636]" />
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="text-center">
      <div className="max-w-sm mx-auto p-8 rounded-lg border border-[#30363d] bg-[#161b22] backdrop-blur-sm">
        <Github className="w-16 h-16 text-[#8b949e] mx-auto mb-6" />
        <h3 className="text-xl font-bold text-white mb-4">Join SkillFest 2024</h3>
        <p className="text-[#8b949e] mb-6">
          Sign in with GitHub to start your journey and track your progress
        </p>
        <SignInButton />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-[#8b949e]">
      <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg">No open issues available at the moment.</p>
      <p className="text-sm">Check back soon for new challenges!</p>
    </div>
  );
} 