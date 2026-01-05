import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PurchaseModalProps {
  onClose: () => void;
  onPurchase: (count: number) => Promise<void>;
  purchasing: boolean;
  error?: string;
}

const LICENSE_PRESETS = [1, 5, 10, 15, 20];

export function PurchaseModal({ onClose, onPurchase, purchasing, error }: PurchaseModalProps) {
  const [licenseCount, setLicenseCount] = useState(5);
  const [customLicenseCount, setCustomLicenseCount] = useState('');
  const [useCustomCount, setUseCustomCount] = useState(false);

  const getPricePerLicense = (count: number) => {
    // Logic for volume discount - $12/month for >1 license, else $15/month
    return count > 1 ? 12 : 15;
  };

  const currentCount = useCustomCount ? (parseInt(customLicenseCount, 10) || 0) : licenseCount;
  const pricePerLicense = getPricePerLicense(currentCount);
  const totalPrice = currentCount * pricePerLicense * 12; // Annual price

  const handlePurchase = () => {
    if (currentCount > 0) {
      onPurchase(currentCount);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Purchase Licenses</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
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
                className={`py-2 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-200 ${
                  !useCustomCount && licenseCount === preset
                    ? 'bg-buda-blue text-white shadow-lg scale-105'
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 text-sm">Price per license</span>
            <span className="font-semibold text-gray-900">${pricePerLicense}/month</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 text-sm">Quantity</span>
            <span className="font-semibold text-gray-900">{currentCount}</span>
          </div>
          <div className="border-t border-gray-200 my-3"></div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-buda-blue">
                ${totalPrice}
              </div>
              <div className="text-xs text-gray-500 font-medium">billed annually</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top-2">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
          >
            Cancel
          </button>
          <button 
            onClick={handlePurchase}
            disabled={purchasing || currentCount < 1}
            className="flex-1 px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {purchasing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : 'Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
