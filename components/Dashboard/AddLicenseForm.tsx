import React, { useState, useRef } from 'react';
import { Plus, Upload, X, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/toast/use-toast';

interface AddLicenseFormProps {
  availableLicenses: number;
  onLicensesAdded: () => void;
}

export function AddLicenseForm({ availableLicenses, onLicensesAdded }: AddLicenseFormProps) {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [addingLicense, setAddingLicense] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingLicense(true);

    try {
      // Combine email tags with current input
      const allEmails = [...emailTags];
      if (newEmail.trim()) {
        allEmails.push(newEmail.trim());
      }

      if (allEmails.length === 0) {
        toast({
          title: "Input Required",
          description: "Please enter at least one email address",
          type: "warning"
        });
        setAddingLicense(false);
        return;
      }

      if (allEmails.length > availableLicenses) {
        toast({
          title: "Insufficient Licenses",
          description: `You are trying to add ${allEmails.length} licenses but only have ${availableLicenses} available.`,
          type: "error"
        });
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
        throw new Error(data.error || 'Failed to add license(s)');
      }

      if (allEmails.length === 1) {
        toast({
          title: "Success",
          description: "License added successfully!",
          type: "success"
        });
      } else {
        const successCount = data.results?.success || 0;
        const errorCount = data.results?.errors?.length || 0;
        
        if (errorCount > 0) {
          toast({
            title: "Partial Success",
            description: `${successCount} license(s) added. ${errorCount} failed.`,
            type: "warning"
          });
        } else {
          toast({
            title: "Success",
            description: `${successCount} license(s) added successfully!`,
            type: "success"
          });
        }
      }

      setNewEmail('');
      setEmailTags([]);
      onLicensesAdded();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'An error occurred',
        type: "error"
      });
    } finally {
      setAddingLicense(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (availableLicenses === 0) {
      toast({
        title: "No Licenses Available",
        description: "Please purchase more licenses before importing.",
        type: "error"
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/licenses/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import CSV');
      }

      toast({
        title: "Import Successful",
        description: data.message,
        type: "success"
      });
      
      onLicensesAdded();
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message || 'An error occurred during import',
        type: "error"
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 transition-all hover:shadow-md">
      <div className="mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-buda-blue" />
          Add New License
        </h3>
        <p className="text-gray-600 text-sm">
          Enter email addresses separated by commas to create multiple licenses. 
          {availableLicenses === 0 && (
            <span className="block mt-1 text-red-600 font-semibold bg-red-50 p-2 rounded-lg inline-block">
              ⚠️ No available licenses. Please purchase more licenses first.
            </span>
          )}
        </p>
      </div>
      
      <form onSubmit={handleAddLicense} className="space-y-4 mb-6">
        <div className="flex-1">
          {/* Email Tags Display */}
          {emailTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200 animate-in fade-in slide-in-from-top-2">
              {emailTags.map((email, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-buda-blue text-white text-sm rounded-full shadow-sm"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmailTag(email)}
                    className="ml-1 hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              value={newEmail}
              onChange={handleEmailInputChange}
              onKeyDown={handleEmailInputKeyDown}
              className="flex-1 px-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-buda-blue focus:outline-none focus:ring-4 focus:ring-buda-blue/10 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter email addresses separated by commas..."
              disabled={addingLicense || availableLicenses === 0}
            />
            <button 
              type="submit" 
              disabled={addingLicense || availableLicenses === 0 || (emailTags.length === 0 && !newEmail.trim())}
              className="px-7 py-3.5 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {addingLicense ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {addingLicense ? 'Adding...' : `Add License${emailTags.length > 0 || (newEmail.includes(',')) ? 's' : ''}`}
            </button>
          </div>
        </div>
        
        {/* Helper Text */}
        <div className="text-sm text-gray-500 flex items-center justify-between flex-wrap gap-2">
          <span>
            💡 <strong>Tip:</strong> Press Enter or Comma after each email.
          </span>
          {emailTags.length > 0 && (
            <span className="text-buda-blue font-medium bg-blue-50 px-2 py-1 rounded-md">
              {emailTags.length} email{emailTags.length > 1 ? 's' : ''} ready to add
            </span>
          )}
        </div>
      </form>

      {/* CSV Upload */}
      <div className="relative group">
        <div className="absolute inset-0 bg-buda-blue/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative flex items-center gap-4 p-5 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl group-hover:border-buda-blue/50 transition-colors duration-300">
          <input 
            type="file" 
            id="csv-file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleCsvImport}
            className="hidden"
            disabled={availableLicenses === 0 || importing}
          />
          <label 
            htmlFor="csv-file"
            className={`px-5 py-2.5 border-2 border-gray-200 bg-white rounded-lg font-medium text-gray-600 transition-all duration-300 flex items-center gap-2 ${
              availableLicenses === 0 || importing
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:border-buda-blue hover:text-buda-blue hover:shadow-sm'
            }`}
          >
            <Upload className="w-4 h-4" />
            Choose CSV File
          </label>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-600 truncate block">
              {importing ? 'Importing users...' : 'Or upload multiple users via CSV'}
            </span>
          </div>
          {importing && (
             <div className="w-5 h-5 border-2 border-buda-blue/30 border-t-buda-blue rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
