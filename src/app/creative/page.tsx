'use client';

import { useSession } from "next-auth/react";
import { ArrowLeft, Trophy, Palette, Upload, Star } from "lucide-react";
import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import { LoginPopup } from "@/components/login-popup";
import { useState } from "react";

export default function Creative() {
  const { data: session, status } = useSession();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

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

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#F778BA] to-[#A371F7] mb-8 transform hover:scale-110 transition-transform">
              <Palette className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 text-foreground bg-gradient-to-r from-[#F778BA] to-[#A371F7] text-transparent bg-clip-text">
              Logo Design Competition
            </h1>
            <p className="text-xl text-[#8b949e] max-w-2xl mx-auto">
              Design the official logo for NST SDC and secure your spot in our creative team. Top 3 designers will be recruited!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <PrizeCard 
              position="1st Place"
              prize="Club Membership + Lead Role"
              perks={["Creative Lead Position", "Project Leadership", "Club Benefits"]}
              color="from-yellow-400 to-yellow-600"
              icon={<Trophy className="w-6 h-6" />}
            />
            <PrizeCard 
              position="2nd Place"
              prize="Club Membership"
              perks={["Creative Team Role", "Project Access", "Club Benefits"]}
              color="from-gray-300 to-gray-400"
              icon={<Trophy className="w-6 h-6" />}
            />
            <PrizeCard 
              position="3rd Place"
              prize="Club Membership"
              perks={["Creative Team Role", "Project Access", "Club Benefits"]}
              color="from-amber-700 to-amber-800"
              icon={<Trophy className="w-6 h-6" />}
            />
          </div>

          <div className="text-center mb-12 p-6 rounded-lg bg-gradient-to-r from-[#F778BA]/20 to-[#A371F7]/20 border border-[#F778BA]/30">
            <h2 className="text-2xl font-bold text-white mb-3">Guaranteed Club Recruitment</h2>
            <p className="text-[#8b949e]">
              All top 3 winners will be recruited into the NST SDC Creative Team, with the first-place winner taking the Creative Lead position!
            </p>
          </div>

          {status === 'loading' ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F778BA]" />
            </div>
          ) : !session ? (
            <div className="text-center">
              <div className="max-w-sm mx-auto p-8 rounded-lg border border-[#30363d] bg-[#161b22] backdrop-blur-sm">
                <Palette className="w-16 h-16 text-[#F778BA] mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-4">Join the Competition</h3>
                <p className="text-[#8b949e] mb-6">
                  Sign in with GitHub to participate and submit your logo design
                </p>
                <SignInButton />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="p-8 rounded-lg border border-[#30363d] bg-[#161b22]">
                <h2 className="text-2xl font-bold text-white mb-6">Competition Guidelines</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Requirements</h3>
                      <ul className="space-y-2">
                        <ListItem>Original design representing NST SDC</ListItem>
                        <ListItem>Vector format (SVG, AI, EPS)</ListItem>
                        <ListItem>Both color and monochrome versions</ListItem>
                        <ListItem>Minimum resolution: 1000x1000px</ListItem>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Submission</h3>
                      <ul className="space-y-2">
                        <ListItem>Submit via GitHub repository</ListItem>
                        <ListItem>Include design rationale</ListItem>
                        <ListItem>Deadline: April 15, 2024</ListItem>
                        <ListItem>Multiple submissions allowed</ListItem>
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg bg-[#1f2428] border border-[#30363d]">
                    <h3 className="text-lg font-semibold text-white mb-4">Submit Your Design</h3>
                    <p className="text-[#8b949e] mb-6">
                      Create a pull request with your logo design in the official repository
                    </p>
                    <Link
                      href="https://github.com/nst-sdc/logo-competition"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-full py-3 rounded-lg bg-[#F778BA] hover:bg-opacity-90 text-white font-medium justify-center transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      Submit Design
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-r from-[#F778BA]/10 to-transparent border border-[#F778BA]/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#F778BA]/10">
                    <Star className="w-6 h-6 text-[#F778BA]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#F778BA] mb-2">Selection Criteria</h3>
                    <div className="space-y-2 text-[#8b949e]">
                      <p>• Originality and creativity</p>
                      <p>• Brand representation</p>
                      <p>• Technical execution</p>
                      <p>• Versatility and scalability</p>
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

function PrizeCard({ position, prize, perks, color, icon }: { 
  position: string;
  prize: string;
  perks: string[];
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-lg border border-[#30363d] bg-[#161b22] relative group">
      <div className={`absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r ${color} opacity-50 group-hover:opacity-100 transition-opacity`} />
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${color} bg-opacity-10`}>
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{position}</h3>
            <p className="text-[#F778BA] font-medium">{prize}</p>
          </div>
        </div>
        <ul className="space-y-2">
          {perks.map((perk, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-[#8b949e]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F778BA]" />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-[#8b949e]">
      <div className="w-1.5 h-1.5 rounded-full bg-[#F778BA]" />
      {children}
    </li>
  );
} 