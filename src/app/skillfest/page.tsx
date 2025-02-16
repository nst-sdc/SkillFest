'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Github, Terminal, Code, GitPullRequest, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { useEffect, useState } from "react";

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
  const { data: session, status } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#238636]/10 mb-6">
              <Terminal className="w-8 h-8 text-[#238636]" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">Developer Application</h1>
            <p className="text-[#8b949e]">Complete coding challenges and showcase your skills</p>
          </div>

          {status === 'loading' ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238636]" />
            </div>
          ) : !session ? (
            <div className="text-center">
              <div className="max-w-sm mx-auto p-8 rounded-lg border border-[#30363d] bg-[#161b22] backdrop-blur-sm">
                <Github className="w-12 h-12 text-[#8b949e] mx-auto mb-6" />
                <p className="text-[#8b949e] mb-6">
                  Sign in with GitHub to start your application process and track your progress
                </p>
                <SignInButton />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22]">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={session.user?.image!} 
                    alt={session.user?.name!} 
                    className="w-12 h-12 rounded-full border-2 border-[#238636]"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-white">Welcome, {session.user?.name}</h2>
                    <p className="text-[#8b949e]">Choose an issue to start contributing</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238636] mx-auto" />
                    </div>
                  ) : issues.length > 0 ? (
                    issues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-[#8b949e]">
                      No open issues available at the moment.
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-[#238636]/10 to-transparent border border-[#238636]/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#238636]/10">
                      <Github className="w-5 h-5 text-[#238636]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#238636] mb-1">How to Contribute</h3>
                      <p className="text-sm text-[#8b949e]">
                        1. Choose an issue that interests you<br />
                        2. Fork the repository and create your solution<br />
                        3. Submit a pull request with your changes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
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