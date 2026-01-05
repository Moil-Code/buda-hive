'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ArrowLeft, CheckCircle, Shield } from 'lucide-react';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Get invite parameters from URL
  const inviteToken = searchParams.get('invite');
  const teamId = searchParams.get('team');
  const teamName = searchParams.get('teamName');
  const redirectUrl = searchParams.get('redirect');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Check if this is an invite signup
  const isInviteSignup = !!inviteToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email domain on client side
    if (!email.endsWith('@budaedc.com') && !email.endsWith('@moilapp.com')) {
      toast({
        title: "Invalid Email Domain",
        description: "Only @budaedc.com or @moilapp.com email addresses are allowed for admin accounts",
        type: "error"
      });
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        type: "error"
      });
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Sign up the admin user directly with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'admin',
          },
        },
      });

      if (signUpError) {
        toast({
          title: "Signup Failed",
          description: signUpError.message,
          type: "error"
        });
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast({
          title: "Signup Failed",
          description: "Failed to create user",
          type: "error"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Account Created",
        description: "Account created successfully! Redirecting to login...",
        type: "success"
      });

      setTimeout(() => {
        // If this is an invite signup, redirect to accept invite page after login
        if (inviteToken) {
          router.push(`/login?redirect=/invite/accept?token=${inviteToken}`);
        } else if (redirectUrl) {
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        } else {
          router.push('/login');
        }
      }, 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        type: "error"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-work-sans overflow-hidden bg-slate-900">
      {/* Admin Background - Darker, more authoritative */}
      <div className="absolute inset-0 w-full h-full">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1e293b] to-[#0f172a] opacity-90"></div>
        
        {/* Ambient Orbs - More subtle for admin */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-buda-blue mix-blend-overlay rounded-full blur-[120px] opacity-40 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500 mix-blend-soft-light rounded-full blur-[100px] opacity-20 animate-float"></div>
        
        {/* Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 py-12">
        <div className="w-full max-w-lg mx-auto">
          {/* Logo Section */}
          <div className="text-center mb-8 animate-slide-in">
            <Link href="/" className="inline-block group">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-buda-blue to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform">
                        B
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Buda Hive <span className="text-buda-yellow font-normal">Admin</span></span>
                </div>
            </Link>
            <p className="text-slate-400 text-sm">
              {isInviteSignup ? 'Create your account to join the team' : 'Create your administrative account'}
            </p>
          </div>

          {/* Team Invite Banner */}
          {isInviteSignup && teamName && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white animate-slide-in shadow-lg border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">You're joining</p>
                  <p className="text-xl font-bold">{decodeURIComponent(teamName)}</p>
                  {teamId && <p className="text-white/60 text-xs font-mono mt-1">Team ID: {teamId.slice(0, 8)}...</p>}
                </div>
              </div>
            </div>
          )}

          {/* Signup Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden animate-slide-in backdrop-blur-sm bg-opacity-95">
             {/* Decorative top accent */}
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-buda-blue via-indigo-500 to-buda-yellow"></div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Jane"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Doe"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="name@company.com"
                    required
                    disabled={loading}
                  />
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Create Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-buda-blue flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Admin accounts require approval from Moil. You will receive an email once your account has been verified.
                    </p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-buda-blue text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-buda-blue/20 transition-all duration-300 shadow-lg shadow-buda-blue/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="text-white border-white" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Admin Account</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account? <Link href="/login" className="text-buda-blue font-semibold hover:underline">Sign In</Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center pb-8">
            <Link href="/login" className="text-white/40 hover:text-white text-sm transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Return to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto border-buda-blue" />
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
