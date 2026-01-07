import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, RefreshCw, CheckCircle, Clock, Mail, AlertCircle, Send, Edit2, Check, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast/use-toast';

interface License {
  id: string;
  email: string;
  isActivated: boolean;
  activatedAt: string | null;
  createdAt: string;
  businessName?: string;
  businessType?: string;
  messageId?: string | null;
}

interface LicenseListProps {
  licenses: License[];
  loading: boolean;
  onRefresh: () => void;
}

export function LicenseList({ licenses, loading, onRefresh }: LicenseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [emailStatuses, setEmailStatuses] = useState<Record<string, string>>({});
  const [fetchingStatuses, setFetchingStatuses] = useState(false);
  const [editingLicenseId, setEditingLicenseId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const { toast } = useToast();

  // Fetch email statuses from Resend
  useEffect(() => {
    const fetchEmailStatuses = async () => {
      const messageIds = licenses
        .filter(license => license.messageId)
        .map(license => license.messageId!);

      if (messageIds.length === 0) return;

      setFetchingStatuses(true);
      try {
        const response = await fetch('/api/licenses/email-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageIds }),
        });

        if (response.ok) {
          const data = await response.json();
          setEmailStatuses(data.statuses);
        }
      } catch (error) {
        console.error('Failed to fetch email statuses:', error);
      } finally {
        setFetchingStatuses(false);
      }
    };

    if (licenses.length > 0 && !loading) {
      fetchEmailStatuses();
    }
  }, [licenses, loading]);

  const filteredLicenses = licenses.filter(license =>
    license.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEditEmail = (license: License) => {
    setEditingLicenseId(license.id);
    setEditingEmail(license.email);
  };

  const handleCancelEdit = () => {
    setEditingLicenseId(null);
    setEditingEmail('');
  };

  const handleSaveEmail = async (licenseId: string) => {
    if (!editingEmail || !editingEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        type: "error"
      });
      return;
    }

    setUpdatingEmail(true);
    try {
      const response = await fetch('/api/licenses/update-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, newEmail: editingEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || 'Failed to update email',
          type: "error"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Email updated successfully",
        type: "success"
      });

      setEditingLicenseId(null);
      setEditingEmail('');
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update email",
        type: "error"
      });
    } finally {
      setUpdatingEmail(false);
    }
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
        throw new Error(data.error || 'Failed to resend email');
      }

      toast({
        title: "Email Sent",
        description: "Invitation email resent successfully!",
        type: "success"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'An error occurred',
        type: "error"
      });
    }
  };

  const handleCsvExport = async () => {
    try {
      const response = await fetch('/api/licenses/export');
      
      if (!response.ok) {
        throw new Error('Failed to export CSV');
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
      
      toast({
        title: "Export Successful",
        description: "CSV exported successfully!",
        type: "success"
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || 'An error occurred during export',
        type: "error"
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-gray-200">
        <div className="mb-2">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Assigned Licenses</h3>
          <p className="text-gray-600 text-sm">
            User details populate automatically after they accept invitation and complete their Moil profile
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-buda-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Search by email..." 
              className="w-full pl-10 text-black pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-buda-blue focus:outline-none focus:ring-2 focus:ring-buda-blue/90 transition-all duration-300 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCsvExport}
            className="w-full md:w-auto px-5 py-2.5 bg-buda-yellow text-buda-blue rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Spinner size="lg" className="mx-auto border-buda-blue" />
            <p className="mt-4 text-gray-600 animate-pulse">Loading licenses...</p>
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium text-lg">No licenses found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new license above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Activated</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-blue-50/50 transition-colors duration-200 group">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {editingLicenseId === license.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={editingEmail}
                            onChange={(e) => setEditingEmail(e.target.value)}
                            className="px-2 py-1 border border-buda-blue rounded text-sm focus:outline-none focus:ring-2 focus:ring-buda-blue"
                            autoFocus
                            disabled={updatingEmail}
                          />
                          <button
                            onClick={() => handleSaveEmail(license.id)}
                            disabled={updatingEmail}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Save"
                          >
                            {updatingEmail ? <Spinner size="sm" className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updatingEmail}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{license.email}</span>
                          {!license.isActivated && (
                            <button
                              onClick={() => handleEditEmail(license)}
                              className="p-1 text-gray-400 hover:text-buda-blue hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit email"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {license.isActivated && license.businessName ? license.businessName : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {license.isActivated && license.businessType ? license.businessType : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${
                        license.isActivated 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {license.isActivated ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {license.isActivated ? 'activated' : 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {license.messageId ? (
                        <span 
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${
                            emailStatuses[license.messageId] === 'delivered' || emailStatuses[license.messageId] === 'opened'
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : emailStatuses[license.messageId] === 'bounced' || emailStatuses[license.messageId] === 'complained'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : emailStatuses[license.messageId] === 'sent'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {fetchingStatuses ? (
                            <Spinner size="sm" className="w-3 h-3" />
                          ) : emailStatuses[license.messageId] === 'delivered' || emailStatuses[license.messageId] === 'opened' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : emailStatuses[license.messageId] === 'bounced' || emailStatuses[license.messageId] === 'complained' ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : emailStatuses[license.messageId] === 'sent' ? (
                            <Send className="w-3 h-3" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          {emailStatuses[license.messageId] || 'pending'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border bg-gray-50 text-gray-700 border-gray-200">
                          <Mail className="w-3 h-3" />
                          pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(license.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {license.activatedAt ? formatDate(license.activatedAt) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {!license.isActivated && (
                        <button 
                          onClick={() => handleResendEmail(license.id)}
                          className="p-2 border border-gray-200 bg-white rounded-lg text-gray-500 hover:border-buda-blue hover:text-buda-blue hover:bg-blue-50 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Resend Invitation"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 text-sm text-gray-500 px-2">
          <span>Showing {filteredLicenses.length} license{filteredLicenses.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
