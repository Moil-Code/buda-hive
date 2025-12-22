'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PaymentRedirectPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all query parameters
    const licenseCount = searchParams.get('licenseCount');
    const payment = searchParams.get('payment');
    const paymentType = searchParams.get('paymentType');

    // Redirect to API endpoint with same parameters
    const apiUrl = `/api/licenses/purchase?licenseCount=${licenseCount}&payment=${payment}&paymentType=${paymentType}`;
    
    console.log('Redirecting to API endpoint:', apiUrl);
    window.location.href = apiUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-6">
          <div className="w-full h-full border-4 border-buda-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
        <p className="text-gray-600">Please wait while we process your payment...</p>
      </div>
    </div>
  );
};

export default PaymentRedirectPage;
