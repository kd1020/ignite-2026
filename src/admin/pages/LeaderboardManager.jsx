import React, { useState, useEffect, useMemo } from 'react';
        import { getPublicLeaderboard } from '../../services/publicService';
        import './LeaderboardManager.css';


        export default function LeaderboardManager() {
          const [standings, setStandings] = useState([]);
          const [loading, setLoading] = useState(true);
          const [searchQuery, setSearchQuery] = useState('');
          const [notification, setNotification] = useState(null);


          const fetchStandings = async () => {
            try {
              setLoading(true);
              const data = await getPublicLeaderboard();
              setStandings(data);
            } catch (err) {
              setNotification({ type: 'error', message: err.message || 'Failed         to sync live standings.' });
            } finally {
              setLoading(false);
            }
          };


          useEffect(() => {
            fetchStandings();
          }, []);


          const rankOccurrences = useMemo(() => {
            const map = {};
            standings.forEach((t) => {
              map[t.rank] = (map[t.rank] || 0) + 1;
            });
            return map;
          }, [standings]);


          const filteredStandings = useMemo(() => {
    if (!searchQuery.trim()) return standings;
    const q = searchQuery.toLowerCase().trim();
    return standings.filter(
      (t) =>
        t.team_name.toLowerCase().includes(q) ||
        (t.team_number && t.team_number.toLowerCase().includes(q))
    );
  }, [standings, searchQuery]);


  return (
    <div className="leaderboard-manager-page">
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-yellow">STANDINGS
ENGINE</span>
          <h1 className="page-title">TOURNAMENT LEADERBOARD</h1>
        </div>


        <div className="header-actions">
          <button onClick={fetchStandings} className="comic-btn refresh- btn">
            🔄 RE-SYNC LIVE TOTALS
          </button>
        </div>
      </div>


      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}
className="notif-close">✕</button>
        </div>
      )}


      <div className="tie-notice-banner comic-panel">
        <span className="info-icon">ℹ</span>
        <div className="notice-body">
          <strong>DATABASE SCORING INTEGRITY:</strong> Ranks are
computed deterministically via PostgreSQL dense ranking based on
Combined Points (Round 1 + Round 2 Net Swings). No fictional tie-
breaking criteria are applied; tied squads share the same rank.
        </div>
      </div>


      <div className="controls-bar comic-panel">
        <input
          type="text"
          placeholder="Filter standings by squad name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="comic-input search-input"
        />
        <div className="stats-pill">
          {standings.length} APPROVED SQUADS ON GRID
        </div>
      </div>


      <div className="standings-table-card comic-panel">
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>AGGREGATING SECTOR AND DUEL TOTALS...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>SQUAD NAME</th>
                  <th>TEAM ID</th>
                  <th>ROUND 1 (GAUNTLET)</th>
                  <th>ROUND 2 (HIT LIST SWING)</th>
                  <th>COMBINED SCORE</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandings.length > 0 ? (
                  filteredStandings.map((team) => {
                    const isTied = (rankOccurrences[team.rank] || 0) >
1;
                    const r2Positive = team.round2_delta > 0;
                    const r2Negative = team.round2_delta < 0;


                    return (
                      <tr key={team.team_id} className={team.rank <= 3 ?
'top-rank-row' : ''}>
                        <td>
                          <div className="rank-display">
                            <span className={`rank-badge
rank-${team.rank}`}>
                              #{team.rank}
                            </span>
                            {isTied && <span className="tie- badge">TIED</span>}
                          </div>
                        </td>
                        <td className="team-name-cell">
                          <strong>{team.team_name}</strong>
                          {team.rank === 1 && <span className="crown- icon"> 👑</span>}
                        </td>
                        <td>
                          <span className="team-id-badge">
{team.team_number || 'PENDING'}</span>
                        </td>
                        <td>{team.round1_score.toLocaleString()}
pts</td>
                        <td>
                          <span
                            className={`delta-tag ${
                              r2Positive ? 'positive' : r2Negative ?
'negative' : 'neutral'
                            }`}
                          >
                            {r2Positive && '+'}
{team.round2_delta.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <strong className="combined-pts">
{team.combined_score.toLocaleString()} PTS</strong>
                        </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="empty-state-cell">
                              No approved squads match your search query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        }
