/**
 * IGNITE 2026: Public Data Service
 * Safe, read-only and registration interactions for the public website.
 * Utilizes Postgres Views to prevent exposure of PII (e.g. Leader
Mobile).
 */


import { supabase } from '../lib/supabaseClient';
import { validateRegistrationForm } from '../utils/validation';


export async function registerTeamPublic(formData) {
  const validation = validateRegistrationForm(formData);
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0] || 'Invalid registration data.');
  }


  const { data: regSetting, error: settingErr } = await supabase
    .from('event_settings')
    .select('value')
    .eq('key', 'registration_status')
    .single();


  if (!settingErr && regSetting?.value?.open === false) {
    throw new Error('Official squad registration for IGNITE 2026 is currently closed.');
  }


  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({
      team_name: formData.teamName.trim(),
      team_leader_name: formData.leaderName.trim(),
      team_leader_mobile: formData.leaderMobile.trim(),
      registration_status: 'pending'
    })
    .select('id, team_name, created_at')
    .single();


  if (teamErr) {
    if (teamErr.code === '23505') {
      throw new Error(`The team name "${formData.teamName}" is already
registered. Please choose another.`);
    }
    throw new Error(teamErr.message || 'Failed to submit registration. Please try again.');
  }


  const memberRows = formData.members
    .filter((m) => m && m.trim().length >= 2)
    .map((name) => ({
      team_id: team.id,
      member_name: name.trim()
    }));


  if (memberRows.length > 0) {
    const { error: membersErr } = await supabase
      .from('team_members')
      .insert(memberRows);


    if (membersErr) {
      console.warn('[publicService] Warning: Failed to insert members during registration:', membersErr);
    }
  }


  return {
    success: true,
    teamId: team.id,
    teamName: team.team_name,
    message: 'Your squad roster has been received and is queued for official verification.'
  };
}


export async function getPublicLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('public_leaderboard')
      .select('team_id, team_number, team_name, round1_score, round2_delta, combined_score, rank')
      .order('rank', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[publicService] getPublicLeaderboard failure:', err);
    throw err;
  }
}


export async function getPublicFixtures() {
  try {
    const { data, error } = await supabase
      .from('public_fixtures')
      .select('*')
      .order('slot_number', { ascending: true });


    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[publicService] getPublicFixtures failure:', err);
    throw err;
  }
}


export async function getPublicEventSettings() {
  try {
    const { data, error } = await supabase
      .from('event_settings')
      .select('key, value');


    if (error) throw error;


    const settingsMap = {};
    (data || []).forEach((item) => {
      settingsMap[item.key] = item.value;
    });
    return settingsMap;
  } catch (err) {
    console.error('[publicService] getPublicEventSettings failure:',
err);
    return {};
          }
        }
