import React from 'react';
import Logo from '@/components/ui/Logo';
import { Activity, Users, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  onShowActivity: () => void;
  onShowTeam: () => void;
  onLogout: () => void;
}

export function DashboardHeader({ onShowActivity, onShowTeam, onLogout }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 h-18 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden md:block text-gray-500 font-medium">Admin Dashboard</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onShowActivity}
          className="p-2 md:px-4 md:py-2.5 border-2 border-gray-200 rounded-lg text-gray-600 font-medium hover:border-buda-blue hover:text-buda-blue hover:bg-blue-50 transition-all duration-300 flex items-center gap-2"
          aria-label="View Activity"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden md:inline">Activity</span>
        </button>
        <button 
          onClick={onShowTeam}
          className="p-2 md:px-4 md:py-2.5 border-2 border-gray-200 rounded-lg text-gray-600 font-medium hover:border-buda-blue hover:text-buda-blue hover:bg-blue-50 transition-all duration-300 flex items-center gap-2"
          aria-label="Manage Team"
        >
          <Users className="w-4 h-4" />
          <span className="hidden md:inline">Team</span>
        </button>
        <button 
          onClick={onLogout}
          className="p-2 md:px-4 md:py-2.5 border-2 border-gray-200 rounded-lg text-gray-600 font-medium hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300 flex items-center gap-2"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
