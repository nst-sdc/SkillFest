/* eslint-disable @typescript-eslint/no-explicit-any */
import { Github } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#30363d] bg-[#161b22]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-[#238636]" />
            <span className="text-white font-medium">NST SDC</span>
          </div>

          <div className="flex items-center gap-6">
            <Link 
              href="https://github.com/nst-sdc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b949e] hover:text-white transition-colors text-sm"
            >
              GitHub
            </Link>
            <Link 
              href="https://github.com/nst-sdc/recruitment"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b949e] hover:text-white transition-colors text-sm"
            >
              Recruitment
            </Link>
            <span className="text-[#8b949e] text-sm">
              © {new Date().getFullYear()} NST SDC
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8b949e] text-sm">Made with</span>
            <span className="text-[#238636]">♥</span>
            <span className="text-[#8b949e] text-sm">by</span>
            <Link 
              href="https://github.com/nst-sdc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#238636] transition-colors text-sm font-medium"
            >
              NST SDC Team
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}