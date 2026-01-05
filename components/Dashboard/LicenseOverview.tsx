import React from 'react';

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

interface LicenseOverviewProps {
  stats: Statistics;
  licenseStats: LicenseStats;
}

export function LicenseOverview({ stats, licenseStats }: LicenseOverviewProps) {
  const utilizationRate = stats.total > 0 ? Math.round((stats.activated / stats.total) * 100) : 0;

  return (
    <div className="rounded-2xl p-6 md:p-10 text-white relative overflow-hidden transition-all duration-300 shadow-xl" style={{ background: 'linear-gradient(135deg, #4169B8 0%, #2d4a85 100%)' }}>
      <div className="absolute -top-1/2 -right-1/2 w-full h-full animate-pulse-slow pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(244, 187, 68, 0.15) 0%, transparent 70%)' }}></div>
      
      <div className="relative z-10">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">License Overview</h2>
          <p className="text-white/80 text-sm md:text-base">Manage and track your Buda Hive business platform licenses</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-colors">
            <div className="text-white/80 text-xs md:text-sm font-medium mb-2">Purchased</div>
            <div className="text-2xl md:text-4xl font-bold text-white">{licenseStats.purchased_license_count}</div>
            <div className="text-white/70 text-[10px] md:text-xs mt-1">Total licenses</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-colors">
            <div className="text-white/80 text-xs md:text-sm font-medium mb-2">Available</div>
            <div className="text-2xl md:text-4xl font-bold text-white">{licenseStats.available_licenses}</div>
            <div className="text-white/70 text-[10px] md:text-xs mt-1">Ready to assign</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-colors">
            <div className="text-white/80 text-xs md:text-sm font-medium mb-2">Activated</div>
            <div className="text-2xl md:text-4xl font-bold text-white">{stats.activated}</div>
            <div className="text-white/70 text-[10px] md:text-xs mt-1">Active users</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-colors">
            <div className="text-white/80 text-xs md:text-sm font-medium mb-2">Pending</div>
            <div className="text-2xl md:text-4xl font-bold text-white">{stats.pending}</div>
            <div className="text-white/70 text-[10px] md:text-xs mt-1">Awaiting activation</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-white/90 text-sm">
            <span>Utilization Rate</span>
            <span>{utilizationRate}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-buda-yellow rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${utilizationRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
