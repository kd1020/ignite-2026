import React, { useState, useEffect, useMemo } from 'react';
import { getLeaderboard } from '../services/api';
import { LEADERBOARD_METADATA } from '../data/leaderboardData';
import './Leaderboard.css';

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('combinedScore');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getLeaderboard();
        if (isMounted) {
          setTeams(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const filteredAndSortedTeams = useMemo(() => {
    let result = teams.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        t.teamName.toLowerCase().includes(q) ||
        (t.teamNumber && t.teamNumber.toLowerCase().includes(q))
      );
    });

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'rank') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [teams, searchQuery, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  return (
    <section id="leaderboard" className="leaderboard-section">
      <div className="container">
        <div className="section-header-wrap">
          <span className="comic-badge comic-tag-cyan">LIVE GRID
STANDINGS</span>
          <h2 className="section-title">THE LEADERBOARD</h2>
          <p className="section-subtitle">
            Real-time positional rankings across all completed stages.
Track point swings and qualification thresholds.
          </p>
        </div>

        <div className="demo-notice-bar">
          <span className="demo-pulsing-dot"></span>
          <span
className="demo-notice-text">{LEADERBOARD_METADATA.noticeText}</span>
        </div>

        <div className="leaderboard-controls comic-panel">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Search by team name or team ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="comic-input search-input"
            />
          </div>

          <div className="sort-buttons-row">
            <span className="sort-label">SORT BY:</span>
            <button
              onClick={() => handleSort('combinedScore')}
              className={`sort-pill ${sortBy === 'combinedScore' ?
'active' : ''}`}
            >
              COMBINED {sortBy === 'combinedScore' && (sortOrder ===
'desc' ? '▼' : '▲')}
            </button>
            <button
              onClick={() => handleSort('round1Score')}
              className={`sort-pill ${sortBy === 'round1Score' ?
'active' : ''}`}
            >
              ROUND 1 {sortBy === 'round1Score' && (sortOrder ===
'desc' ? '▼' : '▲')}
            </button>
            <button
              onClick={() => handleSort('round2Delta')}
              className={`sort-pill ${sortBy === 'round2Delta' ?
'active' : ''}`}
            >
              ROUND 2 SWING {sortBy === 'round2Delta' && (sortOrder
=== 'desc' ? '▼' : '▲')}
            </button>
            <button
              onClick={() => handleSort('rank')}
              className={`sort-pill ${sortBy === 'rank' ? 'active' :
''}`}
            >
              RANK {sortBy === 'rank' && (sortOrder === 'asc' ? '▲' :
'▼')}
            </button>
          </div>
        </div>

        {loading && (
          <div className="leaderboard-loading">
            <div className="loading-card comic-panel">
              <span className="loading-spinner"></span>
              <p>CALCULATING TOURNAMENT STANDINGS...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="leaderboard-table-card comic-panel">
            <div className="table-responsive">
              <table className="comic-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('rank')}
className="sortable-th">
                      RANK {sortBy === 'rank' && (sortOrder === 'asc'
? '▲' : '▼')}
                    </th>
                    <th>TEAM NAME</th>
                    <th>TEAM ID</th>
                    <th onClick={() => handleSort('round1Score')}
className="sortable-th">
                      R1 (GAUNTLET) {sortBy === 'round1Score' &&
(sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('round2Delta')}
className="sortable-th">
                      R2 (HIT LIST) {sortBy === 'round2Delta' &&
(sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('combinedScore')}
className="sortable-th highlight-th">
                      COMBINED SCORE {sortBy === 'combinedScore' &&
(sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTeams.length > 0 ? (
                    filteredAndSortedTeams.map((team, idx) => {
                      const isTop3 = team.rank <= 3;
                      const r2Positive = team.round2Delta > 0;
                      const r2Negative = team.round2Delta < 0;

                      return (
                        <tr key={team.teamNumber || idx}
className={isTop3 ? 'top-team-row' : ''}>
                          <td>
                            <div className="rank-badge-wrap">
                              <span className={`rank-badge
rank-${team.rank}`}>
                                #{team.rank}
                              </span>
                            </div>
                          </td>
                          <td className="team-name-cell">
                            <strong>{team.teamName}</strong>
                            {isTop3 && <span
className="leader-star">★</span>}
                          </td>
                          <td
className="team-id-cell">{team.teamNumber || 'PENDING'}</td>
                          <td
className="score-cell">{team.round1Score.toLocaleString()} pts</td>
                          <td className="delta-cell">
                            <span
                              className={`delta-tag ${
                                r2Positive ? 'positive' : r2Negative ?
'negative' : 'neutral'
                              }`}
                            >
                              {r2Positive && '+'}
                              {team.round2Delta.toLocaleString()}
                            </span>
                          </td>
                          <td className="total-score-cell">

<strong>{team.combinedScore.toLocaleString()}</strong>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-results-td">
                        No team matches your search query. Try another
keyword.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="leaderboard-mobile-cards">
              {filteredAndSortedTeams.map((team) => (
                <div key={team.teamNumber}
className="mobile-team-card">
                  <div className="mobile-card-header">
                    <span className="rank-badge">#{team.rank}</span>
                    <span
className="mobile-team-name">{team.teamName}</span>
                    <span
className="mobile-team-id">{team.teamNumber}</span>
                  </div>
                  <div className="mobile-scores-grid">
                    <div>
                      <span className="mob-label">R1 SCORE</span>
                      <span
className="mob-val">{team.round1Score.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="mob-label">R2 DELTA</span>
                      <span className={`mob-val ${team.round2Delta > 0
? 'pos' : team.round2Delta < 0 ? 'neg' : ''}`}>
                        {team.round2Delta > 0 &&
'+'}{team.round2Delta.toLocaleString()}
                      </span>
                    </div>
                    <div className="mob-combined">
                      <span className="mob-label">COMBINED</span>
                      <span
className="mob-val-bold">{team.combinedScore.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
