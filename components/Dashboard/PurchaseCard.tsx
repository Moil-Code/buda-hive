import React from 'react';
import { ShoppingCart, PlusCircle } from 'lucide-react';

interface PurchaseCardProps {
  purchasedCount: number;
  availableCount: number;
  onPurchaseClick: () => void;
}

export function PurchaseCard({ purchasedCount, availableCount, onPurchaseClick }: PurchaseCardProps) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white border-2 border-dashed border-gray-300 rounded-2xl p-6 md:p-8 hover:border-buda-blue hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-buda-blue" />
            Need More Licenses?
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            Currently have <span className="font-semibold text-gray-900">{purchasedCount}</span> purchased licenses (<span className="font-semibold text-gray-900">{availableCount}</span> available). 
            Add more at <span className="font-semibold text-green-600">$15/month</span> each.
          </p>
        </div>
        <button 
          onClick={onPurchaseClick}
          className="w-full md:w-auto bg-buda-yellow text-buda-blue px-7 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <ShoppingCart className="w-4 h-4" />
          Purchase Licenses
        </button>
      </div>
    </div>
  );
}
