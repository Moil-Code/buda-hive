'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase/client';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  team: {
    id: string;
    name: string;
    domain: string;
  };
  inviter: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (token) {
      checkAuthAndFetchInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const checkAuthAndFetchInvitation = async () => {
    try {
      // Check authentication
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email || '');
      }

      // Fetch invitation details
      const response = await fetch(`/api/team/invite/accept?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load invitation');
        setLoading(false);
        return;
      }

      setInvitation(data.invitation);
    } catch (err) {
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/accept?token=${token}`);
      return;
    }

    setAccepting(true);
    setError('');

    try {
      const response = await fetch('/api/team/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation');
        setAccepting(false);
        return;
      }

      // Redirect to dashboard
      router.push('/admin/dashboard?welcome=team');
    } catch (err) {
      setError('An error occurred while accepting the invitation');
      setAccepting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-buda-blue"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="md" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Team Invitation</h1>
        </div>

        {/* Invitation Details */}
        {invitation && (
          <div className="space-y-6">
            {/* Inviter Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-buda-blue rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {invitation.inviter?.first_name?.[0]}{invitation.inviter?.last_name?.[0]}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">
                    {invitation.inviter?.first_name} {invitation.inviter?.last_name}
                  </p>
                  <p className="text-gray-600 text-sm">invited you to join</p>
                </div>
              </div>
            </div>

            {/* Team Info */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{invitation.team.name}</h2>
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>@{invitation.team.domain}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-buda-yellow text-buda-blue rounded-full text-sm font-semibold capitalize">
                  {invitation.role}
                </span>
                <span className="text-gray-500 text-sm">role</span>
              </div>
            </div>

            {/* What you can do */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">As a team {invitation.role}, you'll be able to:</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Manage and assign licenses to users
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Send activation emails to new users
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  View license statistics and analytics
                </li>
                {invitation.role === 'admin' && (
                  <>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Invite other team members
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Purchase additional licenses
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Expiration Notice */}
            <p className="text-gray-500 text-sm text-center">
              This invitation expires on {formatDate(invitation.expiresAt)}
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Email Mismatch Warning */}
            {isAuthenticated && userEmail && invitation.email !== userEmail && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> This invitation was sent to <strong>{invitation.email}</strong>, 
                  but you're logged in as <strong>{userEmail}</strong>. 
                  Please log in with the correct account to accept this invitation.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/login')}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvitation}
                disabled={accepting || (isAuthenticated && userEmail !== invitation.email)}
                className="flex-1 px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accepting ? 'Accepting...' : isAuthenticated ? 'Accept Invitation' : 'Login to Accept'}
              </button>
            </div>

            {!isAuthenticated && (
              <p className="text-gray-500 text-sm text-center">
                Don't have an account?{' '}
                <a href={`/signup?redirect=/invite/accept?token=${token}`} className="text-buda-blue hover:underline">
                  Sign up
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-buda-blue"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
