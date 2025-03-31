'use client';

import React, { useState, useEffect } from "react";
import { ArrowLeft, User, ExternalLink, Calendar, Mail, Phone, MapPin, Briefcase, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ref, get, update } from "firebase/database";
import { db } from "@/lib/firebase-config";

type Application = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  github: string;
  college?: string;
  graduation?: string;
  experience: string;
  location?: string;
  resume?: string;
  portfolio?: string;
  interests?: string;
  availability?: string;
  whyJoin?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  updatedAt?: string;
  timestamp?: string;
  avatar_url?: string;
};

export default function ApplicationsPage() {
  const { status } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Use the 'test' path which already has permissions
      const applicationsRef = ref(db, 'test/applications');
      const snapshot = await get(applicationsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const applicationsArray = Object.keys(data).map(key => {
          const app = data[key];
          return {
            id: key,
            name: app.name,
            email: app.email,
            github: app.github,
            experience: app.experience,
            interests: app.interests,
            availability: app.availability,
            whyJoin: app.whyJoin,
            portfolio: app.portfolio,
            status: app.status || 'pending',
            submittedAt: app.submittedAt,
            updatedAt: app.updatedAt,
            avatar_url: `https://avatars.githubusercontent.com/${app.github}`
          };
        });
        
        console.log("Fetched applications:", applicationsArray);
        setApplications(applicationsArray);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      // Use the same path as in fetchApplications
      await update(ref(db, `test/applications/${id}`), { status });
      setApplications(prev => 
        prev.map(app => app.id === id ? { ...app, status } : app)
      );
      
      if (selectedApplication?.id === id) {
        setSelectedApplication(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      // You could set an error state here to display to the user
    }
  };

  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
    setShowDetails(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-[#8b949e] mb-6">You need to be logged in as an admin to view this page.</p>
          <Link href="/" className="text-[#58a6ff] hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/admin" className="mr-4 p-2 hover:bg-[#21262d] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Fresher Applications</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58a6ff]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-[#161b22] border border-[#30363d] rounded-lg p-4 h-fit">
              <h2 className="text-lg font-medium mb-4">Applications ({applications.length})</h2>
              
              {applications.length === 0 ? (
                <div className="text-center py-8 text-[#8b949e]">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                  {applications.map(application => (
                    <div 
                      key={application.id}
                      onClick={() => handleApplicationClick(application)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center ${
                        selectedApplication?.id === application.id 
                          ? 'bg-[#30363d]' 
                          : 'bg-[#0d1117] hover:bg-[#30363d]/50'
                      }`}
                    >
                      <Image
                        src={application.avatar_url || '/placeholder-avatar.png'}
                        alt={application.name}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                      <div>
                        <div className="font-medium">{application.name}</div>
                        <div className="text-xs text-[#8b949e]">{application.github}</div>
                      </div>
                      <div className="ml-auto">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          application.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                          application.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                          'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              {showDetails && selectedApplication ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <Image
                        src={selectedApplication.avatar_url || '/placeholder-avatar.png'}
                        alt={selectedApplication.name}
                        width={64}
                        height={64}
                        className="rounded-full mr-4"
                      />
                      <div>
                        <h2 className="text-xl font-bold">{selectedApplication.name}</h2>
                        <div className="flex items-center text-[#8b949e]">
                          <a 
                            href={`https://github.com/${selectedApplication.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-[#58a6ff] transition-colors"
                          >
                            @{selectedApplication.github}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        selectedApplication.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                        selectedApplication.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Mail className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                        <div>
                          <div className="text-sm text-[#8b949e]">Email</div>
                          <div>{selectedApplication.email}</div>
                        </div>
                      </div>
                      
                      {selectedApplication.phone && (
                        <div className="flex items-start">
                          <Phone className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                          <div>
                            <div className="text-sm text-[#8b949e]">Phone</div>
                            <div>{selectedApplication.phone}</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedApplication.location && (
                        <div className="flex items-start">
                          <MapPin className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                          <div>
                            <div className="text-sm text-[#8b949e]">Location</div>
                            <div>{selectedApplication.location}</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedApplication.availability && (
                        <div className="flex items-start">
                          <Calendar className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                          <div>
                            <div className="text-sm text-[#8b949e]">Availability</div>
                            <div>{selectedApplication.availability}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {selectedApplication.college && (
                        <div className="flex items-start">
                          <GraduationCap className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                          <div>
                            <div className="text-sm text-[#8b949e]">College</div>
                            <div>{selectedApplication.college}</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedApplication.graduation && (
                        <div className="flex items-start">
                          <Calendar className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                          <div>
                            <div className="text-sm text-[#8b949e]">Graduation</div>
                            <div>{selectedApplication.graduation}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start">
                        <Briefcase className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                        <div>
                          <div className="text-sm text-[#8b949e]">Experience</div>
                          <div>{selectedApplication.experience}</div>
                        </div>
                      </div>
                      
                      {selectedApplication.interests && (
                        <div className="flex items-start">
                          <User className="w-5 h-5 text-[#8b949e] mr-3 mt-0.5" />
                          <div>
                            <div className="text-sm text-[#8b949e]">Interests</div>
                            <div>{selectedApplication.interests}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedApplication.portfolio && (
                    <div className="mb-6">
                      <div className="text-sm text-[#8b949e] mb-2">Portfolio</div>
                      <a 
                        href={selectedApplication.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-[#21262d] hover:bg-[#30363d] rounded-md transition-colors"
                      >
                        View Portfolio
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                  )}
                  
                  {selectedApplication.resume && (
                    <div className="mb-6">
                      <div className="text-sm text-[#8b949e] mb-2">Resume</div>
                      <a 
                        href={selectedApplication.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-[#21262d] hover:bg-[#30363d] rounded-md transition-colors"
                      >
                        View Resume
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                  )}
                  
                  {selectedApplication.whyJoin && (
                    <div className="mb-6">
                      <div className="text-sm text-[#8b949e] mb-2">Why They Want to Join</div>
                      <div className="p-4 bg-[#0d1117] rounded-md border border-[#30363d]">
                        {selectedApplication.whyJoin}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {selectedApplication.submittedAt && (
                      <div>
                        <div className="text-sm text-[#8b949e] mb-2">Submitted</div>
                        <div>{new Date(selectedApplication.submittedAt).toLocaleString()}</div>
                      </div>
                    )}
                    
                    {selectedApplication.updatedAt && (
                      <div>
                        <div className="text-sm text-[#8b949e] mb-2">Last Updated</div>
                        <div>{new Date(selectedApplication.updatedAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                      disabled={selectedApplication.status === 'approved'}
                      className={`px-4 py-2 rounded-md ${
                        selectedApplication.status === 'approved'
                          ? 'bg-green-900/30 text-green-400 cursor-not-allowed'
                          : 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                      }`}
                    >
                      Approve
                    </button>
                    
                    <button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                      disabled={selectedApplication.status === 'rejected'}
                      className={`px-4 py-2 rounded-md ${
                        selectedApplication.status === 'rejected'
                          ? 'bg-red-900/30 text-red-400 cursor-not-allowed'
                          : 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
                      }`}
                    >
                      Reject
                    </button>
                    
                    <button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'pending')}
                      disabled={selectedApplication.status === 'pending'}
                      className={`px-4 py-2 rounded-md ${
                        selectedApplication.status === 'pending'
                          ? 'bg-yellow-900/30 text-yellow-400 cursor-not-allowed'
                          : 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/70'
                      }`}
                    >
                      Mark as Pending
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 h-full flex items-center justify-center">
                  <div className="text-center text-[#8b949e]">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select an application to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 