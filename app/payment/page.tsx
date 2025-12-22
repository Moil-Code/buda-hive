'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your payment...');
  const [licensesAdded, setLicensesAdded] = useState(0);

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      const licenseCount = searchParams.get('licenseCount');
      const payment = searchParams.get('payment');
      const paymentType = searchParams.get('paymentType');

      // Validate payment was successful
      if (payment !== 'successful' || paymentType !== 'license_purchase') {
        setStatus('error');
        setMessage('Payment was not successful. Please try again.');
        return;
      }

      const licenseCountNum = parseInt(licenseCount || '0', 10);
      if (isNaN(licenseCountNum) || licenseCountNum < 1) {
        setStatus('error');
        setMessage('Invalid license count received.');
        return;
      }

      // Get current authenticated user
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setStatus('error');
        setMessage('You must be logged in to complete this purchase.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      // Call API to update license count
      const response = await fetch('/api/licenses/purchase/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseCount: licenseCountNum }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to process payment.');
        return;
      }

      setLicensesAdded(licenseCountNum);
      setStatus('success');
      setMessage(`Successfully added ${licenseCountNum} license${licenseCountNum > 1 ? 's' : ''} to your account!`);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Payment processing error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="w-full h-full border-4 border-buda-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-semibold">
                +{licensesAdded} License{licensesAdded > 1 ? 's' : ''} Added
              </p>
            </div>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <Link 
                href="/admin/dashboard"
                className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
              >
                Go to Dashboard
              </Link>
              <button 
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
