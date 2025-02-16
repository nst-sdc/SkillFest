'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Code, ExternalLink, Search, Filter } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { useEffect, useState } from "react";

// ... keep the Issue type from skillfest/page.tsx

export default function Issues() {
  const { data: session, status } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  // ... keep the fetchIssues function from skillfest/page.tsx

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
            <h1 className="text-3xl font-bold mb-4 text-foreground">Available Challenges</h1>
            <p className="text-[#8b949e]">Choose an issue to start contributing</p>
          </div>

          {status === 'loading' ? (
            <LoadingState />
          ) : !session ? (
            <SignInPrompt />
          ) : (
            <div className="space-y-8">
              <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22]">
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1f2428] border border-[#30363d] text-white focus:outline-none focus:border-[#238636]"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                    <select className="pl-10 pr-4 py-2 rounded-lg bg-[#1f2428] border border-[#30363d] text-white focus:outline-none focus:border-[#238636] appearance-none">
                      <option value="all">All Difficulties</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
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
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ... keep the IssueCard, LoadingState, and EmptyState components 