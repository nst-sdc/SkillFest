import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-[#30363d] bg-[#161b22]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#238636]/5 via-transparent to-[#238636]/5" />
      
      <div className="container mx-auto px-6 h-16 flex items-center justify-between relative">
        {/* Left Section - Logo with glow */}
        <a 
          href="https://github.com/nst-sdc"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group relative"
        >
          <div className="relative">
            {/* Glow effect container */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#238636] to-[#2ea043] rounded-lg blur opacity-0 group-hover:opacity-20 transition-all duration-500" />
            <div className="relative bg-[#161b22] p-2 rounded-lg border border-[#30363d] group-hover:border-[#238636] transition-all duration-300">
              <Github className="w-5 h-5 text-[#238636] group-hover:animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium leading-none group-hover:text-[#238636] transition-colors">NST SDC</span>
            <span className="text-xs text-[#8b949e]">Developer Club</span>
          </div>
        </a>

        {/* Center: Copyright with hover effect */}
        <div className="relative group cursor-default">
          <span className="text-sm text-[#8b949e] group-hover:text-white transition-colors">
            © 2025 NST SDC
          </span>
          <div className="absolute -bottom-px left-0 w-0 h-[1px] bg-[#238636] group-hover:w-full transition-all duration-300" />
        </div>

        {/* Right Section - Made with love */}
        <div className="relative group">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] group-hover:border-[#238636] transition-all duration-300">
            <span className="text-sm text-[#8b949e] group-hover:text-white transition-colors">Made with</span>
            <Heart 
              className="w-4 h-4 text-[#238636] fill-[#238636] group-hover:animate-pulse"
            />
            <span className="text-sm text-[#8b949e] group-hover:text-white transition-colors">by Team</span>
          </div>
          {/* Bottom border glow */}
          <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#238636] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
        </div>
      </div>
    </footer>
  );
} 