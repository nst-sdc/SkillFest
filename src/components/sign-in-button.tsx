'use client';

import { signOut, useSession } from "next-auth/react";
import { Github, LogOut, Loader2 } from "lucide-react";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { LoginPopup } from "./login-popup";

export function SignInButton() {
  const { data: session, status } = useSession();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    const updateStats = async () => {
      if (session?.user) {
        try {
          console.log('Attempting to update stats for user:', session.user);
          const response = await fetch('/api/logged-in-users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response from API:', errorData);
            return;
          }
          
          const result = await response.json();
          console.log('Successfully updated user stats:', result);
        } catch (error) {
          console.error('Error updating stats on login:', error);
        }
      }
    };

    if (status === 'authenticated') {
      updateStats();
    }
  }, [session, status]); 

  if (status === "loading") {
    return (
      <button 
        disabled 
        className="inline-flex items-center gap-3 bg-[#161b22] text-white px-6 py-3 rounded-xl border border-[#30363d] transition-all duration-300"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{session.user?.name}</p>
          <p className="text-xs text-[#8b949e]">{session.user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="group relative inline-flex items-center gap-3 bg-[#161b22] hover:bg-[#1f2428] text-white px-6 py-3 rounded-xl border border-[#30363d] hover:border-[#8b949e] transition-all duration-300 hover:shadow-lg"
        >
          {session.user?.image && (
            <Image 
              src={session.user.image} 
              alt={session.user.name || "User"} 
              width={20} 
              height={20}
              className="rounded-full"
            />
          )}
          <span>Sign out</span>
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLoginPopup(true)}
        className="group relative inline-flex items-center gap-3 bg-[#161b22] hover:bg-[#1f2428] text-white px-6 py-3 rounded-xl border border-[#F778BA]/20 hover:border-[#F778BA]/40 transition-all duration-300 hover:shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#F778BA]/10 via-transparent to-[#F778BA]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-center gap-3">
          <Github className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
          <span className="font-medium">Sign in with GitHub</span>
          <div 
            className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-[#F778BA] to-[#A371F7] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
          />
        </div>
      </button>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </>
  );
} 