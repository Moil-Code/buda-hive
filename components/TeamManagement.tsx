'use client';

import React, { useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
        setError(data.error || 'Failed to load team data');
        setLoading(false);
        return;
      }

      console.log(data)

      setTeamData(data);
      if (data.team) {
        setNewTeamName(data.team.name);
      }
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send invitation');
        setInviting(false);
        return;
      }

      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      fetchTeamData();
    } catch (err) {
      setError('Failed to send invitation');
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
        setError(data.error || 'Failed to cancel invitation');
        return;
      }

      setSuccess('Invitation cancelled');
      fetchTeamData();
    } catch (err) {
      setError('Failed to cancel invitation');
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
        setError(data.error || 'Failed to update role');
        return;
      }

      setSuccess('Role updated successfully');
      fetchTeamData();
    } catch (err) {
      setError('Failed to update role');
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
        setError(data.error || 'Failed to remove member');
        return;
      }

      setSuccess('Member removed successfully');
      fetchTeamData();
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleSaveTeamName = async () => {
    if (!newTeamName.trim()) return;
    
    setSavingName(true);
    setError('');

    try {
      const response = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update team name');
        setSavingName(false);
        return;
      }

      setSuccess('Team name updated');
      setEditingName(false);
      fetchTeamData();
    } catch (err) {
      setError('Failed to update team name');
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTeam(true);
    setError('');

    try {
      const response = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamNameInput || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create team');
        setCreatingTeam(false);
        return;
      }

      setSuccess('Team created successfully!');
      setNewTeamNameInput('');
      fetchTeamData();
    } catch (err) {
      setError('Failed to create team');
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
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-buda-blue"></div>
            <p className="mt-4 text-gray-600">Loading team data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
            <p className="text-gray-600 text-sm">Manage your team members and invitations</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Messages */}
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

          {/* No Team - Create Team Option */}
          {teamData && !teamData.hasTeam && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-buda-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-buda-blue focus:outline-none focus:ring-4 focus:ring-buda-blue/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="w-full px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingTeam ? 'Creating Team...' : 'Create My Team'}
                </button>
              </form>
              
              <p className="text-gray-500 text-sm mt-6">
                You can manage your licenses without a team, but creating one allows you to invite collaborators.
              </p>
            </div>
          )}

          {teamData && teamData.hasTeam && teamData.team && (
            <>
              {/* Team Info */}
              <div className="bg-buda-blue rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    {editingName ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="px-3 py-2 text-black rounded-lg text-black focus:ring-buda-blue text-xl font-bold"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveTeamName}
                          disabled={savingName}
                          className="px-4 py-2 bg-white text-buda-blue rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                          {savingName ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false);
                            setNewTeamName(teamData.team!.name);
                          }}
                          className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold">{teamData.team.name}</h3>
                        {teamData.isOwner && (
                          <button
                            onClick={() => setEditingName(true)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-white/80 mt-1">@{teamData.team.domain}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{teamData.members.length}</div>
                    <div className="text-white/80 text-sm">Team Members</div>
                  </div>
                </div>
              </div>

              {/* Invite Member */}
              {(teamData.isOwner || teamData.userRole === 'admin') && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Invite Team Member
                  </h4>
                  <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={`colleague@${teamData.team!.domain}`}
                      className="flex-1 min-w-[250px] text-black px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-buda-blue/80 transition-all"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                      className="px-4 py-3 rounded-xl focus:outline-none text-black focus:ring-2 focus:ring-buda-blue/80 transition-all bg-white"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail}
                      className="px-6 py-3 bg-buda-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviting ? 'Sending...' : 'Send Invite'}
                    </button>
                  </form>
                  <p className="text-gray-500 text-sm mt-3">
                    Only @{teamData.team!.domain} emails can be invited to this team
                  </p>
                </div>
              )}

              {/* Pending Invitations */}
              {teamData.pendingInvitations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Pending Invitations ({teamData.pendingInvitations.length})
                  </h4>
                  <div className="space-y-3">
                    {teamData.pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-600">
                            Invited as <span className="capitalize">{invitation.role}</span> • Expires {formatDate(invitation.expires_at)}
                          </p>
                        </div>
                        {(teamData.isOwner || teamData.userRole === 'admin') && (
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Team Members ({teamData.members.length})
                </h4>
                <div className="space-y-3">
                  {teamData.members.map((member) => {
                    const firstName = member.admin?.first_name || '';
                    const lastName = member.admin?.last_name || '';
                    const email = member.admin?.email || 'Unknown';
                    const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : email[0].toUpperCase();
                    const fullName = firstName && lastName ? `${firstName} ${lastName}` : email;
                    
                    return (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-buda-blue rounded-full flex items-center justify-center text-white font-semibold">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {fullName}
                          </p>
                          <p className="text-sm text-gray-600">{email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadgeClass(member.role)}`}>
                          {member.role}
                        </span>
                        {teamData.isOwner && member.role !== 'owner' && (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-buda-blue focus:outline-none"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id, email)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
