'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { X, Activity as ActivityIcon, Filter, ChevronLeft, ChevronRight, Inbox, Users, Clock } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  admin: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface ActivityPanelProps {
  onClose: () => void;
}

const ACTIVITY_TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  license_added: { icon: '➕', color: 'text-green-600', bgColor: 'bg-green-100' },
  license_removed: { icon: '🗑️', color: 'text-red-600', bgColor: 'bg-red-100' },
  license_activated: { icon: '✅', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  license_resend: { icon: '📧', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  licenses_imported: { icon: '📥', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  licenses_purchased: { icon: '💳', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  member_invited: { icon: '📨', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  member_joined: { icon: '👋', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  member_removed: { icon: '👤', color: 'text-red-600', bgColor: 'bg-red-100' },
  member_role_changed: { icon: '🔄', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  team_settings_updated: { icon: '⚙️', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  license_added: 'License Added',
  license_removed: 'License Removed',
  license_activated: 'License Activated',
  license_resend: 'Email Resent',
  licenses_imported: 'Licenses Imported',
  licenses_purchased: 'Licenses Purchased',
  member_invited: 'Member Invited',
  member_joined: 'Member Joined',
  member_removed: 'Member Removed',
  member_role_changed: 'Role Changed',
  team_settings_updated: 'Settings Updated',
};

export default function ActivityPanel({ onClose }: ActivityPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const [hasTeam, setHasTeam] = useState(true);
  const limit = 20;

  useEffect(() => {
    fetchActivities();
  }, [filter, offset]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (filter) {
        params.append('type', filter);
      }

      const response = await fetch(`/api/team/activity?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load activities');
      }

      setActivities(data.activities);
      setTotal(data.total);
      setHasTeam(data.hasTeam !== false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load activities',
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getActivityConfig = (type: string) => {
    return ACTIVITY_TYPE_CONFIG[type] || { icon: '📋', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 md:px-8 md:py-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ActivityIcon className="w-6 h-6 text-buda-blue" />
              Activity Log
            </h2>
            <p className="text-gray-600 text-sm mt-1">Track all actions taken by team members</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter */}
        <div className="px-6 md:px-8 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setOffset(0);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:border-buda-blue focus:outline-none bg-white text-sm w-full md:w-auto hover:border-gray-300 transition-colors cursor-pointer"
          >
            <option value="">All Activities</option>
            <optgroup label="License Actions">
              <option value="license_added">License Added</option>
              <option value="license_removed">License Removed</option>
              <option value="license_activated">License Activated</option>
              <option value="license_resend">Email Resent</option>
              <option value="licenses_imported">Licenses Imported</option>
              <option value="licenses_purchased">Licenses Purchased</option>
            </optgroup>
            <optgroup label="Team Actions">
              <option value="member_invited">Member Invited</option>
              <option value="member_joined">Member Joined</option>
              <option value="member_removed">Member Removed</option>
              <option value="member_role_changed">Role Changed</option>
              <option value="team_settings_updated">Settings Updated</option>
            </optgroup>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <div className="text-center py-12">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-4 text-gray-600 animate-pulse">Loading activities...</p>
            </div>
          ) : !hasTeam ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-buda-blue" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Activity</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Activity logs are only available for team members. Create or join a team to start tracking activities.
              </p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No activities found</p>
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="mt-2 text-buda-blue hover:underline text-sm font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const config = getActivityConfig(activity.activity_type);
                return (
                  <div key={activity.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all duration-200">
                    <div className={`w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-lg">{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`text-xs font-semibold ${config.color} uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/50`}>
                            {ACTIVITY_TYPE_LABELS[activity.activity_type] || activity.activity_type}
                          </span>
                          <p className="text-gray-900 mt-1.5 leading-snug">{activity.description}</p>
                        </div>
                        <span className="text-gray-400 text-xs whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                      {activity.admin && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                            {activity.admin.first_name?.[0] || activity.admin.email[0].toUpperCase()}
                          </div>
                          <span>
                            by <span className="font-medium text-gray-700">{activity.admin.first_name} {activity.admin.last_name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="border-t border-gray-200 px-6 py-4 md:px-8 flex items-center justify-between bg-gray-50">
            <p className="text-gray-600 text-sm font-medium">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-white hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-white hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

