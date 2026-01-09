'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const BUDA_HIVE_LOGO_URL = '/Buda_Hive_Primary_Logo_BlueYellow_CMYK.png';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Get redirect URL from query params (for invite acceptance flow)
  const redirectUrl = searchParams.get('redirect');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email domain on client side
    if (!email.endsWith('@budaedc.com') && !email.endsWith('@moilapp.com')) {
      toast({
        title: "Access Denied",
        description: "Only @budaedc.com or @moilapp.com email addresses are allowed for admin accounts",
        type: "error"
      });
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Sign in the admin user directly with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast({
          title: "Login Failed",
          description: signInError.message,
          type: "error"
        });
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast({
          title: "Login Failed",
          description: "Could not authenticate user",
          type: "error"
        });
        setLoading(false);
        return;
      }

      // Verify user is an admin by checking metadata
      const userRole = data.user.user_metadata?.role;
      if (userRole !== 'admin') {
        // Sign out if not an admin
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Admin account required to access this portal.",
          type: "error"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to Admin Dashboard.",
        type: "success"
      });

      // Redirect to the specified URL or dashboard
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/admin/dashboard');
      }
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

      <div className="container mx-auto px-6 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Logo Section */}
          <div className="text-center mb-8 animate-slide-in">
            <Link href="/" className="inline-block group">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Image
                      src={BUDA_HIVE_LOGO_URL}
                      alt="Buda Hive Logo"
                      width={150}
                      height={48}
                      className="h-12 object-contain group-hover:scale-105 transition-transform"
                      priority
                    />
                </div>
            </Link>
            <p className="text-slate-400 text-sm">Secure access for platform administrators</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden animate-slide-in backdrop-blur-sm bg-opacity-95">
             {/* Decorative top accent */}
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-buda-blue via-indigo-500 to-buda-yellow"></div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="admin@budaedc.com"
                    required
                    disabled={loading}
                  />
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                    required
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-buda-blue focus:ring-buda-blue/20" 
                    disabled={loading}
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-buda-blue hover:text-blue-700 font-medium transition-colors">Forgot password?</Link>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-buda-blue text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-buda-blue/20 transition-all duration-300 shadow-lg shadow-buda-blue/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="text-white border-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don't have an admin account? <Link href="/signup" className="text-buda-blue font-semibold hover:underline">Request Access</Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto border-buda-blue" />
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
