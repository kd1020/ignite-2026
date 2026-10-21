import React from 'react';
import { ROUNDS_DATA } from '../data/eventData';
import './RoundDetails.css';

export default function RoundDetails() {
  const round1 = ROUNDS_DATA.find((r) => r.id === 'round-1');
  const round2 = ROUNDS_DATA.find((r) => r.id === 'round-2');
  const round3 = ROUNDS_DATA.find((r) => r.id === 'round-3');

  return (
    <div className="round-details-container">
      {/* ROUND 01: THE GAUNTLET */}
      <section id="gauntlet-details" className="round-detail-section r1-theme">
        <div className="container">
          <div className="detail-header-panel comic-panel">
            <div className="detail-meta">
              <span className="comic-badge comic-tag-red">DEEP DIVE:
R01</span>
              <span className="meta-tag">SPEED & AGILITY</span>
            </div>
            <h2 className="detail-title">{round1.name}</h2>
            <p className="detail-lead">{round1.details.overview}</p>

            <div className="task-notice-box">
              <span className="notice-icon">⚠</span>
              <p className="notice-text">
                <strong>OFFICIAL PROTOCOL:</strong>
{round1.details.taskNotice}
              </p>
            </div>
          </div>

          <div className="r1-grid">
            <div className="zones-diagram-card comic-panel">
              <div className="diagram-header">
                <h3 className="diagram-title">EIGHT-ZONE SECTOR
GRID</h3>
                <span className="diagram-badge">8 MIN / ZONE</span>
              </div>
              <p className="diagram-desc">Every squad cycles through
all 8 zones (A to H). Clock starts synchronously.</p>

              <div className="zone-nodes-grid">
                {round1.details.zones.map((zone) => (
                  <div key={zone.id} className="zone-node">
                    <div className="zone-node-badge">{zone.id}</div>
                    <div className="zone-node-icon">{zone.icon}</div>
                    <div className="zone-node-info">
                      <span
className="zone-node-name">{zone.name}</span>
                      <span className="zone-node-time">{zone.duration}
window</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="scoring-formula-card comic-panel">
              <div className="formula-header">
                <span className="comic-badge comic-tag-yellow">SCORING
ENGINE</span>
                <h3 className="formula-title">POSITIONAL RANKING
FORMULA</h3>
              </div>

              <div className="formula-display-box">
                <span
className="formula-text">{round1.details.scoring.formulaText}</span>
              </div>

              <div className="formula-variables">
                <h4 className="var-title">VARIABLE DEFINITIONS:</h4>
                <ul className="var-list">
                  {round1.details.scoring.variables.map((v, i) => (
                    <li key={i}>
                      <span className="var-symbol">{v.symbol}</span>
                      <span className="var-desc">=
{v.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="zero-score-rule">
                <div className="rule-badge">CRITICAL RULE</div>
                <p>{round1.details.scoring.zeroScoreCondition}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROUND 02: THE HIT LIST */}
      <section id="hitlist-details" className="round-detail-section r2-theme">
        <div className="container">
          <div className="detail-header-panel comic-panel">
            <div className="detail-meta">
              <span className="comic-badge comic-tag-cyan">DEEP DIVE:
R02</span>
              <span className="meta-tag">DIRECT COMBAT</span>
            </div>
            <h2 className="detail-title">{round2.name}</h2>
            <p
className="detail-lead">{round2.details.qualification}</p>
          </div>

          <div className="hitlist-content-wrapper">
            <div className="duels-timeline-panel comic-panel">
              <div className="duels-top">
                <h3 className="duels-title">4-SLOT DUEL TIMELINE</h3>
                <span className="duels-subtitle">Assigned fixtures
will populate automatically prior to match execution.</span>
              </div>

              <div className="duels-slots-grid">
                {round2.details.duelStructure.map((duel, index) => (
                  <div key={index} className="duel-slot-card">
                    <div className="duel-slot-header">
                      <span
className="duel-slot-number">{duel.slot}</span>
                      <span
className="duel-slot-label">{duel.label}</span>
                    </div>

                    <div className="duel-matchup-arena">
                      <div className="arena-team">YOUR SQUAD</div>
                      <div className="arena-vs">VS</div>
                      <div className="arena-opponent">OPPONENT
TBD</div>
                    </div>

                    <div className="duel-slot-status">
                      <span className="status-indicator"></span>
                      <span>{duel.status}</span>
                    </div>

                    <div className="duel-slot-stakes">
                      <span className="stake-win">WIN
{duel.pointsWin}</span>
                      <span className="stake-loss">LOSS
{duel.pointsLoss}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="r2-summary-card comic-panel">
              <h3 className="r2-card-title">COMBINED SCORING
IMPACT</h3>
              <p className="r2-card-desc">
                Your Round 2 net score is algebraically added to your
Round 1 accumulated score. High-velocity swings can propel lower seeds
straight to the top or drop early leaders.
              </p>

              <div className="r2-rules-callout">
                <div className="callout-point"><strong>WIN:</strong>
+30,000 pts per verified duel victory</div>
                <div className="callout-point"><strong>LOSS:</strong>
-30,000 pts per verified duel defeat</div>
              </div>

              <div className="r2-link-box">
                <a href="#leaderboard" className="comic-btn comic-btn-cyan r2-leaderboard-btn">
                  CHECK LEADERBOARD STANDINGS
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROUND 03: THE POWER PLAY */}
      <section id="powerplay-details" className="round-detail-section r3-theme">
        <div className="container">
          <div className="powerplay-hero-card comic-panel">
            <div className="powerplay-tag-row">
              <span className="comic-badge comic-tag-lavender">FINALE
STAGE</span>
              <span
className="status-coming-soon">{round3.details.statusLabel}</span>
            </div>
            <h2 className="powerplay-title">{round3.name}</h2>
            <div className="powerplay-quote-bubble">
              <span className="quote-mark">“</span>
              <p
className="powerplay-quote">{round3.details.headline}</p>
              <span className="quote-mark">”</span>
            </div>

            <div className="prize-pool-container">
              <div className="prize-pool-badge">STAKES & GLORY</div>
              <div
className="prize-pool-message">{round3.details.prizePoolMessage}</div>
            </div>

            <p className="powerplay-thematic-note">
              {round3.details.themeNotes} Finalists will be ushered
into an undisclosed arena where high-level venture strategy and
calculated execution dictate who takes home the crown.
            </p>

            <div className="powerplay-footer-badge">
              FULL MECHANICS REVEALED TO TOP CONTENDERS
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
