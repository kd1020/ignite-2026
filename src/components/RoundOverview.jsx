import React from 'react';
import { ROUNDS_DATA } from '../data/eventData';
import './RoundOverview.css';

export default function RoundOverview() {
  return (
    <section id="rounds" className="rounds-overview-section">
      <div className="container">
        <div className="section-header-wrap">
          <span className="comic-badge comic-tag-yellow">TOURNAMENT
MATRIX</span>
          <h2 className="section-title">CHOOSE YOUR BATTLE.</h2>
          <p className="section-subtitle">
            Three progressive stages of high-octane competition.
Master the zones, survive the duels, and claim your place in the final
power arena.
          </p>
        </div>

        <div className="rounds-card-grid">
          {ROUNDS_DATA.map((round) => {
            const isRound1 = round.id === 'round-1';
            const isRound2 = round.id === 'round-2';
            const isRound3 = round.id === 'round-3';

            return (
              <div
                key={round.id}
                className={`round-card comic-panel ${round.id}`}
                style={{
                  '--card-accent': round.accentColor,
                  '--card-badge-bg': round.badgeColor
                }}
              >
                <div className="card-top-bar">
                  <span
className="round-number-pill">{round.number}</span>
                  <span className="round-mode-tag">
                    {isRound1 && "TIME TRIAL"}
                    {isRound2 && "1v1 DUEL"}
                    {isRound3 && "FINALS PREVIEW"}
                  </span>
                </div>

                <h3 className="round-card-title">{round.name}</h3>
                <div
className="round-card-tagline">{round.tagline}</div>

                <ul className="round-instructions-list">
                  {round.instructions.map((line, idx) => (
                    <li key={idx} className="instruction-item">
                      <span className="instruction-check"
aria-hidden="true">▸</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                {isRound1 && (
                  <div className="card-preview-callout round-1-callout">
                    <div className="callout-label">FORMULA
PREVIEW</div>
                    <code className="callout-formula">Score = (M - k +
1) × 1,000</code>
                  </div>
                )}

                {isRound2 && (
                  <div className="card-preview-callout round-2-callout">
                    <div className="callout-label">POINT SWINGS</div>
                    <div className="duel-delta-badges">
                      <span className="delta-win">WIN +30K</span>
                      <span className="delta-loss">LOSS -30K</span>
                    </div>
                  </div>
                )}

                {isRound3 && (
                  <div className="card-preview-callout round-3-callout">
                    <div className="callout-label">PRIZE POOL</div>
                    <div
className="power-prize-text">{round.details.prizePoolMessage}</div>
                  </div>
                )}

                <div className="card-footer-action">
                  <a href={`#${round.anchor}-details`}
className="comic-btn round-detail-btn">
                    VIEW ROUND DETAILS
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
