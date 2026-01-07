'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { X, UserPlus, Clock, Shield, Trash2, Edit2, Check, User, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  admin: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  domain: string;
  owner_id: string;
}

interface TeamData {
  team: Team | null;
  userRole: string | null;
  isOwner: boolean;
  members: TeamMember[];
  pendingInvitations: PendingInvitation[];
  hasTeam: boolean;
}

interface TeamManagementProps {
  onClose: () => void;
}

export default function TeamManagement({ onClose }: TeamManagementProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  
  // Edit team name state
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  // Create team state
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/team');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team data');
      }

      setTeamData(data);
      if (data.team) {
        setNewTeamName(data.team.name);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load team data',
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
        type: "success"
      });
      setInviteEmail('');
      fetchTeamData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to send invitation',
        type: "error"
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const response = await fetch('/api/team/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      toast({
        title: "Success",
        description: "Invitation cancelled",
        type: "success"
      });
      fetchTeamData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to cancel invitation',
        type: "error"
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      toast({
        title: "Success",
        description: "Role updated successfully",
        type: "success"
      });
      fetchTeamData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update role',
        type: "error"
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) return;

    try {
      const response = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      toast({
        title: "Success",
        description: "Member removed successfully",
        type: "success"
      });
      fetchTeamData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to remove member',
        type: "error"
      });
    }
  };

  const handleSaveTeamName = async () => {
    if (!newTeamName.trim()) return;
    
    setSavingName(true);

    try {
      const response = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update team name');
      }

      toast({
        title: "Success",
        description: "Team name updated",
        type: "success"
      });
      setEditingName(false);
      fetchTeamData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update team name',
        type: "error"
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTeam(true);

    try {
      const response = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamNameInput || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      toast({
        title: "Success",
        description: "Team created successfully!",
        type: "success"
      });
      setNewTeamNameInput('');
      fetchTeamData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to create team',
        type: "error"
      });
    } finally {
      setCreatingTeam(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 md:px-8 md:py-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-buda-blue" />
              Team Management
            </h2>
            <p className="text-gray-600 text-sm mt-1">Manage your team members and invitations</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-4 text-gray-600 animate-pulse">Loading team data...</p>
            </div>
          ) : (
            <>
              {/* No Team - Create Team Option */}
              {teamData && !teamData.hasTeam && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="w-10 h-10 text-buda-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">You're not part of a team yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Create your own team to invite collaborators, or wait for an invitation from an existing team.
                  </p>
                  
                  <form onSubmit={handleCreateTeam} className="max-w-md mx-auto space-y-4">
                    <input
                      type="text"
                      value={newTeamNameInput}
                      onChange={(e) => setNewTeamNameInput(e.target.value)}
                      placeholder="Team name (optional)"
                      className="w-full px-4 py-3 rounded-xl ring-2 ring-buda-blue focus:ring-2 focus:ring-buda-blue text-black transition-all"
                    />
                    <button
                      type="submit"
                      disabled={creatingTeam}
                      className="w-full px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creatingTeam ? <Spinner size="sm" className="text-white border-white" /> : null}
                      {creatingTeam ? 'Creating Team...' : 'Create My Team'}
                    </button>
                  </form>
                  
                  <p className="text-gray-500 text-xs mt-6 bg-gray-50 py-2 px-4 rounded-lg inline-block">
                    You can manage your licenses without a team, but creating one allows you to invite collaborators.
                  </p>
                </div>
              )}

              {teamData && teamData.hasTeam && teamData.team && (
                <div className="space-y-8">
                  {/* Team Info */}
                  <div className="bg-buda-blue rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-buda-yellow/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        {editingName ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={newTeamName}
                              onChange={(e) => setNewTeamName(e.target.value)}
                              className="px-3 py-2 text-black rounded-lg ring-2 ring-buda-blue focus:ring-2 focus:ring-buda-blue text-xl font-bold w-full md:w-auto"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveTeamName}
                                disabled={savingName}
                                className="px-3 py-2 bg-white text-buda-blue rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
                              >
                                {savingName ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingName(false);
                                  setNewTeamName(teamData.team!.name);
                                }}
                                className="px-3 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold">{teamData.team.name}</h3>
                            {teamData.isOwner && (
                              <button
                                onClick={() => setEditingName(true)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Edit team name"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-blue-100 mt-1 flex items-center gap-1">
                          <span className="opacity-70">Domain:</span> @{teamData.team.domain}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 self-start">
                        <div className="text-right">
                          <div className="text-3xl font-bold">{teamData.members.length}</div>
                          <div className="text-blue-100 text-xs uppercase tracking-wide font-medium">Members</div>
                        </div>
                        <div className="h-10 w-px bg-white/20"></div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{teamData.pendingInvitations.length}</div>
                          <div className="text-blue-100 text-xs uppercase tracking-wide font-medium">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invite Member */}
                  {(teamData.isOwner || teamData.userRole === 'admin') && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 transition-all hover:shadow-md hover:border-buda-blue/20">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-buda-blue" />
                        Invite Team Member
                      </h4>
                      <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder={`colleague@${teamData.team!.domain}`}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-buda-blue focus:border-buda-blue transition-all text-black"
                            required
                          />
                        </div>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                          className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-buda-blue focus:border-buda-blue transition-all bg-white text-black"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          disabled={inviting || !inviteEmail}
                          className="px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          {inviting ? <Spinner size="sm" className="text-white border-white" /> : null}
                          {inviting ? 'Sending...' : 'Send Invite'}
                        </button>
                      </form>
                      <p className="text-gray-500 text-xs mt-3 flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        Only @{teamData.team!.domain} emails can be invited to this team for security reasons.
                      </p>
                    </div>
                  )}

                  {/* Pending Invitations */}
                  {teamData.pendingInvitations.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Pending Invitations ({teamData.pendingInvitations.length})
                      </h4>
                      <div className="space-y-3">
                        {teamData.pendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl gap-4 hover:border-orange-200 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-orange-600 font-bold text-sm">
                                  {invitation.email[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{invitation.email}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium capitalize">
                                    {invitation.role}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    Expires {formatDate(invitation.expires_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {(teamData.isOwner || teamData.userRole === 'admin') && (
                              <button
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium self-end sm:self-center"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Members */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-buda-blue" />
                      Team Members ({teamData.members.length})
                    </h4>
                    <div className="space-y-3">
                      {teamData.members.map((member) => {
                        const firstName = member.admin?.first_name || '';
                        const lastName = member.admin?.last_name || '';
                        const email = member.admin?.email || 'Unknown';
                        const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : email[0].toUpperCase();
                        const fullName = firstName && lastName ? `${firstName} ${lastName}` : email.split('@')[0];
                        
                        return (
                        <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-buda-blue/30 hover:shadow-sm transition-all duration-200 gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-buda-blue rounded-full flex items-center justify-center text-white font-semibold shadow-sm shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {fullName}
                              </p>
                              <p className="text-sm text-gray-500">{email}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${getRoleBadgeClass(member.role)}`}>
                              {member.role}
                            </span>
                            {teamData.isOwner && member.role !== 'owner' && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-buda-blue focus:outline-none focus:ring-2 focus:ring-buda-blue bg-gray-50 text-black"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveMember(member.id, email)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
