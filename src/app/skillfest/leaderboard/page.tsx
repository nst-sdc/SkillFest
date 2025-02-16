'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Trophy, GitPullRequest, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from 'next/image';

type Contributor = {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
  rank?: number;
};

export default function Leaderboard() {
  const { data: session } = useSession();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      fetchContributors(session.accessToken);
    }
  }, [session]);

  const fetchContributors = async (token: string) => {
    setLoading(true);
    try {
      const reposResponse = await fetch('https://api.github.com/orgs/nst-sdc/repos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!reposResponse.ok) throw new Error(`GitHub API error: ${reposResponse.status}`);

      const repos = await reposResponse.json();
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
      const contributorMap = new Map<string, Contributor>();
      
      allContributors.flat().forEach((contributor: Contributor) => {
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

      const sortedContributors = Array.from(contributorMap.values())
        .sort((a, b) => b.contributions - a.contributions)
        .map((contributor, index) => ({
          ...contributor,
          rank: index + 1
        }));

      setContributors(sortedContributors);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionStyle = (rank: number) => {
    switch(rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-amber-700 to-amber-800';
      default: return 'from-[#238636]/50 to-[#2ea043]/50';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <Link 
          href="/skillfest"
          className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to SkillFest
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4 text-foreground">SkillFest Leaderboard</h1>
            <p className="text-[#8b949e]">Top contributors will be selected to join the club</p>
          </div>

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
                          <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                            <GitPullRequest className="w-4 h-4" />
                            <span>{contributor.contributions} contributions</span>
                          </div>
                        </div>
                        <div className="text-right">
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
      </main>
    </div>
  );
} 