'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const MOIL_LOGO_URL = 'https://res.cloudinary.com/drlcisipo/image/upload/v1705704261/Website%20images/logo_gox0fw.png';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email domain
    if (!email.endsWith('@budaedc.com') && !email.endsWith('@moilapp.com')) {
      toast({
        title: "Invalid Email",
        description: "Only @budaedc.com or @moilapp.com email addresses are allowed",
        type: "error"
      });
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          type: "error"
        });
        setLoading(false);
        return;
      }

      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: "Check your email for the password reset link",
        type: "success"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-work-sans overflow-hidden bg-slate-900">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1e293b] to-[#0f172a] opacity-90"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-buda-blue mix-blend-overlay rounded-full blur-[120px] opacity-40 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500 mix-blend-soft-light rounded-full blur-[100px] opacity-20 animate-float"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Logo Section */}
          <div className="text-center mb-8 animate-slide-in">
            <Link href="/login" className="inline-block group">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Image
                  src={MOIL_LOGO_URL}
                  alt="Moil Logo"
                  width={150}
                  height={48}
                  className="h-12 object-contain group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
            </Link>
            <p className="text-slate-400 text-sm">Reset your password</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden animate-slide-in backdrop-blur-sm bg-opacity-95">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-buda-blue via-indigo-500 to-buda-yellow"></div>

            {emailSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-buda-blue hover:text-blue-700 font-medium transition-colors"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                  <p className="text-gray-600 text-sm">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

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

                  <button 
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-buda-blue text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-buda-blue/20 transition-all duration-300 shadow-lg shadow-buda-blue/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="text-white border-white" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link href="/login" className="text-buda-blue font-semibold hover:underline flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
