import React, { useState, useEffect, useMemo } from 'react';
import { getTeams, getRound1Scores, submitRound1Score,
correctRound1ScoreWithAudit } from '../../services/adminService';
import './Round1Scoring.css';


export default function Round1Scoring() {
  const [scores, setScores] = useState([]);
  const [approvedTeams, setApprovedTeams] = useState([]);
  const [selectedZone, setSelectedZone] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);


  const [formTeamId, setFormTeamId] = useState('');
  const [formZone, setFormZone] = useState('A');
  const [formPosition, setFormPosition] = useState('');
  const [formStatus, setFormStatus] = useState('verified');
  const [formMaxM, setFormMaxM] = useState(12);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctPosition, setCorrectPosition] = useState('');
  const [correctStatus, setCorrectStatus] = useState('verified');
  const [correctReason, setCorrectReason] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);


  const ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];


  const loadData = async () => {
    try {
      setLoading(true);
      const [scoresData, teamsData] = await Promise.all([
        getRound1Scores(selectedZone),
        getTeams({ statusFilter: 'approved' })
      ]);
      setScores(scoresData);
      setApprovedTeams(teamsData);
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


  return (
    <div className="r1-scoring-page">
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-yellow">TIMED SECTOR
SCORING</span>
          <h1 className="page-title">ROUND 1: THE GAUNTLET</h1>
        </div>


        <div className="formula-pill">
          <code>Score = (M - k + 1) × 1,000</code>
        </div>
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
                      <button onClick={closeCorrectionModal} className="comic-         btn modal-cancel-btn">
                        CANCEL
                      </button>
                      <button
                        onClick={handleCorrectionSubmit}
                        disabled={isCorrecting}
                        className="comic-btn comic-btn-primary modal-save-btn"
                      >
                        {isCorrecting ? 'APPLYING AUDITED REVISION...' :
        'CONFIRM CORRECTION'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
