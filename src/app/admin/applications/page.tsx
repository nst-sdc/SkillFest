'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, X, Eye, Clock } from "lucide-react";
import Link from "next/link";
import { FresherApplication } from "@/lib/firebase-fresher";

export default function AdminApplications() {
  useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/api/auth/signin';
    },
  });

  const [applications, setApplications] = useState<FresherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/admin/applications');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError('Failed to load applications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const updateStatus = async (id: string, status: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    setUpdatingStatus(id);
    try {
      const response = await fetch('/api/admin/applications/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Update the local state
      setApplications(applications.map(app => 
        app.id === id ? { ...app, status } : app
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update application status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#238636]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-white">Fresher Applications</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 mb-6">
            {error}
          </div>
        )}

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0d1117]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-[#8b949e]">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#1c2128]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{app.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">{app.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">{app.experience}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          app.status === 'accepted' ? 'bg-green-900/30 text-green-400' :
                          app.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                          app.status === 'reviewed' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {app.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateStatus(app.id, 'accepted')}
                            disabled={updatingStatus === app.id}
                            className="p-1 rounded hover:bg-[#238636]/20 text-[#238636]"
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, 'rejected')}
                            disabled={updatingStatus === app.id}
                            className="p-1 rounded hover:bg-red-900/20 text-red-400"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, 'reviewed')}
                            disabled={updatingStatus === app.id}
                            className="p-1 rounded hover:bg-blue-900/20 text-blue-400"
                            title="Mark as Reviewed"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, 'pending')}
                            disabled={updatingStatus === app.id}
                            className="p-1 rounded hover:bg-yellow-900/20 text-yellow-400"
                            title="Mark as Pending"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 