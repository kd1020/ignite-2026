import React, { useState, useEffect } from 'react';
        import { getRound2Fixtures, recordRound2ResultWithAudit } from
        '../../services/adminService';
        import './Round2Matches.css';
export default function Round2Matches() {
  const [fixtures, setFixtures] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);


  const [targetFixture, setTargetFixture] = useState(null);
  const [chosenWinnerId, setChosenWinnerId] = useState('');
  const [matchStatus, setMatchStatus] = useState('completed');
  const [auditReason, setAuditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchFixtures = async () => {
    try {
      setLoading(true);
      const data = await getRound2Fixtures(selectedSlot);
      setFixtures(data);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to fetch duel fixtures.' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchFixtures();
  }, [selectedSlot]);


  const openDecisionModal = (fixture) => {
    setTargetFixture(fixture);
    setChosenWinnerId(fixture.match?.winning_team_id ||
fixture.team_a?.id || '');
    setMatchStatus(fixture.match?.result_status || 'completed');
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
      alert('An audit log reason is required for recording tournament match outcomes.');
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
        message: `Match result committed. Winning squad awarded +30,000
pts; losing squad adjusted -30,000 pts.`
      });


      closeDecisionModal();
      fetchFixtures();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to commit match outcome.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="r2-matches-page">
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-cyan">1V1 HEAD-TO-HEAD
ARENA</span>
          <h1 className="page-title">ROUND 2: THE HIT LIST</h1>
        </div>


        <div className="score-rule-badge">
          <span>WIN: <strong>+30,000 PTS</strong></span>
          <span className="divider">|</span>
          <span>LOSS: <strong>-30,000 PTS</strong></span>
        </div>
      </div>


      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}
className="notif-close">✕</button>
        </div>
      )}


      <div className="slot-filter-panel comic-panel">
        <div className="filter-title">TOURNAMENT DUEL SLOT:</div>
        <div className="slot-pills">
          <button
            onClick={() => setSelectedSlot('all')}
            className={`slot-pill ${selectedSlot === 'all' ? 'active' :
''}`}
          >
            ALL DUELS
          </button>
          {[1, 2, 3, 4].map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot.toString())}
              className={`slot-pill ${selectedSlot === slot.toString() ?
'active' : ''}`}
            >
              DUEL 0{slot}
            </button>
          ))}
        </div>
      </div>


      <div className="fixtures-container">
        {loading ? (
          <div className="loading-card comic-panel">
            <div className="spinner"></div>
            <p>SYNCING APPROVED FIXTURES FROM SUPABASE...</p>
          </div>
        ) : (
          <div className="fixtures-grid">
            {fixtures.length > 0 ? (
              fixtures.map((fixture) => {
                const match = fixture.match;
                const isCompleted = match?.result_status ===
'completed';
                const teamAWon = match?.winning_team_id ===
fixture.team_a?.id;
                const teamBWon = match?.winning_team_id ===
fixture.team_b?.id;


                return (
                  <div key={fixture.id} className="fixture-card comic- panel">
                    <div className="fixture-top">
                      <span className="slot-badge">DUEL
0{fixture.slot_number}</span>
                      <span className="zone-indicator">ZONE
{fixture.zone}</span>
                      <span className={`match-status-tag
${match?.result_status || 'scheduled'}`}>
                        {(match?.result_status ||
'SCHEDULED').toUpperCase()}
                      </span>
                    </div>


                    <div className="matchup-arena">
                      <div className={`team-side ${teamAWon ? 'winner' :
isCompleted ? 'loser' : ''}`}>
                        <span className="team-sub-id">
{fixture.team_a?.team_number || 'SQUAD A'}</span>
                        <h4 className="team-duel-name">
{fixture.team_a?.team_name}</h4>
                        {teamAWon && <span className="delta-badge plus">+30,000 PTS</span>}
                        {isCompleted && !teamAWon && <span
className="delta-badge minus">-30,000 PTS</span>}
                      </div>


                      <div className="vs-emblem">VS</div>


                      <div className={`team-side ${teamBWon ? 'winner' :
isCompleted ? 'loser' : ''}`}>
                        <span className="team-sub-id">
{fixture.team_b?.team_number || 'SQUAD B'}</span>
                        <h4 className="team-duel-name">
{fixture.team_b?.team_name}</h4>
                        {teamBWon && <span className="delta-badge plus">+30,000 PTS</span>}
                        {isCompleted && !teamBWon && <span
className="delta-badge minus">-30,000 PTS</span>}
                      </div>
                    </div>


                    <div className="fixture-footer">
                      {isCompleted ? (
                        <div className="resolved-note">
                          <span>Decision Verified</span>
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
                <p>The official fixture must be imported by tournament
directors prior to match commencement.</p>
              </div>
            )}
          </div>
        )}
      </div>


      {targetFixture && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">
                RECORD DUEL 0{targetFixture.slot_number} (ZONE
{targetFixture.zone})
              </h3>
              <button onClick={closeDecisionModal} className="modal- close-btn">✕</button>
            </div>


            <div className="modal-body">
              <div className="match-callout">
                <strong>{targetFixture.team_a?.team_name}</strong> vs
<strong>{targetFixture.team_b?.team_name}</strong>
              </div>


              <div className="form-group">
                <label>SELECT OFFICIAL WINNER (+30,000 PTS) *</label>
                <div className="winner-select-grid">
                  <button
                    type="button"
                    onClick={() =>
setChosenWinnerId(targetFixture.team_a?.id)}
                    className={`winner-option-btn ${chosenWinnerId ===
targetFixture.team_a?.id ? 'selected' : ''}`}
                  >
                    <span className="btn-tag">SQUAD A</span>
                    <strong>{targetFixture.team_a?.team_name}</strong>
                  </button>


                  <button
                    type="button"
                    onClick={() =>
setChosenWinnerId(targetFixture.team_b?.id)}
                    className={`winner-option-btn ${chosenWinnerId ===
targetFixture.team_b?.id ? 'selected' : ''}`}
                  >
                    <span className="btn-tag">SQUAD B</span>
                    <strong>{targetFixture.team_b?.team_name}</strong>
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
                  <option value="completed">COMPLETED (NORMAL VICTORY)
</option>
                  <option value="walkover">WALKOVER (OPPONENT NO-SHOW)
</option>
                  <option value="disputed">DISPUTED / UNDER
REVIEW</option>
                </select>
              </div>


              <div className="form-group">
                <label>AUDIT REASON / MATCH NOTES *</label>
                <textarea
                          value={auditReason}
                          onChange={(e) => setAuditReason(e.target.value)}
                          placeholder="e.g. Verified by Arena Referee 2;         confirmed buzzer-beater finish."
                          className="comic-input"
                          rows="2"
                          required
                        />
                      </div>
                    </div>


                    <div className="modal-footer">
                      <button onClick={closeDecisionModal} className="comic-btn         modal-cancel-btn">
                        CANCEL
                      </button>
                      <button
                        onClick={handleSaveResult}
                        disabled={isSubmitting}
                        className="comic-btn comic-btn-primary modal-save-btn"
                      >
                        {isSubmitting ? 'COMMITTING TO SUPABASE...' : 'COMMIT         RESULT'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
