'use client';

import { SignInButton } from "@/components/sign-in-button";
import { ArrowRight, Code, Palette, PenTool } from "lucide-react";
import Link from "next/link";
import { useState } from 'react';
import { useSession } from "next-auth/react";
import { LoginPopup } from "@/components/login-popup";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-20 space-y-6">
          <div className="inline-block">
            <span className="bg-[#238636] text-white text-sm font-medium px-4 py-1.5 rounded-full">
              Recruitment Open 2024
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">
            Dev Club Recruitment
          </h1>
          <p className="text-xl text-[#8b949e] max-w-2xl mx-auto">
            Join our elite team of developers, designers, and creators
          </p>
          
          <div className="flex justify-center mt-8 gap-4">
            <SignInButton />
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <CategoryCard 
            title="Developer"
            description="Join our development team and build amazing projects"
            icon={<Code className="w-6 h-6 text-[#238636]" />}
            points={[
              "Work on real-world projects",
              "Learn modern technologies",
              "Collaborate with the team"
            ]}
          />
          <CategoryCard 
            title="UI/UX Designer"
            description="Create beautiful and intuitive user experiences"
            icon={<Palette className="w-6 h-6 text-[#A371F7]" />}
            points={[
              "Design user interfaces",
              "Create design systems",
              "Improve user experience"
            ]}
          />
          <CategoryCard 
            title="Creative Lead"
            description="Lead our creative initiatives and branding"
            icon={<PenTool className="w-6 h-6 text-[#F778BA]" />}
            points={[
              "Manage social media",
              "Create club branding",
              "Design marketing materials"
            ]}
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
    </div>
  );
}

function CategoryCard({ 
  title, 
  description, 
  icon,
  points 
}: { 
  title: string;
  description: string;
  icon: React.ReactNode;
  points: string[];
}) {
  const { data: session } = useSession();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowLoginPopup(true);
    }
  };

  return (
    <div className="group p-6 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#8b949e] transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[#1f2428]">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      <p className="text-[#8b949e] mb-6">{description}</p>
      <ul className="space-y-3 mb-6">
        {points.map((point, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-[#8b949e]">
            <div className="w-1 h-1 rounded-full bg-[#8b949e]" />
            {point}
          </li>
        ))}
      </ul>
      <Link 
        href={session ? (title === "Developer" ? "/skillfest" : "/register") : "#"}
        onClick={handleClick}
        className="w-full py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition-colors flex items-center justify-center gap-2"
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
