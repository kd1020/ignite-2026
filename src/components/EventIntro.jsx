import React from 'react';
import { EVENT_INFO } from '../data/eventData';
import './EventIntro.css';

export default function EventIntro() {
  return (
    <section id="intro" className="intro-section">
      <div className="container">
        <div className="intro-grid">
          <div className="intro-main-panel comic-panel">
            <div className="panel-tape">CLASSIFIED BRIEFING</div>

            <div className="intro-header-block">
              <span className="comic-badge comic-tag-red">PROLOGUE</span>
              <h2
className="intro-heading">{EVENT_INFO.intro.heading}</h2>
            </div>

            <p className="intro-lead-text">
              {EVENT_INFO.intro.body}
            </p>

            <div className="intro-pillars">
              <div className="pillar-card">
                <div className="pillar-icon-box bg-yellow">
                  <span className="pillar-glyph">⚡</span>
                </div>
                <div className="pillar-info">
                  <h3 className="pillar-title">CHALLENGE</h3>
                  <p className="pillar-desc">Multi-disciplinary zone
tasks requiring rapid logic, speed, and execution.</p>
                </div>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box bg-cyan">
                  <span className="pillar-glyph">⚔</span>
                </div>
                <div className="pillar-info">
                  <h3 className="pillar-title">CLASH</h3>
                  <p className="pillar-desc">Direct head-to-head duels
where tactical decisions yield massive swings.</p>
                </div>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box bg-lavender">
                  <span className="pillar-glyph">👑</span>
                </div>
                <div className="pillar-info">
                  <h3 className="pillar-title">CONQUER</h3>
                  <p className="pillar-desc">Advance through
tournament stages to seize the championship prize pool.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="intro-side-panel">
            <div className="comic-burst-container">
              <div className="comic-burst">
                <span className="burst-text">READY?</span>
              </div>
              <div className="comic-speech-bubble">
                <p className="speech-quote">"EVERY LEGEND HAS AN ORIGIN. WRITE YOURS ON THE BOARD."</p>
                <div className="speech-tail"></div>
              </div>
            </div>

            <div className="comic-stamp-card comic-panel">
              <div className="stamp-title">MISSION PARAMETERS</div>
              <ul className="stamp-list">
                <li><span className="stamp-bullet">▶</span>
Squad-Based Competition</li>
                <li><span className="stamp-bullet">▶</span> Real-Time
Score Tracking</li>
                <li><span className="stamp-bullet">▶</span> Zero Room
For Excuses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
