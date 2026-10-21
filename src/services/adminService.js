/**
         * IGNITE 2026: Administrative Data Service
         * Encapsulates privileged PostgreSQL interactions via Supabase.
         */


        import { supabase } from '../lib/supabaseClient';


        export async function getDashboardOverview() {
          try {
            const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, registration_status');
    if (teamsErr) throw teamsErr;


    const totalTeams = teams.length;
    const approvedTeams = teams.filter((t) => t.registration_status ===
'approved').length;
    const pendingTeams = teams.filter((t) => t.registration_status ===
'pending').length;


    const { count: totalMembers, error: membersErr } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true });
    if (membersErr) throw membersErr;


    const { count: r1ScoresCount, error: r1Err } = await supabase
      .from('round1_scores')
      .select('id', { count: 'exact', head: true });
    if (r1Err) throw r1Err;


    const expectedR1Scores = approvedTeams * 8;
    const r1CompletionPct = expectedR1Scores > 0 ? Math.min(100,
Math.round((r1ScoresCount / expectedR1Scores) * 100)) : 0;


    const { data: fixtures, error: fixturesErr } = await supabase
      .from('round2_fixtures')
      .select('id');
    if (fixturesErr) throw fixturesErr;


    const { data: completedMatches, error: matchesErr } = await supabase
      .from('round2_matches')
      .select('id')
      .eq('result_status', 'completed');
    if (matchesErr) throw matchesErr;


    const totalFixtures = fixtures.length;
    const completedMatchesCount = completedMatches.length;


    const { data: recentLogs, error: logsErr } = await supabase
      .from('audit_logs')
      .select('id, action, entity_name, entity_id, reason, created_at, admin_id')
      .order('created_at', { ascending: false })
      .limit(6);
    if (logsErr) throw logsErr;


    const { data: regSetting } = await supabase
      .from('event_settings')
      .select('value')
      .eq('key', 'registration_status')
      .single();


    const isRegistrationOpen = Boolean(regSetting?.value?.open);


    return {
      totalTeams,
      approvedTeams,
      pendingTeams,
      totalMembers: totalMembers || 0,
      r1ScoresCount: r1ScoresCount || 0,
      expectedR1Scores,
      r1CompletionPct,
      totalFixtures,
      completedMatchesCount,
      isRegistrationOpen,
      recentLogs: recentLogs || []
    };
  } catch (err) {
    console.error('[adminService] getDashboardOverview failure:', err);
    throw err;
  }
}


export async function getTeams({ statusFilter = 'all', searchQuery = ''
} = {}) {
  try {
    let query = supabase
      .from('teams')
      .select(`
        id,
        team_number,
        team_name,
        team_leader_name,
        team_leader_mobile,
        registration_status,
        notes,
        created_at,
        team_members (
          id,
          member_name
        )
      `)
      .order('created_at', { ascending: false });


    if (statusFilter !== 'all') {
      query = query.eq('registration_status', statusFilter);
    }


    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query =
query.or(`team_name.ilike.${q},team_number.ilike.${q},team_leader_name.i
like.${q}`);
    }


    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[adminService] getTeams failure:', err);
    throw err;
  }
}


export async function updateTeamStatus(teamId, newStatus, reason) {
  try {
    const { data: user } = await supabase.auth.getUser();
    const { data: oldTeam } = await
supabase.from('teams').select('*').eq('id', teamId).single();


    const { data, error } = await supabase
      .from('teams')
      .update({
        registration_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();


    if (error) throw error;


    await supabase.from('audit_logs').insert({
      admin_id: user?.user?.id,
      action: 'TEAM_STATUS_UPDATE',
      entity_name: 'teams',
      entity_id: teamId,
      previous_values: oldTeam,
      new_values: data,
      reason: reason || `Updated team status to ${newStatus}`
    });


    return data;
  } catch (err) {
    console.error('[adminService] updateTeamStatus failure:', err);
    throw err;
  }
}


export async function assignTeamNumber(teamId, teamNumber, reason) {
  try {
    const { data: user } = await supabase.auth.getUser();
    const cleanNumber = teamNumber.trim().toUpperCase();


    const { data: oldTeam } = await
supabase.from('teams').select('*').eq('id', teamId).single();


    const { data, error } = await supabase
      .from('teams')
      .update({
        team_number: cleanNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();


    if (error) throw error;


    await supabase.from('audit_logs').insert({
      admin_id: user?.user?.id,
      action: 'TEAM_NUMBER_ASSIGNED',
      entity_name: 'teams',
      entity_id: teamId,
      previous_values: oldTeam,
      new_values: data,
      reason: reason || `Assigned official team number ${cleanNumber}`
    });


    return data;
  } catch (err) {
    console.error('[adminService] assignTeamNumber failure:', err);
    throw err;
  }
}


export async function getRound1Scores(zone = 'all') {
  try {
    let query = supabase
      .from('round1_scores')
      .select(`
        id,
        team_id,
        zone,
        finishing_position,
        verification_status,
        max_teams_m,
        awarded_points,
        notes,
        created_at,
        updated_at,
        teams (
          id,
          team_name,
          team_number
        )
      `)
      .order('zone', { ascending: true })
      .order('finishing_position', { ascending: true });


    if (zone !== 'all') {
      query = query.eq('zone', zone);
    }


    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[adminService] getRound1Scores failure:', err);
    throw err;
  }
}


export async function submitRound1Score({ teamId, zone,
finishingPosition, verificationStatus, maxTeamsM, notes }) {
  try {
    const { data: user } = await supabase.auth.getUser();


    const payload = {
      team_id: teamId,
      zone,
      finishing_position: finishingPosition ?
parseInt(finishingPosition, 10) : null,
      verification_status: verificationStatus,
      max_teams_m: maxTeamsM ? parseInt(maxTeamsM, 10) : 12,
      entered_by: user?.user?.id,
      notes: notes || null
    };


    const { data, error } = await supabase
      .from('round1_scores')
      .upsert(payload, { onConflict: 'team_id, zone' })
      .select(`
        *,
        teams (id, team_name, team_number)
      `)
      .single();


    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[adminService] submitRound1Score failure:', err);
    throw err;
  }
}


export async function correctRound1ScoreWithAudit({ scoreId,
newPosition, newStatus, reason }) {
  try {
    const { data, error } = await
supabase.rpc('fn_correct_round1_score', {
      p_score_id: scoreId,
      p_new_position: newPosition ? parseInt(newPosition, 10) : null,
      p_new_status: newStatus,
      p_reason: reason
    });


    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[adminService] correctRound1ScoreWithAudit failure:',
err);
    throw err;
  }
}


export async function getRound2Fixtures(slotNumber = 'all') {
  try {
    let query = supabase
      .from('round2_fixtures')
      .select(`
        id,
        slot_number,
        zone,
        team_a:team_a_id (id, team_name, team_number),
        team_b:team_b_id (id, team_name, team_number),
        match:round2_matches (
          id,
          result_status,
          winning_team_id,
          losing_team_id,
          score_delta_win,
          score_delta_loss,
          notes,
          updated_at
        )
      `)
      .order('slot_number', { ascending: true })
      .order('zone', { ascending: true });


    if (slotNumber !== 'all') {
      query = query.eq('slot_number', parseInt(slotNumber, 10));
    }


    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[adminService] getRound2Fixtures failure:', err);
    throw err;
  }
}


export async function recordRound2ResultWithAudit({ fixtureId,
winningTeamId, resultStatus, reason }) {
  try {
    const { data, error } = await
supabase.rpc('fn_record_round2_result', {
      p_fixture_id: fixtureId,
      p_winning_team_id: winningTeamId,
      p_result_status: resultStatus,
      p_reason: reason
    });


    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[adminService] recordRound2ResultWithAudit failure:',
err);
    throw err;
  }
}


export async function getAuditLogs({ limit = 50, offset = 0 } = {}) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        admin_id,
        action,
        entity_name,
        entity_id,
        previous_values,
        new_values,
        reason,
        created_at,
        admin_users:admin_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);


    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[adminService] getAuditLogs failure:', err);
    throw err;
  }
}


export async function getEventSettings() {
  try {
    const { data, error } = await
supabase.from('event_settings').select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[adminService] getEventSettings failure:', err);
    throw err;
          }
        }


        export async function updateEventSetting(key, value, reason) {
          try {
            const { data: user } = await supabase.auth.getUser();
            const { data: oldSetting } = await
        supabase.from('event_settings').select('*').eq('key', key).single();


            const { data, error } = await supabase
              .from('event_settings')
              .update({
                value,
                updated_by: user?.user?.id,
                updated_at: new Date().toISOString()
              })
              .eq('key', key)
              .select()
              .single();


            if (error) throw error;


            await supabase.from('audit_logs').insert({
              admin_id: user?.user?.id,
              action: 'EVENT_SETTING_UPDATE',
              entity_name: 'event_settings',
              entity_id: key,
              previous_values: oldSetting,
              new_values: data,
              reason: reason || `Updated event setting [${key}]`
            });


            return data;
          } catch (err) {
            console.error('[adminService] updateEventSetting failure:', err);
            throw err;
          }
        }
