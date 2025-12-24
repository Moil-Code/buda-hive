'use client';

import React, { useState, useEffect } from 'react';
import Logo from '@/components/ui/Logo';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

const LICENSE_PRESETS = [1, 5, 10, 15, 20];

const DashboardPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({ total: 0, activated: 0, pending: 0 });
  const [licenseStats, setLicenseStats] = useState<LicenseStats>({ purchased_license_count: 0, active_purchased_license_count: 0, available_licenses: 0 });
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [addingLicense, setAddingLicense] = useState(false);
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [licenseCount, setLicenseCount] = useState(5);
  const [customLicenseCount, setCustomLicenseCount] = useState('');
  const [useCustomCount, setUseCustomCount] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

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
    const totalLicenses = urlParams.get('total_licenses');

    if (successParam === 'purchase_complete' && licensesAdded) {
      setSuccess(`🎉 Payment successful! Added ${licensesAdded} license${parseInt(licensesAdded) > 1 ? 's' : ''} to your account.`);
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
      setError(errorMessages[errorParam] || 'An error occurred during payment processing.');
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
      setError('Failed to load licenses');
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

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAddingLicense(true);

    try {
      // Combine email tags with current input
      const allEmails = [...emailTags];
      if (newEmail.trim()) {
        allEmails.push(newEmail.trim());
      }

      if (allEmails.length === 0) {
        setError('Please enter at least one email address');
        setAddingLicense(false);
        return;
      }

      // Use single or multiple license API based on count
      const endpoint = allEmails.length === 1 ? '/api/licenses/add' : '/api/licenses/add-multiple';
      const body = allEmails.length === 1 
        ? { email: allEmails[0] }
        : { emails: allEmails };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add license(s)');
        setAddingLicense(false);
        return;
      }

      if (allEmails.length === 1) {
        setSuccess('License added successfully!');
      } else {
        setSuccess(data.message || `${data.results?.success || 0} license(s) added successfully!`);
        if (data.results?.errors?.length > 0) {
          setError(`Some errors occurred: ${data.results.errors.slice(0, 3).join(', ')}${data.results.errors.length > 3 ? '...' : ''}`);
        }
      }

      setNewEmail('');
      setEmailTags([]);
      fetchLicenses();
      fetchLicenseStats();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setAddingLicense(false);
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if user typed a comma
    if (value.includes(',')) {
      const parts = value.split(',');
      const emailsToAdd = parts.slice(0, -1).map(email => email.trim()).filter(email => email);
      const currentInput = parts[parts.length - 1].trim();
      
      // Add valid emails as tags (avoid duplicates)
      const validEmails = emailsToAdd.filter(email => 
        email.includes('@') && 
        email.length > 0 && 
        !emailTags.includes(email)
      );
      
      if (validEmails.length > 0) {
        setEmailTags(prev => [...prev, ...validEmails]);
      }
      
      // Clear the input or keep the text after the last comma
      setNewEmail(currentInput);
    } else {
      setNewEmail(value);
    }
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newEmail.trim()) {
      e.preventDefault();
      const email = newEmail.trim();
      if (email.includes('@') && !emailTags.includes(email)) {
        setEmailTags(prev => [...prev, email]);
        setNewEmail('');
      }
    } else if (e.key === 'Backspace' && !newEmail && emailTags.length > 0) {
      // Remove last tag if backspace is pressed on empty input
      setEmailTags(prev => prev.slice(0, -1));
    }
  };

  const removeEmailTag = (emailToRemove: string) => {
    setEmailTags(prev => prev.filter(email => email !== emailToRemove));
  };

  const handleResendEmail = async (licenseId: string) => {
    try {
      const response = await fetch('/api/licenses/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to resend email');
        return;
      }

      setSuccess('Email resent successfully!');
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleRemoveLicense = async (licenseId: string) => {
    if (!confirm('Are you sure you want to remove this license?')) return;

    try {
      const response = await fetch('/api/licenses/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to remove license');
        return;
      }

      setSuccess('License removed successfully!');
      fetchLicenses();
      fetchLicenseStats();
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('/api/licenses/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import CSV');
        setImporting(false);
        return;
      }

      setSuccess(data.message);
      setCsvFile(null);
      fetchLicenses();
      fetchLicenseStats();
    } catch (err) {
      setError('An error occurred during import');
    } finally {
      setImporting(false);
    }
  };

  const handleCsvExport = async () => {
    try {
      const response = await fetch('/api/licenses/export');
      
      if (!response.ok) {
        setError('Failed to export CSV');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buda-hive-licenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('CSV exported successfully!');
    } catch (err) {
      setError('An error occurred during export');
    }
  };

  const handlePurchaseLicenses = async () => {
    const finalCount = useCustomCount ? parseInt(customLicenseCount, 10) : licenseCount;
    
    if (!finalCount || finalCount < 1) {
      setError('Please enter a valid number of licenses');
      return;
    }

    setPurchasing(true);
    setError('');

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
          numberOfLicenses: finalCount
        }),
      });

      const data = await response.json();
      console.log(data);

      if (!data.success) {
        setError(data.message || 'Failed to initiate purchase');
        setPurchasing(false);
        return;
      }

      // Redirect to Stripe checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setError('No checkout URL received');
        setPurchasing(false);
      }
    } catch (err) {
      setError('An error occurred during purchase');
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

  const filteredLicenses = licenses.filter(license =>
    license.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (isActivated: boolean) => {
    const baseClasses = "inline-block px-3 py-1.5 rounded-lg text-xs font-semibold capitalize";
    if (isActivated) {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-orange-100 text-orange-800`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const utilizationRate = statistics.total > 0 ? Math.round((statistics.activated / statistics.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-work-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 h-18 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-gray-500 font-medium">Admin Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="px-5 py-2.5 border-2 border-gray-200 rounded-lg text-gray-600 font-medium hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* License Overview Card */}
        <div className="rounded-2xl p-10 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4169B8 0%, #2d4a85 100%)' }}>
          <div className="absolute -top-1/2 -right-1/2 w-full h-full animate-pulse-slow" style={{ background: 'radial-gradient(circle, rgba(244, 187, 68, 0.15) 0%, transparent 70%)' }}></div>
          
          <div className="relative z-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">License Overview</h2>
              <p className="text-white/80">Manage and track your Buda Hive business platform licenses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="text-white/80 text-sm font-medium mb-2">Purchased Licenses</div>
                <div className="text-4xl font-bold text-white">{licenseStats.purchased_license_count}</div>
                <div className="text-white/70 text-xs mt-1">Total purchased</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="text-white/80 text-sm font-medium mb-2">Available</div>
                <div className="text-4xl font-bold text-white">{licenseStats.purchased_license_count - licenseStats.active_purchased_license_count - statistics.pending}</div>
                <div className="text-white/70 text-xs mt-1">Ready to assign</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="text-white/80 text-sm font-medium mb-2">Activated</div>
                <div className="text-4xl font-bold text-white">{statistics.activated}</div>
                <div className="text-white/70 text-xs mt-1">Active users</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="text-white/80 text-sm font-medium mb-2">Pending</div>
                <div className="text-4xl font-bold text-white">{statistics.pending}</div>
                <div className="text-white/70 text-xs mt-1">Awaiting activation</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-white/90 text-sm">
                <span>License Usage</span>
                <span>{statistics.activated} / {statistics.total}</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-buda-yellow rounded-full animate-fill-progress" style={{ width: `${utilizationRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase More Licenses Card */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-buda-blue hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Need More Licenses?
              </h3>
              <p className="text-gray-600">
                Currently have {licenseStats.purchased_license_count} purchased licenses ({licenseStats.available_licenses} available). Add more at $15/month each.
              </p>
            </div>
            <button 
              onClick={() => setShowPurchaseModal(true)}
              className="bg-buda-yellow text-buda-blue px-7 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Purchase Licenses
            </button>
          </div>
        </div>

        {/* Add User Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Add New License</h3>
            <p className="text-gray-600 text-sm">
              📝 Enter email addresses separated by commas to create multiple licenses. {licenseStats.available_licenses === 0 && <span className="text-red-600 font-semibold">⚠️ No available licenses. Please purchase more licenses first.</span>}
            </p>
          </div>
          
          <form onSubmit={handleAddLicense} className="space-y-4 mb-6">
            <div className="flex-1">
              {/* Email Tags Display */}
              {emailTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  {emailTags.map((email, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-buda-blue text-white text-sm rounded-full"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmailTag(email)}
                        className="ml-1 hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newEmail}
                  onChange={handleEmailInputChange}
                  onKeyDown={handleEmailInputKeyDown}
                  className="flex-1 px-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-buda-blue focus:outline-none focus:ring-4 focus:ring-buda-blue/10 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter email addresses separated by commas (e.g., john@example.com, jane@example.com)"
                  disabled={addingLicense || licenseStats.available_licenses === 0}
                />
                <button 
                  type="submit" 
                  disabled={addingLicense || licenseStats.available_licenses === 0 || (emailTags.length === 0 && !newEmail.trim())}
                  className="px-7 py-3.5 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingLicense ? 'Adding...' : `Add License${emailTags.length > 0 || (newEmail.includes(',')) ? 's' : ''}`}
                </button>
              </div>
            </div>
            
            {/* Helper Text */}
            <div className="text-sm text-gray-500">
              💡 <strong>Tip:</strong> Type emails separated by commas, or press Enter after each email to add them as tags. 
              {emailTags.length > 0 && (
                <span className="ml-2 text-buda-blue font-medium">
                  {emailTags.length} email{emailTags.length > 1 ? 's' : ''} ready to add
                </span>
              )}
            </div>
          </form>

          {/* CSV Upload */}
          <div className="flex items-center gap-4 p-5 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <input 
              type="file" 
              id="csv-file" 
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="hidden"
              disabled={licenseStats.available_licenses === 0}
            />
            <label 
              htmlFor="csv-file"
              className={`px-5 py-2.5 border-2 border-gray-200 bg-white rounded-lg font-medium text-gray-600 transition-all duration-300 ${
                licenseStats.available_licenses === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:border-buda-blue hover:text-buda-blue'
              }`}
            >
              Choose CSV File
            </label>
            <span className="text-sm text-gray-600 flex-1">
              {csvFile ? csvFile.name : 'Or upload multiple users via CSV'}
            </span>
            <button 
              onClick={handleCsvImport}
              disabled={!csvFile || importing || licenseStats.available_licenses === 0}
              className="px-5 py-2.5 bg-buda-yellow text-buda-blue rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-8 border-b border-gray-200">
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-gray-900">Assigned Licenses</h3>
              <p className="text-gray-600 text-sm">
                User details populate automatically after they accept invitation and complete their Moil profile
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-80">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search by email..." 
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-buda-blue focus:outline-none focus:ring-4 focus:ring-buda-blue/10 transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleCsvExport}
                className="px-5 py-2.5 bg-buda-yellow text-buda-blue rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Export CSV
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-buda-blue"></div>
                <p className="mt-4 text-gray-600">Loading licenses...</p>
              </div>
            ) : filteredLicenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No licenses found. Add your first license above!</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Added</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Activated</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLicenses.map((license) => (
                        <tr key={license.id} className="hover:bg-buda-blue/5 transition-colors duration-200">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{license.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {license.isActivated && license.businessName ? license.businessName : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {license.isActivated && license.businessType ? license.businessType : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={getStatusBadge(license.isActivated)}>
                              {license.isActivated ? 'activated' : 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(license.createdAt)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {license.activatedAt ? formatDate(license.activatedAt) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {!license.isActivated && (
                              <button 
                                onClick={() => handleResendEmail(license.id)}
                                className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                              >
                                Resend
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
                  <div>Showing {filteredLicenses.length} of {licenses.length} licenses</div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Purchase Licenses Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Purchase Licenses</h3>
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How many licenses would you like to purchase?
              </label>
              
              {/* Preset Options */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {LICENSE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setLicenseCount(preset);
                      setUseCustomCount(false);
                      setCustomLicenseCount('');
                    }}
                    className={`py-3 rounded-xl font-semibold transition-all duration-200 ${
                      !useCustomCount && licenseCount === preset
                        ? 'bg-buda-blue text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative">
                <input 
                  type="number" 
                  min="1"
                  value={customLicenseCount}
                  onChange={(e) => {
                    setCustomLicenseCount(e.target.value);
                    setUseCustomCount(true);
                  }}
                  onFocus={() => setUseCustomCount(true)}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-gray-900 focus:border-buda-blue focus:outline-none focus:ring-4 focus:ring-buda-blue/10 transition-all duration-300 ${
                    useCustomCount ? 'border-buda-blue' : 'border-gray-200'
                  }`}
                  placeholder="Or enter a custom number..."
                />
                {useCustomCount && customLicenseCount && (
                  <button
                    onClick={() => {
                      setUseCustomCount(false);
                      setCustomLicenseCount('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per license</span>
                <span className="font-semibold text-gray-900">${(licenseCount > 1 ? 12 : 15) * 12}/year</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Quantity</span>
                <span className="font-semibold text-gray-900">
                  {useCustomCount ? (parseInt(customLicenseCount, 10) || 0) : licenseCount}
                </span>
              </div>
              <div className="border-t border-gray-200 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-buda-blue">
                  ${(useCustomCount ? (parseInt(customLicenseCount, 10) || 0) : licenseCount) * (licenseCount > 1 ? 12 : 15) * 12}/year
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowPurchaseModal(false);
                  setError('');
                  setUseCustomCount(false);
                  setCustomLicenseCount('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button 
                onClick={handlePurchaseLicenses}
                disabled={purchasing || (useCustomCount && (!customLicenseCount || parseInt(customLicenseCount, 10) < 1))}
                className="flex-1 px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
