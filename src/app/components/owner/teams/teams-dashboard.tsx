"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { TeamT, TeamInviteT, TeamMemberT } from "@/db/schema";
import { User } from "@supabase/supabase-js";

type TeamWithMemberCount = TeamT & { member_count: number };
type InviteWithTeamName = TeamInviteT & { teams: { name: string } | null };

export function TeamsDashboard() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([]);
  const [invites, setInvites] = useState<InviteWithTeamName[]>([]);
  const [isSiteOwner, setIsSiteOwner] = useState(false);
  const [teamRoles, setTeamRoles] = useState<Record<string, string>>({});
  
  // Form state
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "marketing" | "admin">("member");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Transfer ownership UI state
  const [transferTeamId, setTransferTeamId] = useState<string>("");
  const [transferEmail, setTransferEmail] = useState<string>("");
  const [transferBusy, setTransferBusy] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        setError("You must be logged in to manage teams.");
        return;
      }

      // Parallel fetch
      const [teamsResult, invitesResult, siteRoleResult, myRolesResult] = await Promise.all([
        supabase.from("teams").select("*, team_members(count)"),
        supabase.from("team_invites").select("*, teams(name)").is("accepted_at", null),
        supabase.from("app_users").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("team_members").select("team_id, role").eq("user_id", user.id),
      ]);

      if (teamsResult.error || invitesResult.error) {
        setError(teamsResult.error?.message || invitesResult.error?.message || "Failed to load data.");
      } else {
        const formattedTeams = teamsResult.data.map(t => ({ ...t, member_count: t.team_members[0]?.count || 0 }));
        setTeams(formattedTeams);
        setInvites(invitesResult.data as InviteWithTeamName[]);
        setIsSiteOwner((siteRoleResult.data?.role || "user") === "owner");
        const roleMap: Record<string, string> = {};
        ((myRolesResult.data as TeamMemberT[] | null) || []).forEach((r: TeamMemberT) => { roleMap[r.team_id] = r.role; });
        setTeamRoles(roleMap);
      }
      setLoading(false);
    };

    loadInitialData();
  }, [supabase]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !user) return;

    const { data: newTeam, error: teamError } = await supabase
      .from("teams")
      .insert({ name: newTeamName.trim() })
      .select()
      .single();

    if (teamError) {
      setError(`Failed to create team: ${teamError.message}`);
      return;
    }

    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: newTeam.id, user_id: user.id, role: "owner" });

    if (memberError) {
      setError(`Team created, but failed to assign owner: ${memberError.message}`);
    } else {
      setMessage(`Team "${newTeam.name}" created successfully.`);
      setTeams(prev => [...prev, { ...newTeam, member_count: 1 }]);
      setNewTeamName("");
    }
  };

  const canInviteForTeam = useCallback((teamId: string) => {
    if (!teamId) return false;
    return isSiteOwner || teamRoles[teamId] === "owner";
  }, [isSiteOwner, teamRoles]);

  const allowedRolesForTeam = useCallback((teamId: string): Array<"member"|"marketing"|"admin"> => {
    if (!canInviteForTeam(teamId)) return [];
    if (isSiteOwner) return ["member","marketing","admin"];
    // Team owners can invite member/marketing/admin for their team
    if (teamRoles[teamId] === "owner") return ["member","marketing","admin"];
    return [];
  }, [isSiteOwner, teamRoles, canInviteForTeam]);

  useEffect(() => {
    // Ensure selected role is allowed for the team selection
    const allowed = allowedRolesForTeam(inviteTeamId);
    if (allowed.length && !allowed.includes(inviteRole)) {
      setInviteRole(allowed[0]);
    }
  }, [inviteTeamId, allowedRolesForTeam, inviteRole]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!inviteEmail.trim() || !inviteTeamId) return;

    if (!canInviteForTeam(inviteTeamId)) {
      setError("Only the website owner or the team owner can send invites for this team.");
      return;
    }

    try {
      const response = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail.trim(), 
          team_id: inviteTeamId,
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }
      
      setMessage(`Invite sent to ${result.email}.`);
      setInvites(prev => [...prev, result as InviteWithTeamName]);
      setInviteEmail("");
      setInviteTeamId("");
      setInviteRole("member");

    } catch (error: unknown) {
      setError(`Failed to send invite: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleRevokeInvite = async (inviteId: string) => {
    const { error } = await supabase.from("team_invites").delete().eq("id", inviteId);
    if (error) {
      setError(`Failed to revoke invite: ${error.message}`);
    } else {
      setMessage("Invitation revoked.");
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
    }
  };

  if (loading) return <div className="text-center p-8">Loading teams data...</div>;
  if (error) return <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">{error}</div>;

  return (
    <div className="mt-4 space-y-8">
      {message && <div className="bg-green-900/50 border border-green-500 text-green-200 p-3 rounded-lg">{message}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Team Section */}
        <div className="rounded-lg border border-white/10 bg-black/60 p-6">
          <h3 className="text-lg font-semibold">Create New Team</h3>
          <form onSubmit={handleCreateTeam} className="mt-4 space-y-3">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g., Marketing"
              className="w-full rounded-md border-white/20 bg-white/5 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              required
            />
            <button type="submit" className="w-full rounded-md bg-blue-600 px-3 py-2 text-white font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-600" disabled={!newTeamName.trim()}>
              Create Team
            </button>
          </form>
        </div>

        {/* Invite User Section */}
        <div className="rounded-lg border border-white/10 bg-black/60 p-6">
          <h3 className="text-lg font-semibold">Invite User to Team</h3>
          <form onSubmit={handleInviteUser} className="mt-4 space-y-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-md border-white/20 bg-white/5 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              required
            />
            <select value={inviteTeamId} onChange={(e) => setInviteTeamId(e.target.value)} className="w-full rounded-md border-white/20 bg-black/80 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" required>
              <option value="" disabled>Select a team...</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <select value={inviteRole} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInviteRole(e.target.value as "member"|"marketing"|"admin")} className="w-full rounded-md border-white/20 bg-black/80 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" required>
              {allowedRolesForTeam(inviteTeamId).includes("member") && (
                <option value="member">Member</option>
              )}
              {allowedRolesForTeam(inviteTeamId).includes("marketing") && (
                <option value="marketing">Marketing</option>
              )}
              {allowedRolesForTeam(inviteTeamId).includes("admin") && (
                <option value="admin">Admin</option>
              )}
            </select>
            {!canInviteForTeam(inviteTeamId) && (
              <p className="text-amber-300 text-sm">Only the website owner or the owner of the selected team can send invites.</p>
            )}
            <button type="submit" className="w-full rounded-md bg-blue-600 px-3 py-2 text-white font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-600" disabled={!inviteEmail.trim() || !inviteTeamId || !canInviteForTeam(inviteTeamId)}>
              Send Invitation
            </button>
          </form>
        </div>
      </div>

      {/* Existing Teams Section */}
      <div className="rounded-lg border border-white/10 bg-black/60 p-6">
        <h3 className="text-lg font-semibold">Manage Teams</h3>
        <div className="mt-4 -mx-6 border-t border-white/10">
          {teams.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No teams have been created yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="text-sm text-white/70">
                <tr>
                  <th className="p-4 font-medium">Team Name</th>
                  <th className="p-4 font-medium">Members</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className="p-4">{team.name}</td>
                  <td className="p-4">{team.member_count}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <button className="text-blue-400 hover:underline text-sm disabled:opacity-50"
                        disabled={!canInviteForTeam(team.id)}
                        onClick={() => setTransferTeamId(t => t === team.id ? "" : team.id)}>
                        {transferTeamId === team.id ? 'Close' : 'Transfer Ownership'}
                      </button>
                      {transferTeamId === team.id && (
                        <div className="rounded-md border border-white/10 bg-black/40 p-3">
                          <label className="block text-xs text-white/70 mb-1">New owner email</label>
                          <input
                            type="email"
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full rounded-md border-white/20 bg-white/5 px-2 py-1.5 text-white focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              disabled={!transferEmail.trim() || transferBusy}
                              onClick={async () => {
                                setTransferBusy(true);
                                setError(null); setMessage(null);
                                try {
                                  const resp = await fetch('/api/teams/transfer-ownership', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ team_id: team.id, email: transferEmail.trim() })
                                  });
                                  const result = await resp.json();
                                  if (!resp.ok) throw new Error(result.error || 'Failed to transfer ownership');
                                  setMessage('Ownership transferred successfully.');
                                  setTransferTeamId("");
                                  setTransferEmail("");
                                } catch (e: unknown) {
                                  setError(e instanceof Error ? e.message : 'Failed to transfer ownership');
                                } finally {
                                  setTransferBusy(false);
                                }
                              }}
                              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {transferBusy ? 'Transferring…' : 'Confirm Transfer'}
                            </button>
                            <button onClick={() => { setTransferTeamId(""); setTransferEmail(""); }} className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10">Cancel</button>
                          </div>
                          <p className="mt-2 text-[11px] text-white/60">Demotes current owner(s) to Admin and promotes the specified user to Owner.</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Pending Invites Section */}
      <div className="rounded-lg border border-white/10 bg-black/60 p-6">
        <h3 className="text-lg font-semibold">Pending Invitations</h3>
        <div className="mt-4 -mx-6 border-t border-white/10">
          {invites.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No pending invitations.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="text-sm text-white/70">
                <tr>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Team</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="p-4">{invite.email}</td>
                    <td className="p-4 capitalize">{invite.role || 'member'}</td>
                    <td className="p-4">{invite.teams?.name || 'Unknown'}</td>
                    <td className="p-4">
                      <button onClick={() => handleRevokeInvite(invite.id)} className="text-red-400 hover:underline text-sm">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
