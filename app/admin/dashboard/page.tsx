'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TeamManagement from '@/components/TeamManagement';
import ActivityPanel from '@/components/ActivityPanel';
import { useToast } from '@/components/ui/toast/use-toast';
import { DashboardHeader } from '@/components/Dashboard/DashboardHeader';
import { LicenseOverview } from '@/components/Dashboard/LicenseOverview';
import { PurchaseCard } from '@/components/Dashboard/PurchaseCard';
import { AddLicenseForm } from '@/components/Dashboard/AddLicenseForm';
import { LicenseList } from '@/components/Dashboard/LicenseList';
import { PurchaseModal } from '@/components/Dashboard/PurchaseModal';

interface License {
  id: string;
  email: string;
  isActivated: boolean;
  activatedAt: string | null;
  createdAt: string;
  businessName?: string;
  businessType?: string;
}

interface Statistics {
  total: number;
  activated: number;
  pending: number;
}

interface LicenseStats {
  purchased_license_count: number;
  active_purchased_license_count: number;
  available_licenses: number;
}

const DashboardPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({ total: 0, activated: 0, pending: 0 });
  const [licenseStats, setLicenseStats] = useState<LicenseStats>({ purchased_license_count: 0, active_purchased_license_count: 0, available_licenses: 0 });
  const [loading, setLoading] = useState(true);
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);

  useEffect(() => {
    checkAuthAndFetchLicenses();
    fetchLicenseStats();
    handleUrlParams();
  }, []);

  const handleUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    const errorParam = urlParams.get('error');
    const licensesAdded = urlParams.get('licenses_added');

    if (successParam === 'purchase_complete' && licensesAdded) {
      toast({
        title: "Payment Successful",
        description: `🎉 Added ${licensesAdded} license${parseInt(licensesAdded) > 1 ? 's' : ''} to your account.`,
        type: "success",
        duration: 8000
      });
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh stats to show updated counts
      setTimeout(() => {
        fetchLicenseStats();
        fetchLicenses();
      }, 1000);
    } else if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        payment_failed: 'Payment was not successful. Please try again.',
        invalid_license_count: 'Invalid license count received.',
        admin_not_found: 'Admin account not found.',
        update_failed: 'Failed to update license count. Please contact support.',
        unexpected_error: 'An unexpected error occurred. Please try again.'
      };
      
      toast({
        title: "Payment Error",
        description: errorMessages[errorParam] || 'An error occurred during payment processing.',
        type: "error",
        duration: 8000
      });
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const checkAuthAndFetchLicenses = async () => {
    try {
      const supabase = createClient();
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user, redirecting to login');
        router.push('/login');
        return;
      }

      // Verify user is an admin
      const userRole = user.user_metadata?.role;
      if (userRole !== 'admin') {
        console.log('User is not an admin, redirecting to login');
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      // Store admin email for purchase
      setAdminEmail(user.email || '');

      // User is authenticated and is an admin, fetch licenses
      await fetchLicenses();
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/login');
    }
  };

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses/list');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch licenses');
      }
      const data = await response.json();
      setLicenses(data.licenses);
      setStatistics(data.statistics);
    } catch (err) {
      toast({
        title: "Error",
        description: 'Failed to load licenses',
        type: "error"
      });
      console.error('Fetch licenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenseStats = async () => {
    try {
      const response = await fetch('/api/licenses/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch license stats');
      }
      const data = await response.json();
      setLicenseStats(data);
    } catch (err) {
      console.error('Fetch license stats error:', err);
    }
  };

  const handlePurchaseLicenses = async (count: number) => {
    if (!count || count < 1) {
      setPurchaseError('Please enter a valid number of licenses');
      return;
    }

    setPurchasing(true);
    setPurchaseError('');

    try {
      const response = await fetch('https://moilapp.com/api/stripe/buy-licenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_BUDA_API_KEY || '',
        },
        body: JSON.stringify({ 
          name: 'Buda Hive',
          email: adminEmail,
          numberOfLicenses: count
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setPurchaseError(data.message || 'Failed to initiate purchase');
        setPurchasing(false);
        return;
      }

      // Redirect to Stripe checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setPurchaseError('No checkout URL received');
        setPurchasing(false);
      }
    } catch (err) {
      setPurchaseError('An error occurred during purchase');
      setPurchasing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-work-sans">
      <DashboardHeader 
        onShowActivity={() => setShowActivityPanel(true)}
        onShowTeam={() => setShowTeamManagement(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-8xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-20">
        <LicenseOverview 
          stats={statistics} 
          licenseStats={licenseStats} 
        />

        <div className="space-y-6 md:space-y-8">
          <PurchaseCard 
            purchasedCount={licenseStats.purchased_license_count}
            availableCount={licenseStats.available_licenses}
            onPurchaseClick={() => setShowPurchaseModal(true)}
          />
          
          <AddLicenseForm 
            availableLicenses={licenseStats.available_licenses}
            onLicensesAdded={() => {
              fetchLicenses();
              fetchLicenseStats();
            }}
          />

          <LicenseList 
            licenses={licenses}
            loading={loading}
            onRefresh={fetchLicenses}
          />
        </div>
      </main>

      {showPurchaseModal && (
        <PurchaseModal 
          onClose={() => {
            setShowPurchaseModal(false);
            setPurchaseError('');
          }}
          onPurchase={handlePurchaseLicenses}
          purchasing={purchasing}
          error={purchaseError}
        />
      )}

      {showTeamManagement && (
        <TeamManagement onClose={() => setShowTeamManagement(false)} />
      )}

      {showActivityPanel && (
        <ActivityPanel onClose={() => setShowActivityPanel(false)} />
      )}
    </div>
  );
};

export default DashboardPage;
