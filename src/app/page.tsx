'use client';

import { SignInButton } from "@/components/sign-in-button";
import { ArrowRight, Code, Palette, Sparkles, Zap } from "lucide-react";
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
              Recruitment Open 2025
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">
            Dev Club Recruitment
          </h1>
          <p className="text-xl text-[#8b949e] max-w-2xl mx-auto">
            Join our elite team of developers, designers, and creators
          </p>
          
          <div className="flex justify-center mt-8">
            <SignInButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <CategoryCard
            title="Developer"
            description="Join our development team and contribute to exciting projects"
            icon={<Code className="w-6 h-6 text-[#238636]" />}
            points={[
              "Work on real-world projects",
              "Learn modern technologies",
              "Collaborate with other developers"
            ]}
          />
          
          <CategoryCard
            title="Creative Lead"
            description="Lead our creative initiatives and shape our brand identity"
            icon={<Palette className="w-6 h-6 text-[#F778BA]" />}
            points={[
              "Design brand assets",
              "Create visual content",
              "Lead creative projects"
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
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowLoginPopup(true);
    }
  };

  return (
    <div 
      className="group relative p-8 rounded-xl border border-[#30363d] bg-[#161b22] hover:border-[#8b949e] transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#238636]/10 via-transparent to-[#F778BA]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Sparkle effects */}
      <div className="absolute -top-10 -right-10 transform rotate-45 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
        <Sparkles className="w-20 h-20 text-white" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-[#1f2428] transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
            <div className="h-1 w-12 bg-gradient-to-r from-[#238636] to-[#F778BA] rounded-full transform origin-left group-hover:scale-x-150 transition-transform duration-300" />
          </div>
        </div>

        {/* Description */}
        <p className="text-[#8b949e] mb-8 group-hover:text-white transition-colors duration-300">
          {description}
        </p>

        {/* Points */}
        <ul className="space-y-4 mb-8">
          {points.map((point, index) => (
            <li 
              key={index} 
              className="flex items-center gap-3 text-[#8b949e] group-hover:text-white transition-all duration-300"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Zap className="w-4 h-4 text-[#238636] group-hover:scale-125 transition-transform duration-300" />
              {point}
            </li>
          ))}
        </ul>

        {/* Apply Button */}
        <Link 
          href={session ? (
            title === "Developer" ? "/skillfest" : 
            title === "Creative Lead" ? "/creative" :
            "/register"
          ) : "#"}
          onClick={handleClick}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#238636] text-white transition-all duration-300 flex items-center justify-center gap-2 transform group-hover:translate-y-[-2px] group-hover:shadow-lg"
        >
          Apply Now 
          <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
        </Link>

        {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
      </div>
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
