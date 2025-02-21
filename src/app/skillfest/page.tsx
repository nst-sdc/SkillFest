'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Github, Code, GitPullRequest, ExternalLink, Trophy, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { useEffect, useState } from "react";
import { LoginPopup } from "@/components/login-popup";
import Image from 'next/image';

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

// Update the session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export default function SkillFest() {
  const { data: session } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      fetchIssues(session.accessToken);
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

      const repos: Array<{ name: string }> = await reposResponse.json();
      
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
          const issues = await issuesResponse.json() as Issue[];
          return issues.map((issue: Issue) => ({
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
      if (error instanceof Error) {
        console.error('Error fetching issues:', error.message);
      } else {
        console.error('Error fetching issues:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#238636]/10 via-transparent to-transparent" />
      </div>

      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-16">
          <Link 
            href="/"
            className="group inline-flex items-center gap-3 relative overflow-hidden px-4 py-2 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-[#238636] transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 text-[#238636] group-hover:-translate-x-1 transition-transform" />
            <span className="text-[#8b949e] group-hover:text-white transition-colors">Back to home</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative min-h-[70vh] flex items-center justify-center -mt-8">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#238636]/10 rounded-full blur-[100px] animate-pulse" />
          </div>

          <div className="relative text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#238636]/10 border border-[#238636]/20">
              <div className="w-2 h-2 rounded-full bg-[#238636] animate-pulse" />
              <span className="text-[#238636] font-medium">SkillFest 2025 is now live</span>
            </div>

            {/* Title */}
            <div className="space-y-6">
              <h1 className="text-7xl md:text-8xl font-bold tracking-tight">
                <span className="text-white">Developer</span>
                <br />
                <span className="text-[#238636]">Challenge</span>
              </h1>
              <p className="text-xl text-[#8b949e] max-w-2xl mx-auto">
                Join our elite development team through a 
                <span className="text-white"> month-long </span> 
                open source contribution program
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
              <StatsBox number="15" label="Positions" />
              <StatsBox number={issues.length.toString()} label="Challenges" />
              <StatsBox number="30" label="Days" />
            </div>
          </div>
        </div>

        {/* Leaderboard Banner */}
        <div className="mb-24">
          <Link 
            href="/skillfest/leaderboard"
            className="group block relative overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]/95 p-8 hover:border-[#238636] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Trophy className="w-12 h-12 text-[#238636]" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">View Leaderboard</h2>
                    <span className="px-2 py-1 text-xs rounded-full bg-[#238636]/10 text-[#238636] border border-[#238636]/20">
                      Live
                    </span>
                  </div>
                  <p className="text-[#8b949e]">Track your progress • Top 15 qualify</p>
                </div>
              </div>
              <ArrowLeft className="w-6 h-6 text-[#238636] rotate-180 group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Stats Section with hexagon design */}
        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Position Stats */}
            <div className="group relative bg-[#161b22] border border-[#30363d] rounded-lg p-8 hover:border-[#238636] transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#238636]/5 rounded-full blur-3xl group-hover:bg-[#238636]/10 transition-all duration-500" />
              <div className="relative flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-[#238636]/10 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-[#238636]" />
                  </div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2">15</div>
                  <div className="text-[#8b949e]">Developer Positions</div>
                </div>
              </div>
            </div>

            {/* Issues Stats */}
            <div className="group relative bg-[#161b22] border border-[#30363d] rounded-lg p-8 hover:border-[#238636] transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#238636]/5 rounded-full blur-3xl group-hover:bg-[#238636]/10 transition-all duration-500" />
              <div className="relative flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-[#238636]/10 group-hover:scale-110 transition-transform duration-300">
                    <GitPullRequest className="w-8 h-8 text-[#238636]" />
                  </div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2">{issues.length}</div>
                  <div className="text-[#8b949e]">Open Challenges</div>
                </div>
              </div>
            </div>

            {/* Days Stats */}
            <div className="group relative bg-[#161b22] border border-[#30363d] rounded-lg p-8 hover:border-[#238636] transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#238636]/5 rounded-full blur-3xl group-hover:bg-[#238636]/10 transition-all duration-500" />
              <div className="relative flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-[#238636]/10 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-8 h-8 text-[#238636]" />
                  </div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2">30</div>
                  <div className="text-[#8b949e]">Days Challenge</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="mb-24 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Leaderboard Preview</h2>
          <p className="text-[#8b949e] mb-16">Top contributors of the challenge</p>

          <div className="flex justify-center items-center gap-32">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="text-[#8b949e] mb-4">2nd Place</div>
              <Image
                src="https://github.com/mrgear111.png"
                alt="mrgear111"
                width={96}
                height={96}
                className="rounded-full border-4 border-[#238636] mb-4"
              />
              <div className="text-white text-xl mb-2">mrgear111</div>
              <div className="text-[#238636]">2/3 PRs</div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <Trophy className="w-8 h-8 text-[#238636] mx-auto mb-2" />
              <div className="text-[#238636] mb-4">1st Place</div>
              <Image
                src="https://github.com/craftywebbz.png"
                alt="craftywebbz"
                width={120}
                height={120}
                className="rounded-full border-4 border-[#238636] mb-4"
              />
              <div className="text-white text-xl mb-2">craftywebbz</div>
              <div className="text-[#238636]">2/5 PRs</div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="text-[#8b949e] mb-4">3rd Place</div>
              <Image
                src="https://github.com/ghost.png"
                alt="Coming Soon"
                width={96}
                height={96}
                className="rounded-full border-4 border-[#30363d] mb-4"
              />
              <div className="text-white text-xl mb-2">Coming Soon</div>
              <div className="text-[#8b949e]">0 PRs</div>
            </div>
          </div>

          <Link 
            href="/skillfest/leaderboard"
            className="inline-flex items-center gap-2 text-[#238636] hover:text-white transition-colors mt-12"
          >
            View Complete Leaderboard
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Show loading state while fetching */}
        {loading && <LoadingState />}

        {/* Show sign in prompt if no session */}
        {!session && <SignInPrompt />}

        {/* Show empty state if no issues */}
        {session && issues.length === 0 && !loading && <EmptyState />}

        {/* Show issues if available */}
        {session && issues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </main>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

function StatsBox({ number, label }: { number: string; label: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#238636]/20 to-[#2ea043]/20 rounded-xl blur group-hover:opacity-100 transition-opacity" />
      <div className="relative p-4 bg-[#161b22]/80 backdrop-blur-sm rounded-xl border border-[#30363d]">
        <div className="text-3xl font-bold text-white mb-1">{number}</div>
        <div className="text-sm text-[#8b949e]">{label}</div>
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <a
      href={issue.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block relative overflow-hidden rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#238636] transition-all duration-300"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#238636] transition-colors">
          {issue.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-[#8b949e]">
          <Code className="w-4 h-4" />
          <span>{issue.repository.name}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {issue.labels.map(label => (
            <span
              key={label.name}
              className="px-2 py-1 text-xs rounded-full"
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
        <ExternalLink className="absolute top-6 right-6 w-5 h-5 text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
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
        <h3 className="text-xl font-bold text-white mb-4">Join SkillFest 2025</h3>
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