import React from 'react';
import './Footer.css';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="ignite-footer">
      <div className="comic-tape-strip">
        <div className="tape-text-track">
          <span>★ IGNITE 2026 ★ YOUR NEXT CHAPTER STARTS HERE ★ NOT
JUST AN EVENT ★ YOUR ORIGIN STORY ★</span>
          <span>★ IGNITE 2026 ★ YOUR NEXT CHAPTER STARTS HERE ★ NOT
JUST AN EVENT ★ YOUR ORIGIN STORY ★</span>
        </div>
      </div>

      <div className="container footer-content-wrap">
        <div className="footer-top-row">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-box">IGNITE</span>
              <span className="logo-year">2026</span>
            </div>
            <p className="footer-tag">THE COMPETITIVE CAMPUS
TOURNAMENT</p>
            <p className="footer-origin-note">
              An original competitive arena where teams conquer timed
zones, duel rivals, and compete for the final prize pool.
            </p>
          </div>
          <div className="footer-links-col">
            <h4 className="footer-heading">NAVIGATION</h4>
            <ul className="footer-nav-list">
              <li><a href="#hero">Home</a></li>
              <li><a href="#intro">About Ignite</a></li>
              <li><a href="#rounds">The Rounds</a></li>
              <li><a href="#leaderboard">Leaderboard</a></li>
              <li><a href="#register">Register Team</a></li>
              <li><a href="/admin">Admin Dashboard</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading">THE ARENA</h4>
            <ul className="footer-nav-list">
              <li><a href="#gauntlet-details">Round 1: The
Gauntlet</a></li>
              <li><a href="#hitlist-details">Round 2: The Hit
List</a></li>
              <li><a href="#powerplay-details">Round 3: The Power
Play</a></li>
            </ul>
          </div>

          <div className="footer-action-col">
            <button onClick={scrollToTop} className="comic-btn to-top-btn" aria-label="Back to top">
              ▲ BACK TO TOP
            </button>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © 2026 IGNITE. All rights reserved. Original creative
styling.
          </p>
          <span className="footer-comic-badge">ISSUE #01 // VOLUME
2026</span>
        </div>
      </div>
    </footer>
  );
}
