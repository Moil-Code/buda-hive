'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';

const BUDA_HIVE_LOGO_URL = '/Buda_Hive_Primary_Logo_BlueYellow_CMYK.png';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      // Set the session with the recovery tokens
      const supabase = createClient();
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
    }
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        toast({
          title: "Error",
          description: updateError.message,
          type: "error"
        });
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset",
        type: "success"
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
                  src={BUDA_HIVE_LOGO_URL}
                  alt="Buda Hive Logo"
                  width={150}
                  height={48}
                  className="h-12 object-contain group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
            </Link>
            <p className="text-slate-400 text-sm">Create a new password</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden animate-slide-in backdrop-blur-sm bg-opacity-95">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-buda-blue via-indigo-500 to-buda-yellow"></div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your password has been updated. You will be redirected to the login page shortly.
                </p>
                <Link 
                  href="/login"
                  className="inline-flex items-center gap-2 text-buda-blue hover:text-blue-700 font-medium transition-colors"
                >
                  Go to Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
                  <p className="text-gray-600 text-sm">
                    Enter your new password below. Make sure it's strong and secure.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        minLength={8}
                      />
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/20 focus:border-buda-blue transition-all text-gray-900 placeholder-gray-400"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        minLength={8}
                      />
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password requirements */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-medium text-gray-700">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>One uppercase letter</li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>One lowercase letter</li>
                      <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>One number</li>
                    </ul>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full bg-buda-blue text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-buda-blue/20 transition-all duration-300 shadow-lg shadow-buda-blue/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="text-white border-white" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto border-buda-blue" />
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
