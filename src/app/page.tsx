/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { SignInButton } from "@/components/sign-in-button";
import { ArrowRight, Code, PenTool } from "lucide-react";
import Link from "next/link";
import { useState } from 'react';
import { useSession } from "next-auth/react";
import { LoginPopup } from "@/components/login-popup";
import { Session } from "next-auth";

export default function Home() {
  const { data: session } = useSession();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-20 space-y-6">
          <div className="inline-block">
            <span className="bg-[#238636] text-white text-sm font-medium px-4 py-1.5 rounded-full">
              Recruitment Open 2025
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">
            Dev Club Recruitment
          </h1>
          <p className="text-xl text-[#8b949e] max-w-2xl mx-auto">
            Join our elite team of developers, designers, and creators
          </p>
          
          <div className="flex items-center justify-center mt-12">
            <SignInButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto px-4">
          <CategoryCard 
            title="Developer"
            description="Join our development team and build amazing projects"
            icon={<Code className="w-7 h-7 text-[#238636]" />}
            points={[
              "Work on real-world projects",
              "Learn modern technologies",
              "Collaborate with the team"
            ]}
            color="#238636"
            session={session}
            onLoginRequired={() => setShowLoginPopup(true)}
          />
          <CategoryCard 
            title="Creative Lead"
            description="Lead our creative initiatives and branding"
            icon={<PenTool className="w-7 h-7 text-[#F778BA]" />}
            points={[
              "Manage social media",
              "Create club branding",
              "Design marketing materials"
            ]}
            color="#F778BA"
            session={session}
            onLoginRequired={() => setShowLoginPopup(true)}
          />
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Selection Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-10">
            <StepCard 
              step="01"
              title="Apply"
              description="Sign up and choose your role"
            />
            <StepCard 
              step="02"
              title="Interview"
              description="Show us your skills and passion"
            />
            <StepCard 
              step="03"
              title="Join the Team"
              description="Start creating amazing things"
            />
          </div>
        </div>
      </main>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

type CategoryCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  points: string[];
  color: string;
  session: Session | null;
  onLoginRequired: () => void;
};

function CategoryCard({ 
  title, 
  description, 
  icon,
  points,
  color,
  session,
  onLoginRequired
}: CategoryCardProps) {
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      onLoginRequired();
    }
  };

  const isCreative = title === "Creative Lead";

  return (
    <div className={`group p-8 rounded-xl border bg-[#161b22] transition-all duration-300 
      ${isCreative 
        ? 'border-[#F778BA]/30 hover:border-[#F778BA] bg-gradient-to-br from-[#F778BA]/5 to-[#A371F7]/5' 
        : 'border-[#30363d] hover:border-[#238636]'} 
      hover:shadow-lg ${isCreative ? 'hover:shadow-[#F778BA]/10' : 'hover:shadow-[#238636]/10'}`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl transition-colors duration-300 
          ${isCreative 
            ? 'bg-gradient-to-r from-[#F778BA]/10 to-[#A371F7]/10 group-hover:from-[#F778BA]/20 group-hover:to-[#A371F7]/20' 
            : `bg-[${color}]/10 group-hover:bg-[${color}]/20`}`}
        >
          {icon}
        </div>
        <h3 className={`text-2xl font-bold text-white transition-colors duration-300 
          ${isCreative 
            ? 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#F778BA] group-hover:to-[#A371F7]' 
            : `group-hover:text-[${color}]`}`}
        >
          {title}
        </h3>
      </div>
      <p className="text-[#8b949e] mb-8 text-lg">{description}</p>
      <ul className="space-y-4 mb-8">
        {points.map((point, index) => (
          <li key={index} className="flex items-center gap-3 text-[#8b949e] group-hover:text-white/80 transition-colors duration-300">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isCreative 
                ? 'bg-gradient-to-r from-[#F778BA] to-[#A371F7]' 
                : `bg-[${color}]`
            }`} />
            {point}
          </li>
        ))}
      </ul>
      <Link 
        href={session ? (
          title === "Developer" ? "/skillfest" : 
          "/creative"
        ) : "#"}
        onClick={handleClick}
        className={`w-full py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium group-hover:scale-[1.02] ${
          isCreative 
            ? 'bg-gradient-to-r from-[#F778BA]/20 to-[#A371F7]/20 hover:from-[#F778BA] hover:to-[#A371F7] text-[#F778BA] hover:text-white' 
            : `bg-[${color}]/20 hover:bg-[${color}] text-[${color}] hover:text-white`
        }`}
      >
        Apply Now <ArrowRight className="w-4 h-4" />
      </Link>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22]">
      <div className="text-sm font-mono text-[#238636] mb-2">{step}</div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-[#8b949e] text-sm">{description}</p>
    </div>
  );
}
