'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import { Github, LogOut, Loader2 } from "lucide-react";
import Image from 'next/image';

export function SignInButton() {
  const { data: session, status } = useSession();

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
    <button
      onClick={() => signIn('github')}
      className="group relative inline-flex items-center gap-3 bg-[#161b22] hover:bg-[#1f2428] text-white px-6 py-3 rounded-xl border border-[#30363d] hover:border-[#8b949e] transition-all duration-300 hover:shadow-lg overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#238636]/10 via-transparent to-[#238636]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative flex items-center gap-3">
        <Github className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        <span className="font-medium">Sign in with GitHub</span>
        <div 
          className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-[#238636] to-[#2ea043] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
        />
      </div>
    </button>
  );
} 