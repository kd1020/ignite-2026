import { DEMO_TEAMS, LEADERBOARD_METADATA } from '../data/leaderboardData.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';
import { registerTeamPublic, getPublicLeaderboard } from './publicService.js';

/**
 * Register team public submission.
 * Uses real Supabase backend when credentials are provided in .env,
 * otherwise gracefully falls back to demo mode with clear indication.
 */
export async function submitRegistration(formData) {
  if (isSupabaseConfigured) {
    try {
      const result = await registerTeamPublic(formData);
      return {
        success: true,
        referenceId: result.teamId,
        teamName: result.teamName,
        message: result.message || 'Squad roster submitted successfully and queued for official verification.'
      };
    } catch (err) {
      console.error('[API] Real registration error, returning failure:', err);
      throw err;
    }
  }

  // Demo fallback for local development before Supabase setup
  await new Promise((resolve) => setTimeout(resolve, 850));
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const demoRef = `IGN-2026-${randomSuffix}`;

  return {
    success: true,
    referenceId: demoRef,
    teamName: formData.teamName,
    message: "Team profile created in test mode. Permanent database integration pending Supabase API configuration."
  };
}

/**
 * Fetch leaderboard rankings.
 * Uses real Supabase Postgres view when configured,
 * otherwise returns demo team data.
 */
export async function getLeaderboard() {
  if (isSupabaseConfigured) {
    try {
      const data = await getPublicLeaderboard();
      if (data && data.length > 0) {
        return data.map((t, idx) => ({
          rank: t.rank ?? idx + 1,
          teamName: t.team_name,
          teamNumber: t.team_number || 'PENDING',
          round1Score: Number(t.round1_score || 0),
          round2Delta: Number(t.round2_delta || 0),
          combinedScore: Number(t.combined_score || 0)
        }));
      }
    } catch (err) {
      console.warn('[API] Could not fetch Supabase leaderboard, falling back to demo data:', err);
    }
  }

  // Fallback to demo teams
  await new Promise((resolve) => setTimeout(resolve, 350));
  return [...DEMO_TEAMS];
}
