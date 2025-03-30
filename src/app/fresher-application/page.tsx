'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Code, Send, User, Mail, Briefcase, BookOpen, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SignInButton } from "@/components/sign-in-button";
import { storeFresherApplication } from "@/lib/firebase-fresher";

export default function FresherApplication() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    experience: '',
    interests: '',
    whyJoin: '',
    github: '',
    portfolio: '',
    availability: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Store the application data in Firebase
      const applicationId = await storeFresherApplication({
        name: formData.name,
        email: formData.email,
        experience: formData.experience,
        interests: formData.interests,
        whyJoin: formData.whyJoin,
        github: formData.github,
        portfolio: formData.portfolio,
        availability: formData.availability
      });
      
      console.log('Application submitted successfully with ID:', applicationId);
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Redirect after submission
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setIsSubmitting(false);
      setSubmissionError('Failed to submit your application. Please try again.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <Code className="w-16 h-16 text-[#A371F7] mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Sign in to Apply</h1>
          <p className="text-[#8b949e] mb-8">
            Please sign in with GitHub to access the Fresher Developer application form.
          </p>
          <SignInButton />
          
          <div className="mt-8 text-[#8b949e]">
            <Link href="/" className="inline-flex items-center hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#161b22] border border-[#30363d] rounded-xl p-10 text-center">
          <div className="w-24 h-24 bg-[#238636]/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-12 h-12 text-[#238636]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-[#8b949e] mb-8 text-lg">
            Thank you for applying to join our team as a Fresher Developer. We&apos;ll review your application and get back to you soon.
          </p>
          <p className="text-[#8b949e] mb-4">
            Redirecting back to the home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.1]" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-[#A371F7]/20 to-transparent opacity-30" />
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-radial from-[#238636]/20 to-transparent opacity-30" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="grid md:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {/* Left column with information */}
          <div className="md:col-span-2">
            <div className="sticky top-12">
              <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-full bg-[#A371F7]/10">
                    <Code className="w-6 h-6 text-[#A371F7]" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Fresher Developer Program</h1>
                </div>
                
                <p className="text-[#8b949e] mb-6">
                  Join our team as a Fresher Developer and kickstart your career in software development. 
                  No prior experience required - just passion and eagerness to learn!
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-full bg-[#238636]/10">
                      <Check className="w-4 h-4 text-[#238636]" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Mentorship</h3>
                      <p className="text-sm text-[#8b949e]">Get paired with experienced developers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-full bg-[#238636]/10">
                      <Check className="w-4 h-4 text-[#238636]" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Real Projects</h3>
                      <p className="text-sm text-[#8b949e]">Work on actual production code</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-full bg-[#238636]/10">
                      <Check className="w-4 h-4 text-[#238636]" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Skill Development</h3>
                      <p className="text-sm text-[#8b949e]">Access to learning resources and workshops</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-[#30363d]">
                  <h3 className="text-white font-medium mb-2">Next Steps After Applying:</h3>
                  <ol className="space-y-2 text-sm text-[#8b949e]">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#161b22] border border-[#30363d] inline-flex items-center justify-center text-xs">1</span>
                      Application review (1-2 days)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#161b22] border border-[#30363d] inline-flex items-center justify-center text-xs">2</span>
                      Quick intro call (15 mins)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#161b22] border border-[#30363d] inline-flex items-center justify-center text-xs">3</span>
                      Start coding with your mentor!
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column with form */}
          <div className="md:col-span-3">
            <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d]">
              <h2 className="text-xl font-bold text-white mb-8">Fresher Developer Application</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="github" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                    GitHub Username (if you have one)
                  </label>
                  <input
                    type="text"
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors"
                    placeholder="e.g., octocat"
                  />
                </div>
                
                <div>
                  <label htmlFor="experience" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                    <Briefcase className="w-4 h-4" />
                    Programming Experience
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors"
                  >
                    <option value="">Select your experience level</option>
                    <option value="none">None (Complete Beginner)</option>
                    <option value="learning">Learning (Some tutorials/courses)</option>
                    <option value="student">Student (Academic projects only)</option>
                    <option value="hobby">Hobby Projects (No professional experience)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="interests" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                    <BookOpen className="w-4 h-4" />
                    Areas of Interest
                  </label>
                  <input
                    type="text"
                    id="interests"
                    name="interests"
                    value={formData.interests}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors"
                    placeholder="e.g., Web Development, Mobile Apps, AI/ML, Game Development"
                  />
                </div>
                
                <div>
                  <label htmlFor="availability" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                    How many hours per week can you commit?
                  </label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors"
                  >
                    <option value="">Select hours per week</option>
                    <option value="5-10">5-10 hours/week</option>
                    <option value="10-20">10-20 hours/week</option>
                    <option value="20-30">20-30 hours/week</option>
                    <option value="30+">30+ hours/week</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="whyJoin" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                    <HelpCircle className="w-4 h-4" />
                    Why do you want to join our Fresher Developer Program?
                  </label>
                  <textarea
                    id="whyJoin"
                    name="whyJoin"
                    value={formData.whyJoin}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your motivations and what you hope to achieve..."
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="portfolio" className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                    Portfolio/Projects URL (optional)
                  </label>
                  <input
                    type="url"
                    id="portfolio"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:border-[#238636] focus:outline-none transition-colors"
                    placeholder="e.g., https://yourportfolio.com"
                  />
                </div>
                
                <div className="pt-6">
                  {submissionError && (
                    <div className="p-4 mb-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
                      {submissionError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#A371F7] to-[#7048e8] hover:from-[#7048e8] hover:to-[#A371F7] text-white transition-all duration-300 flex items-center justify-center gap-2 text-lg font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 