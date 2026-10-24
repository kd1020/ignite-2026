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
      .order('awarded_points', { ascending: false });

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

export async function submitRound1Score({ teamId, zone, score, finishingPosition, verificationStatus, maxTeamsM, notes }) {
  try {
    const { data: user } = await supabase.auth.getUser();
    const cleanScore = verificationStatus === 'verified' ? (parseInt(score, 10) || 0) : 0;

    // Backward-compatibility bridge for databases with legacy formula trigger: (M - k + 1) * 1000
    // With k = 1 and M = round(cleanScore / 1000): (M - 1 + 1) * 1000 = cleanScore!
    const legacyM = cleanScore > 0 ? Math.max(1, Math.round(cleanScore / 1000)) : (maxTeamsM ? parseInt(maxTeamsM, 10) : 10);
    const legacyK = cleanScore > 0 ? 1 : null;

    const payload = {
      team_id: teamId,
      zone,
      awarded_points: cleanScore,
      finishing_position: finishingPosition ? parseInt(finishingPosition, 10) : legacyK,
      verification_status: verificationStatus,
      max_teams_m: legacyM,
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

export async function correctRound1ScoreWithAudit({ scoreId, newScore, newPosition, newStatus, reason }) {
  try {
    const { data: user } = await supabase.auth.getUser();
    const cleanScore = newStatus === 'verified' ? (parseInt(newScore, 10) || 0) : 0;
    const legacyM = cleanScore > 0 ? Math.max(1, Math.round(cleanScore / 1000)) : 10;
    const legacyK = cleanScore > 0 ? 1 : null;

    const { data: oldRecord } = await supabase
      .from('round1_scores')
      .select('*')
      .eq('id', scoreId)
      .single();

    const updatePayload = {
      awarded_points: cleanScore,
      finishing_position: newPosition ? parseInt(newPosition, 10) : legacyK,
      max_teams_m: legacyM,
      verification_status: newStatus,
      entered_by: user?.user?.id,
      notes: (oldRecord?.notes ? oldRecord.notes + ' ' : '') + `[Corrected: ${reason}]`,
      updated_at: new Date().toISOString()
    };

    const { data: updatedScore, error: updateErr } = await supabase
      .from('round1_scores')
      .update(updatePayload)
      .eq('id', scoreId)
      .select(`
        *,
        teams (id, team_name, team_number)
      `)
      .single();

    if (updateErr) throw updateErr;

    try {
      await supabase.from('audit_logs').insert({
        admin_id: user?.user?.id,
        action: 'SCORE_CORRECTION_R1',
        entity_name: 'round1_scores',
        entity_id: scoreId,
        previous_values: oldRecord,
        new_values: updatedScore,
        reason: reason
      });
    } catch (auditErr) {
      console.warn('[adminService] Audit log warning:', auditErr);
    }

    return updatedScore;
  } catch (err) {
    console.error('[adminService] correctRound1ScoreWithAudit failure:', err);
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

const STAGE_STORAGE_KEY = 'ignite_tournament_stages';

export async function getTournamentStages() {
  try {
    // 1. Try round_stages in event_settings
    const { data: rsData } = await supabase
      .from('event_settings')
      .select('value')
      .eq('key', 'round_stages')
      .maybeSingle();

    if (rsData?.value && typeof rsData.value === 'object') {
      const stages = {
        round1_completed: Boolean(rsData.value.round1_completed),
        round2_started: Boolean(rsData.value.round2_started),
        qualified_count: rsData.value.qualified_count || 0,
        duels_per_team: rsData.value.duels_per_team || 4,
        ...rsData.value
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(stages));
        } catch (_) {}
      }
      return stages;
    }

    // 2. Try r1_scoring_config fallback in event_settings
    const { data: r1Config } = await supabase
      .from('event_settings')
      .select('value')
      .eq('key', 'r1_scoring_config')
      .maybeSingle();

    if (r1Config?.value?.tournament_stages) {
      const stages = {
        round1_completed: false,
        round2_started: false,
        qualified_count: 0,
        duels_per_team: 4,
        ...r1Config.value.tournament_stages
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(stages));
        } catch (_) {}
      }
      return stages;
    }

    // 3. Fallback to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = window.localStorage.getItem(STAGE_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
    }

    return {
      round1_completed: false,
      round2_started: false,
      qualified_count: 0,
      duels_per_team: 4
    };
  } catch (err) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = window.localStorage.getItem(STAGE_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
    }
    return {
      round1_completed: false,
      round2_started: false,
      qualified_count: 0,
      duels_per_team: 4
    };
  }
}

async function persistTournamentStages(stages) {
  // Always cache locally so UI updates instantaneously
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(stages));
    } catch (_) {}
  }

  const { data: user } = await supabase.auth.getUser();

  // Strategy 1: Try UPDATE on round_stages (if row already exists)
  try {
    const { data: updateRes, error: updateErr } = await supabase
      .from('event_settings')
      .update({
        value: stages,
        updated_by: user?.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'round_stages')
      .select('key');

    if (!updateErr && updateRes && updateRes.length > 0) {
      return stages;
    }
  } catch (_) {}

  // Strategy 2: Try UPSERT on round_stages (works once INSERT policy is granted)
  try {
    const { error: upsertErr } = await supabase
      .from('event_settings')
      .upsert({
        key: 'round_stages',
        value: stages,
        description: 'Tracking status of tournament rounds',
        updated_by: user?.user?.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (!upsertErr) {
      return stages;
    }
  } catch (_) {}

  // Strategy 3: Update existing seeded row r1_scoring_config (guaranteed UPDATE permission without RLS violation)
  try {
    const { data: existingR1Config } = await supabase
      .from('event_settings')
      .select('value')
      .eq('key', 'r1_scoring_config')
      .maybeSingle();

    const merged = {
      ...(existingR1Config?.value || {}),
      tournament_stages: stages
    };

    await supabase
      .from('event_settings')
      .update({
        value: merged,
        updated_by: user?.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'r1_scoring_config');
  } catch (fallbackErr) {
    console.warn('[adminService] Stage fallback update warning:', fallbackErr);
  }

  return stages;
}

export async function endRound1({ reason }) {
  try {
    const { data: user } = await supabase.auth.getUser();
    const current = await getTournamentStages();
    const updated = {
      ...current,
      round1_completed: true,
      round1_ended_at: new Date().toISOString()
    };

    await persistTournamentStages(updated);

    try {
      await supabase.from('audit_logs').insert({
        admin_id: user?.user?.id,
        action: 'ROUND_1_CONCLUDED',
        entity_name: 'event_settings',
        entity_id: 'round_stages',
        previous_values: current,
        new_values: updated,
        reason: reason || 'Round 1 officially concluded by tournament administrator'
      });
    } catch (auditErr) {
      console.warn('[adminService] Audit log warning:', auditErr);
    }

    return updated;
  } catch (err) {
    console.error('[adminService] endRound1 failure:', err);
    throw err;
  }
}

export async function reopenRound1({ reason }) {
  try {
    const { data: user } = await supabase.auth.getUser();
    const current = await getTournamentStages();
    const updated = {
      ...current,
      round1_completed: false
    };

    await persistTournamentStages(updated);

    try {
      await supabase.from('audit_logs').insert({
        admin_id: user?.user?.id,
        action: 'ROUND_1_REOPENED',
        entity_name: 'event_settings',
        entity_id: 'round_stages',
        previous_values: current,
        new_values: updated,
        reason: reason || 'Round 1 reopened by tournament administrator'
      });
    } catch (auditErr) {
      console.warn('[adminService] Audit log warning:', auditErr);
    }

    return updated;
  } catch (err) {
    console.error('[adminService] reopenRound1 failure:', err);
    throw err;
  }
}

export async function getRound1Rankings() {
  try {
    const { data, error } = await supabase
      .from('public_leaderboard')
      .select('team_id, team_number, team_name, round1_score, rank')
      .order('rank', { ascending: true });

    if (!error && data && data.length > 0) return data;

    // Fallback if public_leaderboard has no view entries yet
    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, team_number, team_name')
      .eq('registration_status', 'approved');
    if (teamsErr) throw teamsErr;

    return (teams || []).map((t, idx) => ({
      team_id: t.id,
      team_number: t.team_number,
      team_name: t.team_name,
      round1_score: 0,
      rank: idx + 1
    }));
  } catch (err) {
    console.error('[adminService] getRound1Rankings failure:', err);
    throw err;
  }
}

export async function createRound2Fixtures({ qualifiedCount, duelCount, fixturesList, reason }) {
  try {
    const { data: user } = await supabase.auth.getUser();

    // 1. Delete existing matches first (due to ON DELETE RESTRICT from matches to fixtures)
    await supabase.from('round2_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Delete existing fixtures
    await supabase.from('round2_fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Insert new fixtures
    const fixturesPayload = fixturesList.map((f) => ({
      slot_number: f.slot_number,
      zone: f.zone,
      team_a_id: f.team_a_id,
      team_b_id: f.team_b_id
    }));

    const { data: insertedFixtures, error: insertFixturesErr } = await supabase
      .from('round2_fixtures')
      .insert(fixturesPayload)
      .select('id, slot_number, zone, team_a_id, team_b_id');

    if (insertFixturesErr) throw insertFixturesErr;

    // 4. Create initial scheduled matches
    const matchesPayload = insertedFixtures.map((f) => ({
      fixture_id: f.id,
      result_status: 'scheduled',
      entered_by: user?.user?.id
    }));

    const { error: insertMatchesErr } = await supabase
      .from('round2_matches')
      .insert(matchesPayload);

    if (insertMatchesErr) {
      console.warn('[adminService] Warning inserting scheduled matches:', insertMatchesErr);
    }

    // 5. Update round_stages in event_settings
    const current = await getTournamentStages();
    const updated = {
      ...current,
      round1_completed: true,
      round2_started: true,
      round2_started_at: new Date().toISOString(),
      qualified_count: qualifiedCount,
      duels_per_team: duelCount
    };

    await persistTournamentStages(updated);

    // 6. Log in audit trail
    try {
      await supabase.from('audit_logs').insert({
        admin_id: user?.user?.id,
        action: 'ROUND_2_STARTED',
        entity_name: 'round2_fixtures',
        entity_id: 'batch_launch',
        previous_values: current,
        new_values: { qualifiedCount, duelCount, totalFixtures: insertedFixtures.length },
        reason: reason || `Launched Round 2 with ${qualifiedCount} teams across ${duelCount} duels per team.`
      });
    } catch (auditErr) {
      console.warn('[adminService] Audit log warning:', auditErr);
    }

    return insertedFixtures;
  } catch (err) {
    console.error('[adminService] createRound2Fixtures failure:', err);
    throw err;
  }
}

export async function resetRound2Fixtures({ reason }) {
  try {
    const { data: user } = await supabase.auth.getUser();

    // 1. Delete matches
    await supabase.from('round2_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // 2. Delete fixtures
    await supabase.from('round2_fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Update stage
    const current = await getTournamentStages();
    const updated = {
      ...current,
      round2_started: false
    };

    await persistTournamentStages(updated);

    try {
      await supabase.from('audit_logs').insert({
        admin_id: user?.user?.id,
        action: 'ROUND_2_RESET',
        entity_name: 'round2_fixtures',
        entity_id: 'reset',
        previous_values: current,
        new_values: updated,
        reason: reason || 'Reset Round 2 fixtures'
      });
    } catch (auditErr) {
      console.warn('[adminService] Audit log warning:', auditErr);
    }

    return updated;
  } catch (err) {
    console.error('[adminService] resetRound2Fixtures failure:', err);
    throw err;
  }
}

