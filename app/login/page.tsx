'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const AdminLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email domain on client side
    if (!email.endsWith('@budahive.com') && !email.endsWith('@moilapp.com')) {
      setError('Only @budahive.com or @moilapp.com email addresses are allowed for admin accounts');
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
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Login failed');
        setLoading(false);
        return;
      }

      // Verify user is an admin by checking metadata
      const userRole = data.user.user_metadata?.role;
      if (userRole !== 'admin') {
        // Sign out if not an admin
        await supabase.auth.signOut();
        setError('Access denied. Admin account required.');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-buda-blue to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform">
                        B
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Buda Hive <span className="text-buda-yellow font-normal">Admin</span></span>
                </div>
            </Link>
            <p className="text-slate-400 text-sm">Secure access for platform administrators</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden animate-slide-in backdrop-blur-sm bg-opacity-95">
             {/* Decorative top accent */}
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-buda-blue via-indigo-500 to-buda-yellow"></div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="admin@budahive.com"
                    required
                    disabled={loading}
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute right-3.5 top-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
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
                <a href="#" className="text-buda-blue hover:text-blue-700 font-medium transition-colors">Forgot password?</a>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-buda-blue text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-buda-blue/20 transition-all duration-300 shadow-lg shadow-buda-blue/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                {!loading && (
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
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
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Return to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
