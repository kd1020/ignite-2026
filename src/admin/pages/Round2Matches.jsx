import React, { useState, useEffect, useMemo } from 'react';
import {
  getRound2Fixtures,
  recordRound2ResultWithAudit,
  getTournamentStages,
  getRound1Rankings,
  createRound2Fixtures,
  resetRound2Fixtures
} from '../../services/adminService';
import { getPublicLeaderboard } from '../../services/publicService';
import './Round2Matches.css';

const ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function generateCirclePairings(teams, duelsCount) {
  if (teams.length < 2) return {};
  // Randomly shuffle teams
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const n = shuffled.length % 2 === 0 ? shuffled.length : shuffled.length - 1;
  const pool = shuffled.slice(0, n);

  const result = {};
  const rotation = pool.slice(1);

  for (let slot = 1; slot <= duelsCount; slot++) {
    const currentList = [pool[0], ...rotation];
    const half = n / 2;
    const matches = [];

    for (let i = 0; i < half; i++) {
      const teamA = currentList[i];
      const teamB = currentList[n - 1 - i];
      const zone = ZONES[(i + (slot - 1)) % ZONES.length];

      matches.push({
        matchIndex: i + 1,
        team_a_id: teamA.team_id || teamA.id,
        team_b_id: teamB.team_id || teamB.id,
        zone
      });
    }

    result[slot] = matches;

    // Rotate circle
    const last = rotation.pop();
    rotation.unshift(last);
  }

  return result;
}

export default function Round2Matches() {
  const [fixtures, setFixtures] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Tournament stages state
  const [stageInfo, setStageInfo] = useState({ round1_completed: false, round2_started: false });
  const [viewMode, setViewMode] = useState('matchplay'); // 'matchplay' | 'setup'

  // Setup Wizard State
  const [setupStep, setSetupStep] = useState(1); // 1 = Team Qualification, 2 = Pairings & Duels
  const [r1Rankings, setR1Rankings] = useState([]);
  const [qualifyCount, setQualifyCount] = useState(16);
  const [duelCount, setDuelCount] = useState(4);
  const [pairings, setPairings] = useState({});
  const [activePairingSlot, setActivePairingSlot] = useState(1);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchReason, setLaunchReason] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);

  // Reset fixtures modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Match outcome modal
  const [targetFixture, setTargetFixture] = useState(null);
  const [chosenWinnerId, setChosenWinnerId] = useState('');
  const [matchStatus, setMatchStatus] = useState('completed');
  const [auditReason, setAuditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Standings Drawer/Modal
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [liveStandings, setLiveStandings] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  const fetchFixturesAndStage = async () => {
    try {
      setLoading(true);
      const [fixturesData, stagesData] = await Promise.all([
        getRound2Fixtures(selectedSlot),
        getTournamentStages()
      ]);
      setFixtures(fixturesData);
      setStageInfo(stagesData);

      if (fixturesData.length === 0 && !stagesData.round2_started) {
        setViewMode('setup');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to fetch duel fixtures.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixturesAndStage();
  }, [selectedSlot]);

  // Load Round 1 rankings when entering setup
  useEffect(() => {
    if (viewMode === 'setup') {
      const loadRankings = async () => {
        try {
          const rankings = await getRound1Rankings();
          setR1Rankings(rankings);
          if (rankings.length > 0) {
            // Default to 16 or 30 or total even teams
            const defaultCount = Math.min(rankings.length % 2 === 0 ? rankings.length : rankings.length - 1, 16);
            setQualifyCount(defaultCount > 0 ? defaultCount : 2);
          }
        } catch (err) {
          console.error('Failed to load R1 rankings:', err);
        }
      };
      loadRankings();
    }
  }, [viewMode]);

  // Derived qualified teams from rankings
  const qualifiedTeams = useMemo(() => {
    const count = parseInt(qualifyCount, 10) || 0;
    return r1Rankings.slice(0, count);
  }, [r1Rankings, qualifyCount]);

  // Dynamic slot tabs available in matchplay mode
  const availableSlots = useMemo(() => {
    const slotSet = new Set(fixtures.map((f) => f.slot_number));
    return Array.from(slotSet).sort((a, b) => a - b);
  }, [fixtures]);

  // Handle Random Assignment of Opponents
  const handleRandomizePairings = () => {
    if (qualifiedTeams.length < 2) {
      alert('You need at least 2 qualified teams to generate pairings.');
      return;
    }
    const d = parseInt(duelCount, 10) || 4;
    const generated = generateCirclePairings(qualifiedTeams, d);
    setPairings(generated);
    setNotification({
      type: 'success',
      message: `Opponents randomly assigned across ${d} duel slots! You can inspect or modify any match below.`
    });
  };

  // Change a match team or zone manually
  const handleManualPairChange = (slot, matchIdx, field, value) => {
    setPairings((prev) => {
      const slotMatches = prev[slot] ? [...prev[slot]] : [];
      const match = slotMatches.find((m) => m.matchIndex === matchIdx);
      if (match) {
        match[field] = value;
      }
      return { ...prev, [slot]: slotMatches };
    });
  };

  // Step navigation in setup
  const handleProceedToPairings = () => {
    const count = parseInt(qualifyCount, 10);
    if (!count || count < 2) {
      alert('Please select at least 2 teams to qualify.');
      return;
    }
    if (count % 2 !== 0) {
      alert('The number of qualified teams must be an even number for 1v1 duels.');
      return;
    }

    // Auto-generate initial pairings if empty
    if (!pairings[1] || pairings[1].length === 0) {
      const d = parseInt(duelCount, 10) || 4;
      const initial = generateCirclePairings(qualifiedTeams, d);
      setPairings(initial);
    }
    setSetupStep(2);
  };

  // Launch Round 2
  const handleConfirmLaunch = async () => {
    const d = parseInt(duelCount, 10) || 4;
    const allFixtures = [];

    for (let s = 1; s <= d; s++) {
      const slotMatches = pairings[s] || [];
      if (slotMatches.length === 0) {
        alert(`Duel 0${s} has no matches configured.`);
        return;
      }
      for (const m of slotMatches) {
        if (!m.team_a_id || !m.team_b_id) {
          alert(`Duel 0${s}, Match #${m.matchIndex} is missing a team selection.`);
          return;
        }
        if (m.team_a_id === m.team_b_id) {
          alert(`Duel 0${s}, Match #${m.matchIndex} has the same team on both sides.`);
          return;
        }
        allFixtures.push({
          slot_number: s,
          zone: m.zone || 'A',
          team_a_id: m.team_a_id,
          team_b_id: m.team_b_id
        });
      }
    }

    if (!launchReason.trim() || launchReason.trim().length < 4) {
      alert('An audit log reason (min 4 characters) is required to launch Round 2.');
      return;
    }

    setIsLaunching(true);
    try {
      await createRound2Fixtures({
        qualifiedCount: qualifiedTeams.length,
        duelCount: d,
        fixturesList: allFixtures,
        reason: launchReason
      });

      setShowLaunchModal(false);
      setLaunchReason('');
      setViewMode('matchplay');
      setNotification({
        type: 'success',
        message: `Round 2 successfully launched with ${allFixtures.length} official duels across ${d} slots!`
      });
      fetchFixturesAndStage();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to create Round 2 fixtures.' });
    } finally {
      setIsLaunching(false);
    }
  };

  // Reset Round 2
  const handleResetSubmit = async () => {
    if (!resetReason.trim() || resetReason.trim().length < 4) {
      alert('An audit log reason is required to reset Round 2.');
      return;
    }

    setIsResetting(true);
    try {
      await resetRound2Fixtures({ reason: resetReason });
      setShowResetModal(false);
      setResetReason('');
      setViewMode('setup');
      setSetupStep(1);
      setNotification({
        type: 'success',
        message: 'Round 2 fixtures reset. You can now reconfigure qualified squads and pairings.'
      });
      fetchFixturesAndStage();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to reset Round 2 fixtures.' });
    } finally {
      setIsResetting(false);
    }
  };

  // Match outcome modal controls
  const openDecisionModal = (fixture) => {
    setTargetFixture(fixture);
    const m = Array.isArray(fixture.match) ? fixture.match[0] : fixture.match;
    setChosenWinnerId(m?.winning_team_id || fixture.team_a?.id || '');
    setMatchStatus(m?.result_status || 'completed');
    setAuditReason('');
  };

  const closeDecisionModal = () => {
    setTargetFixture(null);
    setChosenWinnerId('');
    setAuditReason('');
  };

  const handleSaveResult = async () => {
    if (!chosenWinnerId) {
      alert('Please designate a winning team.');
      return;
    }

    if (!auditReason.trim() || auditReason.trim().length < 4) {
      alert('An audit log reason (min 4 characters) is required for match outcomes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordRound2ResultWithAudit({
        fixtureId: targetFixture.id,
        winningTeamId: chosenWinnerId,
        resultStatus: matchStatus,
        reason: auditReason
      });

      setNotification({
        type: 'success',
        message: 'Match result committed! Winner awarded +30,000 PTS; loser deducted -30,000 PTS. Leaderboard updated.'
      });

      closeDecisionModal();
      fetchFixturesAndStage();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to commit match outcome.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open live standings drawer
  const openLiveStandings = async () => {
    setShowStandingsModal(true);
    setStandingsLoading(true);
    try {
      const data = await getPublicLeaderboard();
      setLiveStandings(data);
    } catch (err) {
      console.error('Failed to fetch live standings:', err);
    } finally {
      setStandingsLoading(false);
    }
  };

  return (
    <div className="r2-matches-page">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-cyan">1V1 HEAD-TO-HEAD ARENA</span>
          <h1 className="page-title">ROUND 2: THE HIT LIST</h1>
        </div>

        <div className="header-actions-group">
          <div className="score-rule-badge">
            <span>WIN: <strong>+30,000 PTS</strong></span>
            <span className="divider">|</span>
            <span>LOSS: <strong>-30,000 PTS</strong></span>
          </div>

          <button onClick={openLiveStandings} className="comic-btn live-standings-btn">
            📊 LIVE LEADERBOARD
          </button>

          {viewMode === 'matchplay' && fixtures.length > 0 && (
            <button
              onClick={() => setShowResetModal(true)}
              className="comic-btn reconfig-btn"
              title="Reset and reconfigure Round 2 matchups"
            >
              ⚙ RECONFIGURE DUELS
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="notif-close">✕</button>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW MODE 1: SETUP WIZARD (Tasks 3 & 4) */}
      {/* =================================================================== */}
      {viewMode === 'setup' && (
        <div className="r2-setup-container">
          {/* Setup Header Banner */}
          <div className="setup-banner comic-panel">
            <div className="banner-left">
              <span className="comic-badge comic-tag-yellow">TOURNAMENT WIZARD</span>
              <h2 className="setup-banner-title">CONFIGURE & LAUNCH ROUND 2</h2>
              <p className="setup-banner-desc">
                Qualify top-performing squads from the Round 1 Gauntlet leaderboard and configure head-to-head duel pairings.
              </p>
            </div>
            {fixtures.length > 0 && (
              <button onClick={() => setViewMode('matchplay')} className="comic-btn cancel-setup-btn">
                ← RETURN TO ACTIVE MATCHPLAY
              </button>
            )}
          </div>

          {/* Stepper Tabs */}
          <div className="setup-steps-nav">
            <button
              onClick={() => setSetupStep(1)}
              className={`step-btn ${setupStep === 1 ? 'active' : ''}`}
            >
              <span className="step-num">1</span>
              <span>QUALIFY SQUADS ({qualifiedTeams.length} TEAMS)</span>
            </button>
            <button
              onClick={handleProceedToPairings}
              className={`step-btn ${setupStep === 2 ? 'active' : ''}`}
            >
              <span className="step-num">2</span>
              <span>DUEL PAIRINGS & ARENAS</span>
            </button>
          </div>

          {/* STEP 1: QUALIFY ROUND 1 TEAMS (Task 3) */}
          {setupStep === 1 && (
            <div className="setup-step-card comic-panel">
              <div className="step-card-header">
                <h3 className="step-title">STEP 1: SELECT NUMBER OF QUALIFYING TEAMS</h3>
                <p className="step-desc">
                  Input the number of teams to advance to Round 2. The top teams from the Round 1 leaderboard are automatically selected.
                </p>
              </div>

              <div className="qualify-controls-box">
                <div className="form-group qualify-input-group">
                  <label>NUMBER OF QUALIFYING TEAMS (x) *</label>
                  <div className="qualify-input-row">
                    <input
                      type="number"
                      min="2"
                      max={r1Rankings.length || 64}
                      step="2"
                      value={qualifyCount}
                      onChange={(e) => setQualifyCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
                      className="comic-input qualify-number-input"
                      required
                    />
                    <span className="input-hint-badge">Must be an even number</span>
                  </div>
                </div>

                <div className="qualify-summary-pill">
                  <span>Advancing: <strong>Top {qualifiedTeams.length} Squads</strong></span>
                  <span className="divider">|</span>
                  <span>Eliminated: <strong>{Math.max(0, r1Rankings.length - qualifiedTeams.length)} Squads</strong></span>
                </div>
              </div>

              {/* Live Preview of Qualified Teams */}
              <div className="rankings-preview-section">
                <h4 className="preview-heading">QUALIFICATION PREVIEW (ROUND 1 STANDINGS):</h4>
                <div className="table-responsive preview-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>QUALIFIED?</th>
                        <th>R1 RANK</th>
                        <th>TEAM NAME</th>
                        <th>TEAM ID</th>
                        <th>R1 GAUNTLET SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r1Rankings.length > 0 ? (
                        r1Rankings.map((t, idx) => {
                          const isQualified = idx < qualifyCount;
                          return (
                            <tr key={t.team_id || idx} className={isQualified ? 'qualified-row' : 'eliminated-row'}>
                              <td>
                                {isQualified ? (
                                  <span className="qualified-tag">✓ ADVANCING</span>
                                ) : (
                                  <span className="eliminated-tag">✕ CUTOFF</span>
                                )}
                              </td>
                              <td><strong>#{idx + 1}</strong></td>
                              <td><strong>{t.team_name}</strong></td>
                              <td>{t.team_number || 'PENDING'}</td>
                              <td><strong className="pts-val">{Number(t.round1_score || 0).toLocaleString()} PTS</strong></td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="empty-state-cell">
                            No approved teams with Round 1 scores found yet. You can still input team count to preview setup.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="step-actions-footer">
                <button
                  type="button"
                  onClick={handleProceedToPairings}
                  className="comic-btn comic-btn-primary next-step-btn"
                >
                  PROCEED TO DUEL PAIRINGS ({qualifiedTeams.length} TEAMS) ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DUEL PAIRINGS & RANDOM ASSIGNMENT (Task 4) */}
          {setupStep === 2 && (
            <div className="setup-step-card comic-panel">
              <div className="step-card-header">
                <div className="step-header-left">
                  <h3 className="step-title">STEP 2: DUEL BATTLE PAIRINGS</h3>
                  <p className="step-desc">
                    Specify the number of duels each team will fight, pair up opponents manually, or click <strong>Randomly Assign Opponents</strong> to generate balanced match fixtures automatically.
                  </p>
                </div>

                <div className="duel-count-box">
                  <label>DUELS PER TEAM (D):</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={duelCount}
                    onChange={(e) => {
                      const newD = Math.max(1, Math.min(8, parseInt(e.target.value, 10) || 1));
                      setDuelCount(newD);
                      if (activePairingSlot > newD) setActivePairingSlot(newD);
                    }}
                    className="comic-input duel-count-input"
                  />
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pairings-toolbar comic-panel">
                <div className="toolbar-stats">
                  <span className="stat-pill">
                    👥 <strong>{qualifiedTeams.length}</strong> Qualified Squads
                  </span>
                  <span className="stat-pill">
                    ⚔ <strong>{duelCount}</strong> Duels per Squad
                  </span>
                  <span className="stat-pill">
                    🎯 <strong>{(qualifiedTeams.length * duelCount) / 2}</strong> Total Duel Matches
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRandomizePairings}
                  className="comic-btn randomize-btn"
                  title="Randomly pair squads across all duel rounds without self-clashes"
                >
                  🎲 RANDOMLY ASSIGN OPPONENTS
                </button>
              </div>

              {/* Slot Tabs */}
              <div className="pairings-slot-tabs">
                {Array.from({ length: duelCount }, (_, i) => i + 1).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setActivePairingSlot(slot)}
                    className={`slot-tab-btn ${activePairingSlot === slot ? 'active' : ''}`}
                  >
                    DUEL 0{slot}
                    <span className="slot-match-count">
                      ({(pairings[slot] || []).length} matches)
                    </span>
                  </button>
                ))}
              </div>

              {/* Matches for active slot */}
              <div className="slot-pairings-grid">
                {(pairings[activePairingSlot] || []).map((match, mIdx) => {
                  const hasConflict = match.team_a_id && match.team_b_id && match.team_a_id === match.team_b_id;

                  return (
                    <div key={mIdx} className={`pairing-match-card comic-panel ${hasConflict ? 'conflict' : ''}`}>
                      <div className="pairing-match-top">
                        <span className="match-index-tag">MATCH #{mIdx + 1}</span>
                        <div className="zone-select-wrap">
                          <label>ZONE:</label>
                          <select
                            value={match.zone || 'A'}
                            onChange={(e) => handleManualPairChange(activePairingSlot, match.matchIndex, 'zone', e.target.value)}
                            className="comic-input zone-select"
                          >
                            {ZONES.map((z) => (
                              <option key={z} value={z}>Zone {z}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="pairing-match-body">
                        {/* Team A */}
                        <div className="team-select-col">
                          <label className="team-role-label">SQUAD A</label>
                          <select
                            value={match.team_a_id || ''}
                            onChange={(e) => handleManualPairChange(activePairingSlot, match.matchIndex, 'team_a_id', e.target.value)}
                            className="comic-input team-select"
                          >
                            <option value="">-- Select Squad A --</option>
                            {qualifiedTeams.map((t) => (
                              <option key={t.team_id || t.id} value={t.team_id || t.id}>
                                {t.team_number ? `[${t.team_number}] ` : ''}{t.team_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="match-vs-divider">VS</div>

                        {/* Team B */}
                        <div className="team-select-col">
                          <label className="team-role-label">SQUAD B</label>
                          <select
                            value={match.team_b_id || ''}
                            onChange={(e) => handleManualPairChange(activePairingSlot, match.matchIndex, 'team_b_id', e.target.value)}
                            className="comic-input team-select"
                          >
                            <option value="">-- Select Squad B --</option>
                            {qualifiedTeams.map((t) => (
                              <option key={t.team_id || t.id} value={t.team_id || t.id}>
                                {t.team_number ? `[${t.team_number}] ` : ''}{t.team_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {hasConflict && (
                        <div className="pair-conflict-alert">
                          ⚠ Invalid pairing: A team cannot compete against itself!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="step-actions-footer between">
                <button
                  type="button"
                  onClick={() => setSetupStep(1)}
                  className="comic-btn back-step-btn"
                >
                  ← BACK TO TEAM SELECTION
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLaunchReason(`Launched Round 2 with ${qualifiedTeams.length} squads across ${duelCount} duels per squad.`);
                    setShowLaunchModal(true);
                  }}
                  className="comic-btn comic-btn-primary launch-round-btn"
                >
                  🚀 CONFIRM PAIRINGS & LAUNCH ROUND 2 ➔
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW MODE 2: ACTIVE MATCHPLAY (Task 5) */}
      {/* =================================================================== */}
      {viewMode === 'matchplay' && (
        <>
          {/* Slot Filter Panel */}
          <div className="slot-filter-panel comic-panel">
            <div className="filter-title">TOURNAMENT DUEL SLOT:</div>
            <div className="slot-pills">
              <button
                onClick={() => setSelectedSlot('all')}
                className={`slot-pill ${selectedSlot === 'all' ? 'active' : ''}`}
              >
                ALL DUELS ({fixtures.length})
              </button>
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot.toString())}
                  className={`slot-pill ${selectedSlot === slot.toString() ? 'active' : ''}`}
                >
                  DUEL 0{slot}
                </button>
              ))}
            </div>
          </div>

          {/* Fixtures Grid */}
          <div className="fixtures-container">
            {loading ? (
              <div className="loading-card comic-panel">
                <div className="spinner"></div>
                <p>SYNCING DUEL FIXTURES FROM SUPABASE...</p>
              </div>
            ) : (
              <div className="fixtures-grid">
                {fixtures.length > 0 ? (
                  fixtures.map((fixture) => {
                    const match = Array.isArray(fixture.match) ? fixture.match[0] : fixture.match;
                    const isCompleted = match?.result_status === 'completed';
                    const teamAWon = match?.winning_team_id === fixture.team_a?.id;
                    const teamBWon = match?.winning_team_id === fixture.team_b?.id;

                    return (
                      <div key={fixture.id} className="fixture-card comic-panel">
                        <div className="fixture-top">
                          <span className="slot-badge">DUEL 0{fixture.slot_number}</span>
                          <span className="zone-indicator">ZONE {fixture.zone}</span>
                          <span className={`match-status-tag ${match?.result_status || 'scheduled'}`}>
                            {(match?.result_status || 'SCHEDULED').toUpperCase()}
                          </span>
                        </div>

                        <div className="matchup-arena">
                          <div className={`team-side ${teamAWon ? 'winner' : isCompleted ? 'loser' : ''}`}>
                            <span className="team-sub-id">{fixture.team_a?.team_number || 'SQUAD A'}</span>
                            <h4 className="team-duel-name">{fixture.team_a?.team_name}</h4>
                            {teamAWon && <span className="delta-badge plus">+30,000 PTS</span>}
                            {isCompleted && !teamAWon && <span className="delta-badge minus">-30,000 PTS</span>}
                          </div>

                          <div className="vs-emblem">VS</div>

                          <div className={`team-side ${teamBWon ? 'winner' : isCompleted ? 'loser' : ''}`}>
                            <span className="team-sub-id">{fixture.team_b?.team_number || 'SQUAD B'}</span>
                            <h4 className="team-duel-name">{fixture.team_b?.team_name}</h4>
                            {teamBWon && <span className="delta-badge plus">+30,000 PTS</span>}
                            {isCompleted && !teamBWon && <span className="delta-badge minus">-30,000 PTS</span>}
                          </div>
                        </div>

                        <div className="fixture-footer">
                          {isCompleted ? (
                            <div className="resolved-note">
                              <span>Decision Verified ({teamAWon ? fixture.team_a?.team_name : fixture.team_b?.team_name} Won)</span>
                              <button
                                onClick={() => openDecisionModal(fixture)}
                                className="comic-btn correct-btn"
                              >
                                CORRECT RESULT
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openDecisionModal(fixture)}
                              className="comic-btn record-winner-btn"
                            >
                              DECIDE OUTCOME
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-fixtures-card comic-panel">
                    <h3>NO FIXTURES SCHEDULED FOR THIS SLOT</h3>
                    <p>Round 2 fixtures have not been configured yet.</p>
                    <button onClick={() => setViewMode('setup')} className="comic-btn comic-btn-primary start-r2-btn">
                      ⚡ CONFIGURE & START ROUND 2
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: DECIDE MATCH OUTCOME (Task 5) */}
      {/* =================================================================== */}
      {targetFixture && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">
                RECORD DUEL 0{targetFixture.slot_number} (ZONE {targetFixture.zone})
              </h3>
              <button onClick={closeDecisionModal} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              <div className="match-callout">
                <strong>{targetFixture.team_a?.team_name}</strong> vs <strong>{targetFixture.team_b?.team_name}</strong>
              </div>

              <div className="form-group">
                <label>SELECT OFFICIAL WINNER (+30,000 PTS) *</label>
                <div className="winner-select-grid">
                  <button
                    type="button"
                    onClick={() => setChosenWinnerId(targetFixture.team_a?.id)}
                    className={`winner-option-btn ${chosenWinnerId === targetFixture.team_a?.id ? 'selected' : ''}`}
                  >
                    <span className="btn-tag">SQUAD A</span>
                    <strong>{targetFixture.team_a?.team_name}</strong>
                    <span className="delta-preview win">+30,000 PTS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChosenWinnerId(targetFixture.team_b?.id)}
                    className={`winner-option-btn ${chosenWinnerId === targetFixture.team_b?.id ? 'selected' : ''}`}
                  >
                    <span className="btn-tag">SQUAD B</span>
                    <strong>{targetFixture.team_b?.team_name}</strong>
                    <span className="delta-preview win">+30,000 PTS</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>MATCH STATUS</label>
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value)}
                  className="comic-input"
                >
                  <option value="completed">COMPLETED (NORMAL VICTORY)</option>
                  <option value="walkover">WALKOVER (OPPONENT NO-SHOW)</option>
                  <option value="disputed">DISPUTED / UNDER REVIEW</option>
                </select>
              </div>

              <div className="form-group">
                <label>AUDIT REASON / MATCH NOTES *</label>
                <textarea
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g. Verified by Arena Referee 2; confirmed buzzer-beater finish."
                  className="comic-input"
                  rows="2"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeDecisionModal} className="comic-btn modal-cancel-btn">
                CANCEL
              </button>
              <button
                onClick={handleSaveResult}
                disabled={isSubmitting}
                className="comic-btn comic-btn-primary modal-save-btn"
              >
                {isSubmitting ? 'COMMITTING TO SUPABASE...' : 'COMMIT RESULT (+30K / -30K)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CONFIRM & LAUNCH ROUND 2 */}
      {/* =================================================================== */}
      {showLaunchModal && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">LAUNCH ROUND 2: THE HIT LIST</h3>
              <button onClick={() => setShowLaunchModal(false)} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                You are about to launch Round 2 duels. Official match fixtures will be committed to the database and locked into active matchplay.
              </p>

              <div className="end-round-stats-box">
                <div className="stat-line">
                  <span>Advancing Contenders:</span>
                  <strong>{qualifiedTeams.length} Teams</strong>
                </div>
                <div className="stat-line">
                  <span>Duel Rounds per Team:</span>
                  <strong>{duelCount} Duels</strong>
                </div>
                <div className="stat-line">
                  <span>Total Match Fixtures:</span>
                  <strong>{(qualifiedTeams.length * duelCount) / 2} Matches</strong>
                </div>
              </div>

              <div className="form-group">
                <label>MANDATORY AUDIT REASON *</label>
                <textarea
                  value={launchReason}
                  onChange={(e) => setLaunchReason(e.target.value)}
                  placeholder="e.g. Launched official Round 2 fixtures after verifying team rosters."
                  className="comic-input"
                  rows="3"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowLaunchModal(false)} className="comic-btn modal-cancel-btn">
                CANCEL
              </button>
              <button
                onClick={handleConfirmLaunch}
                disabled={isLaunching}
                className="comic-btn comic-btn-primary modal-save-btn"
              >
                {isLaunching ? 'COMMITTING FIXTURES...' : 'CONFIRM & LAUNCH ROUND 2'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: RESET ROUND 2 FIXTURES */}
      {/* =================================================================== */}
      {showResetModal && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">RESET ROUND 2 MATCHPLAY</h3>
              <button onClick={() => setShowResetModal(false)} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              <div className="danger-alert-box">
                ⚠ <strong>CAUTION:</strong> Resetting Round 2 will delete all existing match fixtures and outcomes for Round 2, returning you to the team selection and pairing configurator.
              </div>

              <div className="form-group">
                <label>MANDATORY AUDIT REASON *</label>
                <textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="e.g. Reconfiguring match pairs due to team roster check-in updates."
                  className="comic-input"
                  rows="3"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowResetModal(false)} className="comic-btn modal-cancel-btn">
                CANCEL
              </button>
              <button
                onClick={handleResetSubmit}
                disabled={isResetting}
                className="comic-btn comic-btn-primary modal-save-btn bg-red"
              >
                {isResetting ? 'RESETTING...' : 'CONFIRM & RESET FIXTURES'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: LIVE STANDINGS DRAWER (Task 5 Verification) */}
      {/* =================================================================== */}
      {showStandingsModal && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel standings-modal-card">
            <div className="modal-header">
              <h3 className="modal-title">LIVE TOURNAMENT STANDINGS (ROUND 1 + ROUND 2)</h3>
              <button onClick={() => setShowStandingsModal(false)} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              <div className="standings-explanation">
                <span>Combined Score = <strong>Round 1 Gauntlet Points + Round 2 Hit List Points Delta</strong></span>
              </div>

              {standingsLoading ? (
                <div className="loading-card comic-panel">
                  <div className="spinner"></div>
                  <p>FETCHING LATEST STANDINGS...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>RANK</th>
                        <th>TEAM</th>
                        <th>R1 SCORE</th>
                        <th>R2 DELTA</th>
                        <th>TOTAL POINTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveStandings.length > 0 ? (
                        liveStandings.map((t, idx) => (
                          <tr key={t.team_id || idx}>
                            <td><strong>#{t.rank || idx + 1}</strong></td>
                            <td>
                              <strong>{t.team_name}</strong>
                              {t.team_number && <span className="team-sub-num"> [{t.team_number}]</span>}
                            </td>
                            <td>{Number(t.round1_score || 0).toLocaleString()} PTS</td>
                            <td>
                              <span className={`delta-badge ${Number(t.round2_delta) > 0 ? 'plus' : Number(t.round2_delta) < 0 ? 'minus' : 'neutral'}`}>
                                {Number(t.round2_delta) > 0 ? `+${Number(t.round2_delta).toLocaleString()}` : Number(t.round2_delta).toLocaleString()} PTS
                              </span>
                            </td>
                            <td>
                              <strong className="pts-val">{Number(t.combined_score || 0).toLocaleString()} PTS</strong>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="empty-state-cell">No team standings recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowStandingsModal(false)} className="comic-btn modal-cancel-btn">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
