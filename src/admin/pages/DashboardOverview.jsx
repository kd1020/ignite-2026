import React, { useState, useEffect } from 'react';
        import { getDashboardOverview } from '../../services/adminService';
        import './DashboardOverview.css';


        export default function DashboardOverview({ onNavigate }) {
          const [metrics, setMetrics] = useState(null);
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState(null);


          useEffect(() => {
            async function loadData() {
              try {
                setLoading(true);
                const data = await getDashboardOverview();
                setMetrics(data);
              } catch (err) {
                setError(err.message || 'Failed to load dashboard statistics.');
              } finally {
                setLoading(false);
              }
            }
            loadData();
          }, []);
  if (loading) {
    return (
      <div className="overview-loading">
        <div className="spinner"></div>
        <p>GATHERING TOURNAMENT METRICS FROM SUPABASE...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="overview-error comic-panel">
        <span className="error-icon">⚠</span>
        <h3>DATABASE SYNC ERROR</h3>
        <p>{error}</p>
      </div>
    );
  }


  return (
    <div className="dashboard-overview-page">
      <div className="overview-header-row">
        <div>
          <span className="comic-badge comic-tag-yellow">SYSTEM
OVERVIEW</span>
          <h1 className="page-title">OPERATIONS CONTROL</h1>
        </div>


        <div className="status-indicator-box">
          <span className={`pulse-bullet ${metrics.isRegistrationOpen ?
'online' : 'offline'}`}></span>
          <span className="status-text">
            REGISTRATION {metrics.isRegistrationOpen ? 'LIVE & ACCEPTING SQUADS' : 'CLOSED'}
          </span>
        </div>
      </div>


      <div className="kpi-grid">
        <div className="kpi-card comic-panel">
          <div className="kpi-top">
            <span className="kpi-label">TOTAL TEAMS</span>
            <span className="kpi-icon">🛡</span>
          </div>
          <div className="kpi-value">{metrics.totalTeams}</div>
          <div className="kpi-footer">
            <span className="kpi-sub green">{metrics.approvedTeams}
Approved</span>
            <span className="kpi-sub yellow">{metrics.pendingTeams}
Pending</span>
          </div>
        </div>


        <div className="kpi-card comic-panel">
          <div className="kpi-top">
            <span className="kpi-label">REGISTERED PLAYERS</span>
            <span className="kpi-icon">👥</span>
          </div>
          <div className="kpi-value">{metrics.totalMembers}</div>
          <div className="kpi-footer">
            <span className="kpi-sub neutral">Rosters verified at check-
in</span>
          </div>
        </div>


        <div className="kpi-card comic-panel">
          <div className="kpi-top">
            <span className="kpi-label">ROUND 1 (GAUNTLET)
PROGRESS</span>
            <span className="kpi-icon">⏱</span>
          </div>
          <div className="kpi-value">{metrics.r1ScoresCount} <span
className="kpi-denom">/ {metrics.expectedR1Scores}</span></div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width:
`${metrics.r1CompletionPct}%` }}></div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-sub">{metrics.r1CompletionPct}% Zone
Scores Recorded</span>
          </div>
        </div>


        <div className="kpi-card comic-panel">
          <div className="kpi-top">
            <span className="kpi-label">ROUND 2 (HIT LIST) DUELS</span>
            <span className="kpi-icon">⚔</span>
          </div>
          <div className="kpi-value">{metrics.completedMatchesCount}
<span className="kpi-denom">/ {metrics.totalFixtures}</span></div>
          <div className="kpi-footer">
            <span className="kpi-sub blue">Head-to-Head verified
outcomes</span>
          </div>
        </div>
      </div>


      <div className="quick-actions-panel comic-panel">
        <h3 className="section-heading">OPERATOR ACTION SHORTCUTS</h3>
        <div className="action-buttons-group">
          <button onClick={() => onNavigate('teams')} className="comic- btn action-btn">
            REVIEW PENDING TEAMS ({metrics.pendingTeams})
          </button>
          <button onClick={() => onNavigate('r1_scoring')}
className="comic-btn action-btn bg-cyan">
            RECORD R1 ZONE TIMINGS
          </button>
          <button onClick={() => onNavigate('r2_matches')}
className="comic-btn action-btn bg-yellow">
            SUBMIT R2 DUEL OUTCOMES
          </button>
          <button onClick={() => onNavigate('leaderboard')}
className="comic-btn action-btn bg-lavender">
            INSPECT LIVE STANDINGS
          </button>
        </div>
      </div>


      <div className="recent-activity-panel comic-panel">
        <div className="panel-header-row">
          <h3 className="section-heading">RECENT ADMINISTRATIVE
LOGS</h3>
          <button onClick={() => onNavigate('audit_logs')}
className="view-all-link">
            VIEW FULL AUDIT TRAIL →
          </button>
        </div>


        <div className="activity-table-wrap">
          <table className="mini-activity-table">
            <thead>
              <tr>
                <th>ACTION</th>
                <th>ENTITY</th>
                <th>REASON / CONTEXT</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentLogs.length > 0 ? (
                metrics.recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="log-action-badge">{log.action}
</span>
                    </td>
                    <td><code>{log.entity_name} ({log.entity_id.slice(0,
8)}...)</code></td>
                    <td className="log-reason-cell">{log.reason}</td>
                    <td className="log-time-cell">{new
Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-table-cell">No
administrative changes recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
              </div>
            </div>
          );
        }
