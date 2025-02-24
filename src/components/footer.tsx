import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-[#30363d] bg-[#161b22]">
      {/* Gradient Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#238636]/10 via-transparent to-[#238636]/10" />
      
      <div className="container mx-auto px-6 h-16 flex items-center justify-between relative">
        {/* Left Section */}
        <a 
          href="https://github.com/nst-sdc"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#238636] rounded-lg blur-lg opacity-0 group-hover:opacity-20 transition-all duration-300" />
            <div className="relative bg-[#238636]/10 p-2 rounded-lg border border-[#238636]/20 group-hover:border-[#238636]/40 transition-colors">
              <Github className="w-5 h-5 text-[#238636] group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium leading-none group-hover:text-[#238636] transition-colors">NST SDC</span>
            <span className="text-xs text-[#8b949e]">Developer Club</span>
          </div>
        </a>

        {/* Center: Copyright */}
        <span className="text-sm text-[#8b949e]">© 2025 NST SDC</span>

        {/* Right Section */}
        <div className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#238636]/5 to-[#2ea043]/5 hover:from-[#238636]/10 hover:to-[#2ea043]/10 border border-[#238636]/10 hover:border-[#238636]/20 transition-all">
          <span className="text-sm text-[#8b949e] group-hover:text-white transition-colors">Made with</span>
          <Heart className="w-4 h-4 text-[#238636] fill-[#238636] group-hover:scale-110 transition-transform" />
          <span className="text-sm text-[#8b949e] group-hover:text-white transition-colors">by Team</span>
        </div>
      </div>
    </footer>
  );
} 