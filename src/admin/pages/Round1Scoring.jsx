import React, { useState, useEffect, useMemo } from 'react';
import {
  getTeams,
  getRound1Scores,
  submitRound1Score,
  correctRound1ScoreWithAudit,
  getTournamentStages,
  endRound1,
  reopenRound1
} from '../../services/adminService';
import './Round1Scoring.css';

export default function Round1Scoring() {
  const [scores, setScores] = useState([]);
  const [approvedTeams, setApprovedTeams] = useState([]);
  const [selectedZone, setSelectedZone] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [stageInfo, setStageInfo] = useState({ round1_completed: false });

  const [formTeamId, setFormTeamId] = useState('');
  const [formZone, setFormZone] = useState('A');
  const [formPosition, setFormPosition] = useState('');
  const [formStatus, setFormStatus] = useState('verified');
  const [formMaxM, setFormMaxM] = useState(10);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctPosition, setCorrectPosition] = useState('');
  const [correctStatus, setCorrectStatus] = useState('verified');
  const [correctReason, setCorrectReason] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  const [showEndRoundModal, setShowEndRoundModal] = useState(false);
  const [endRoundReason, setEndRoundReason] = useState('');
  const [isEndingRound, setIsEndingRound] = useState(false);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopeningRound, setIsReopeningRound] = useState(false);

  const ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [scoresData, teamsData, stagesData] = await Promise.all([
        getRound1Scores(selectedZone),
        getTeams({ statusFilter: 'approved' }),
        getTournamentStages()
      ]);
      setScores(scoresData);
      setApprovedTeams(teamsData);
      setStageInfo(stagesData);
      if (teamsData.length > 0 && !formTeamId) {
        setFormTeamId(teamsData[0].id);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to sync score registry.' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [selectedZone]);


  const livePreviewScore = useMemo(() => {
    if (formStatus !== 'verified') return 0;
    const k = parseInt(formPosition, 10);
    const m = parseInt(formMaxM, 10);
    if (!k || k <= 0 || !m || k > m) return 0;
    return (m - k + 1) * 1000;
  }, [formPosition, formMaxM, formStatus]);


  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!formTeamId) {
      alert('Please select a valid squad.');
      return;
    }


    setIsSubmitting(true);
    try {
      await submitRound1Score({
        teamId: formTeamId,
        zone: formZone,
        finishingPosition: formPosition,
        verificationStatus: formStatus,
        maxTeamsM: formMaxM,
        notes: formNotes
      });


      setNotification({
        type: 'success',
        message: `Saved Zone ${formZone} score for team. Awarded points:
${livePreviewScore.toLocaleString()} pts.`
      });


      setFormPosition('');
      setFormNotes('');
      loadData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to record score.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const openCorrectionModal = (scoreRecord) => {
    setCorrectionTarget(scoreRecord);
    setCorrectPosition(scoreRecord.finishing_position || '');
    setCorrectStatus(scoreRecord.verification_status);
    setCorrectReason('');
  };


  const closeCorrectionModal = () => {
    setCorrectionTarget(null);
    setCorrectPosition('');
    setCorrectReason('');
  };


  const handleCorrectionSubmit = async () => {
    if (!correctReason.trim() || correctReason.trim().length < 5) {
      alert('An audit reason of at least 5 characters is required for score changes.');
      return;
    }


    setIsCorrecting(true);
    try {
      await correctRound1ScoreWithAudit({
        scoreId: correctionTarget.id,
        newPosition: correctPosition,
        newStatus: correctStatus,
        reason: correctReason
      });
      setNotification({
        type: 'success',
        message: `Score for ${correctionTarget.teams?.team_name} in Zone
${correctionTarget.zone} successfully corrected with audit trail.`
      });


      closeCorrectionModal();
      loadData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message ||
'Correction failed.' });
    } finally {
      setIsCorrecting(false);
    }
  };


  const handleEndRound1Submit = async () => {
    if (!endRoundReason.trim() || endRoundReason.trim().length < 4) {
      alert('An audit log reason (min 4 characters) is required to conclude Round 1.');
      return;
    }

    setIsEndingRound(true);
    try {
      const updated = await endRound1({ reason: endRoundReason });
      setStageInfo(updated);
      setShowEndRoundModal(false);
      setEndRoundReason('');
      setNotification({
        type: 'success',
        message: 'Round 1 has been officially concluded! Standings are locked for Round 2 qualification.'
      });
      loadData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to end Round 1.' });
    } finally {
      setIsEndingRound(false);
    }
  };

  const handleReopenRound1Submit = async () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 4) {
      alert('An audit log reason (min 4 characters) is required to reopen Round 1.');
      return;
    }

    setIsReopeningRound(true);
    try {
      const updated = await reopenRound1({ reason: reopenReason });
      setStageInfo(updated);
      setShowReopenModal(false);
      setReopenReason('');
      setNotification({
        type: 'success',
        message: 'Round 1 reopened! You can continue entering and adjusting zone scores.'
      });
      loadData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to reopen Round 1.' });
    } finally {
      setIsReopeningRound(false);
    }
  };

  return (
    <div className="r1-scoring-page">
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-yellow">TIMED SECTOR SCORING</span>
          <h1 className="page-title">ROUND 1: THE GAUNTLET</h1>
        </div>

        <div className="formula-pill">
          <code>Score = (M - k + 1) × 1,000</code>
        </div>
      </div>

      {/* Round 1 Status Control Banner */}
      <div className={`round-status-banner comic-panel ${stageInfo.round1_completed ? 'concluded' : 'active'}`}>
        <div className="status-meta">
          <span className={`status-dot ${stageInfo.round1_completed ? 'locked' : 'online'}`}></span>
          <div>
            <h3 className="status-heading">
              {stageInfo.round1_completed
                ? 'ROUND 1 CONCLUDED // STANDINGS LOCKED'
                : 'ROUND 1 ACTIVE // IN PROGRESS'}
            </h3>
            <p className="status-sub">
              {stageInfo.round1_completed
                ? `Official Gauntlet performance is locked for Round 2 qualification.${stageInfo.round1_ended_at ? ` (Ended: ${new Date(stageInfo.round1_ended_at).toLocaleTimeString()})` : ''}`
                : `Active zone scoring in progress (${scores.length} score entries recorded across ${approvedTeams.length} approved squads).`}
            </p>
          </div>
        </div>

        {stageInfo.round1_completed ? (
          <button
            onClick={() => setShowReopenModal(true)}
            className="comic-btn reopen-btn"
            title="Reopen Round 1 for further scoring"
          >
            🔓 REOPEN ROUND 1
          </button>
        ) : (
          <button
            onClick={() => setShowEndRoundModal(true)}
            className="comic-btn end-round-btn"
            title="Conclude Round 1 and lock standings"
          >
            🏁 END ROUND 1
          </button>
        )}
      </div>


      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}
className="notif-close">✕</button>
        </div>
      )}


      <div className="r1-scoring-grid">
        <div className="entry-card comic-panel">
          <div className="card-top-bar">
            <span className="badge-pill">SCORE ENTRY CONSOLE</span>
          </div>
          <h3 className="panel-title">RECORD FINISHING POSITION</h3>


          <form onSubmit={handleSubmitScore} className="scoring-form">
            <div className="form-group">
              <label>SQUAD *</label>
              <select
                value={formTeamId}
                onChange={(e) => setFormTeamId(e.target.value)}
                className="comic-input"
                required
              >
                {approvedTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.team_number ? `[${t.team_number}] ` : ''}
{t.team_name}
                  </option>
                ))}
              </select>
            </div>


            <div className="form-row-2">
              <div className="form-group">
                <label>ZONE *</label>
                <select
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="comic-input"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>Zone {z}</option>
                  ))}
                </select>
              </div>


              <div className="form-group">
                <label>MAX TEAMS IN ZONE (M)</label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={formMaxM}
                  onChange={(e) => setFormMaxM(e.target.value)}
                  className="comic-input"
                  required
                />
              </div>
            </div>


            <div className="form-row-2">
              <div className="form-group">
                <label>FINISHING RANK (k) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1 (1st place)"
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="comic-input"
                  required={formStatus === 'verified'}
                />
              </div>


              <div className="form-group">
                <label>VERIFICATION STATUS *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="comic-input"
                >
                  <option value="verified">VERIFIED (TIMED)</option>
                  <option value="unverified">UNVERIFIED (0 PTS)</option>
                  <option value="did_not_finish">DID NOT FINISH (DNF)
</option>
                  <option value="disqualified">DISQUALIFIED (DQ)
</option>
                </select>
              </div>
            </div>
            <div className="score-preview-box">
              <div className="preview-label">CALCULATED SCORE PREVIEW:
</div>
              <div className="preview-points">
{livePreviewScore.toLocaleString()} PTS</div>
              <div className="preview-formula-audit">
                {formStatus === 'verified' && formPosition ? (
                  <span>({formMaxM} - {formPosition} + 1) × 1,000 =
{livePreviewScore.toLocaleString()}</span>
                ) : (
                  <span>Status = {formStatus.toUpperCase()} (Zero Points
Rule Enforced)</span>
                )}
              </div>
            </div>


            <div className="form-group">
              <label>OPTIONAL SCORER NOTES</label>
              <input
                type="text"
                placeholder="e.g. Verified by Zone Marshal Alpha at 07:42"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="comic-input"
              />
            </div>


            <button
              type="submit"
              disabled={isSubmitting}
              className="comic-btn comic-btn-primary submit-score-btn"
            >
              {isSubmitting ? 'RECORDING IN SUPABASE...' : 'COMMIT ZONE SCORE'}
            </button>
          </form>
        </div>


        <div className="scores-table-card comic-panel">
          <div className="table-header-block">
            <h3 className="panel-title">RECORDED ZONE PERFORMANCES</h3>
            <div className="zone-filter-pills">
              <button
                onClick={() => setSelectedZone('all')}
                className={`zone-pill ${selectedZone === 'all' ?
'active' : ''}`}
              >
                ALL
              </button>
              {ZONES.map((z) => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`zone-pill ${selectedZone === z ? 'active'
: ''}`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>


          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ZONE</th>
                  <th>TEAM</th>
                  <th>RANK (k)</th>
                  <th>STATUS</th>
                  <th>POINTS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {scores.length > 0 ? (
                  scores.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="zone-tag">ZONE {s.zone}</span>
                      </td>
                      <td>
                        <strong>{s.teams?.team_name}</strong>
                        {s.teams?.team_number && <span className="team- sub-num"> [{s.teams.team_number}]</span>}
                      </td>
                      <td>{s.finishing_position ?
`#${s.finishing_position}` : 'N/A'}</td>
                      <td>
                        <span className={`status-pill-badge
${s.verification_status}`}>
                          {s.verification_status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong className="pts-val">
{s.awarded_points.toLocaleString()}</strong>
                      </td>
                      <td>
                        <button
                          onClick={() => openCorrectionModal(s)}
                          className="action-link"
                          title="Authorized score revision"
                        >
                          CORRECT
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state-cell">
                      No scores recorded yet for the selected zone
filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {correctionTarget && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">
                CORRECT SCORE: {correctionTarget.teams?.team_name} (ZONE
{correctionTarget.zone})
              </h3>
              <button onClick={closeCorrectionModal} className="modal- close-btn">✕</button>
            </div>


            <div className="modal-body">
              <div className="correction-warning">
                ⚠ All revisions are permanently logged to the immutable
audit trail with your admin ID.
              </div>


              <div className="form-group">
                <label>NEW FINISHING POSITION (k)</label>
                <input
                  type="number"
                  min="1"
                  value={correctPosition}
                  onChange={(e) => setCorrectPosition(e.target.value)}
                  className="comic-input"
                />
              </div>


              <div className="form-group">
                <label>NEW VERIFICATION STATUS</label>
                <select
                  value={correctStatus}
                  onChange={(e) => setCorrectStatus(e.target.value)}
                  className="comic-input"
                >
                  <option value="verified">VERIFIED</option>
                  <option value="unverified">UNVERIFIED</option>
                  <option value="did_not_finish">DID NOT FINISH</option>
                  <option value="disqualified">DISQUALIFIED</option>
                        </select>
                      </div>


                      <div className="form-group">
                        <label>MANDATORY AUDIT REASON *</label>
                        <textarea
                          value={correctReason}
                          onChange={(e) => setCorrectReason(e.target.value)}
                          placeholder="e.g. Scorer timing sheet typo; adjusted         from #3 to #2 after official stopwatch re-check."
                          className="comic-input"
                          rows="3"
                          required
                        />
                      </div>
                    </div>


                    <div className="modal-footer">
                      <button onClick={closeCorrectionModal} className="comic-btn modal-cancel-btn">
                        CANCEL
                      </button>
                      <button
                        onClick={handleCorrectionSubmit}
                        disabled={isCorrecting}
                        className="comic-btn comic-btn-primary modal-save-btn"
                      >
                        {isCorrecting ? 'APPLYING AUDITED REVISION...' : 'CONFIRM CORRECTION'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

      {/* Modal: Conclude Round 1 */}
      {showEndRoundModal && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">OFFICIALLY CONCLUDE ROUND 1</h3>
              <button onClick={() => setShowEndRoundModal(false)} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                Concluding Round 1 locks the Gauntlet standings and finalizes the team rankings used to qualify squads for Round 2 duels.
              </p>

              <div className="end-round-stats-box">
                <div className="stat-line">
                  <span>Approved Participating Squads:</span>
                  <strong>{approvedTeams.length}</strong>
                </div>
                <div className="stat-line">
                  <span>Total Zone Scores Recorded:</span>
                  <strong>{scores.length} / {approvedTeams.length * 8}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>MANDATORY AUDIT REASON *</label>
                <textarea
                  value={endRoundReason}
                  onChange={(e) => setEndRoundReason(e.target.value)}
                  placeholder="e.g. All 8 timed zones completed and verified by zone marshals."
                  className="comic-input"
                  rows="3"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowEndRoundModal(false)}
                className="comic-btn modal-cancel-btn"
              >
                CANCEL
              </button>
              <button
                onClick={handleEndRound1Submit}
                disabled={isEndingRound}
                className="comic-btn comic-btn-primary modal-save-btn bg-red"
              >
                {isEndingRound ? 'CONCLUDING ROUND 1...' : 'CONFIRM & LOCK ROUND 1'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reopen Round 1 */}
      {showReopenModal && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">REOPEN ROUND 1</h3>
              <button onClick={() => setShowReopenModal(false)} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                Reopening Round 1 unlocks score entry so tournament marshals can make further adjustments or enter missing zone records.
              </p>

              <div className="form-group">
                <label>MANDATORY AUDIT REASON *</label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Reopened to record late stopwatch verification for Zone G."
                  className="comic-input"
                  rows="3"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowReopenModal(false)}
                className="comic-btn modal-cancel-btn"
              >
                CANCEL
              </button>
              <button
                onClick={handleReopenRound1Submit}
                disabled={isReopeningRound}
                className="comic-btn comic-btn-primary modal-save-btn"
              >
                {isReopeningRound ? 'REOPENING...' : 'CONFIRM REOPEN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
