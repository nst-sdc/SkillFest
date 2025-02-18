'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Trophy, Palette, Upload, Star, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { LoginPopup } from "@/components/login-popup";
import { useState, useEffect } from "react";

export default function Creative() {
  const { data: session, status } = useSession();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse follow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmitClick = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe4dI6yVvUxGZkKZUAm8wv2TeAdNqBVCAlmLBK_NMrYOPcc3g/viewform?usp=header', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] overflow-hidden relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.1]" />
      <div 
        className="fixed inset-0 bg-gradient-to-r from-[#F778BA]/5 to-[#A371F7]/5 opacity-50"
        style={{
          transform: `translate(${(mousePosition.x * 0.02)}px, ${(mousePosition.y * 0.02)}px)`,
          transition: 'transform 0.2s ease-out',
        }}
      />
      
      <main className="flex-1 container mx-auto px-4 py-16 relative z-10">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#8b949e] hover:text-[#F778BA] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F778BA] to-[#A371F7] blur-xl opacity-30 animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#161b22] border border-[#F778BA]/20 mb-8 transform hover:scale-110 transition-transform duration-300">
                <Palette className="w-12 h-12 text-[#F778BA]" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#A371F7] animate-pulse" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#F778BA] to-[#A371F7] text-transparent bg-clip-text">
              Logomania
            </h1>
            <p className="text-[#8b949e] text-xl max-w-2xl mx-auto">
              Design the official logo for NST SDC and secure your spot in our creative team. 
              <span className="block mt-2 text-white/80">Top 3 designers will be recruited!</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <PrizeCard 
              position="1st Place"
              prize="Club Membership + Lead Role"
              perks={["Creative Lead Position", "Project Leadership", "Club Benefits"]}
              color="bg-[#161b22]"
              icon={<Trophy className="w-6 h-6 text-[#FFD700]" />}
            />
            <PrizeCard 
              position="2nd Place"
              prize="Club Membership"
              perks={["Creative Team Role", "Project Access", "Club Benefits"]}
              color="bg-[#161b22]"
              icon={<Trophy className="w-6 h-6 text-[#C0C0C0]" />}
            />
            <PrizeCard 
              position="3rd Place"
              prize="Club Membership"
              perks={["Creative Team Role", "Project Access", "Club Benefits"]}
              color="bg-[#161b22]"
              icon={<Trophy className="w-6 h-6 text-[#CD7F32]" />}
            />
          </div>

          <div className="text-center mb-12">
            <div className="p-6 rounded-lg bg-[#161b22] border border-[#F778BA]/20">
              <Star className="w-8 h-8 text-[#F778BA] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">Guaranteed Club Recruitment</h2>
              <p className="text-[#8b949e]">
                All top 3 winners will be recruited into the NST SDC Creative Team, with the first-place winner taking the Creative Lead position!
              </p>
            </div>
          </div>

          {status === 'loading' ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F778BA]" />
            </div>
          ) : !session ? (
            <div className="text-center">
              <div className="max-w-sm mx-auto p-8 rounded-lg bg-[#161b22] border border-[#F778BA]/20">
                <Palette className="w-16 h-16 text-[#F778BA] mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-4">Join the Competition</h3>
                <p className="text-[#8b949e] mb-6">
                  Sign in with GitHub to participate and submit your logo design
                </p>
                <SignInButton />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="max-w-xl mx-auto p-8 rounded-lg bg-[#161b22] border border-[#F778BA]/20 relative group">
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#F778BA]/5 to-[#A371F7]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Cool submit button */}
                <div className="relative group/button">
                  {/* Gradient border effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#F778BA] to-[#A371F7] rounded-xl blur opacity-25 group-hover/button:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />
                  
                  {/* Sparkle effects */}
                  <div className="absolute -top-2 -right-2 text-[#F778BA] animate-bounce">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 text-[#A371F7] animate-bounce delay-100">
                    <Sparkles className="w-5 h-5" />
                  </div>

                  <button
                    onClick={handleSubmitClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative w-full px-8 py-4 bg-[#0d1117] rounded-xl border border-[#F778BA]/20 text-lg font-semibold text-white transition-all duration-300 overflow-hidden group-hover/button:shadow-2xl group-hover/button:shadow-[#F778BA]/20"
                  >
                    {/* Button gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F778BA]/10 to-[#A371F7]/10 opacity-0 group-hover/button:opacity-100 transition-opacity duration-500" />
                    
                    {/* Button content */}
                    <div className="relative flex items-center justify-center gap-3">
                      <Upload 
                        className={`w-5 h-5 text-[#F778BA] transition-all duration-300 ${
                          isHovered ? 'transform -translate-y-1 scale-110' : ''
                        }`}
                      />
                      <span className={`transition-transform duration-300 ${
                        isHovered ? 'transform scale-105' : ''
                      }`}>
                        Submit Your Logo Design
                      </span>
                      <ExternalLink 
                        className={`w-4 h-4 text-[#F778BA] transition-all duration-300 ${
                          isHovered ? 'transform translate-x-1 rotate-45' : ''
                        }`}
                      />
                    </div>
                  </button>
                </div>

                <p className="text-[#8b949e] mt-4 text-sm">
                  Click to open the submission form in a new tab
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-[#8b949e] border-t border-[#30363d]/20">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            © 2025 NST SDC • All rights reserved
          </p>
        </div>
      </footer>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

function PrizeCard({ position, prize, perks, color, icon }: { 
  position: string;
  prize: string;
  perks: string[];
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`p-6 rounded-lg ${color} border border-[#F778BA]/20 hover:border-[#F778BA]/40 transition-colors`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div className="text-lg font-semibold text-white">{position}</div>
      </div>
      <div className="text-[#F778BA] font-medium mb-4">{prize}</div>
      <ul className="space-y-2">
        {perks.map((perk, index) => (
          <li key={index} className="text-[#8b949e] text-sm flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#F778BA]" />
            {perk}
          </li>
        ))}
      </ul>
    </div>
  );
} 