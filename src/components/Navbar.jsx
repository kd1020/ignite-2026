import React, { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className={`ignite-navbar ${isScrolled ? 'scrolled' : 'transparent'} ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <a href="#hero" className="navbar-logo" onClick={closeMenu}>
          <div className="logo-badge">IGNITE</div>
          <span className="logo-year">2026</span>
        </a>

        <div className="nav-links-desktop">
          <a href="#hero" className="nav-link">Home</a>
          <a href="#rounds" className="nav-link">The Rounds</a>
          <a href="#leaderboard" className="nav-link">Leaderboard</a>
          <a href="/admin" className="nav-link nav-admin-link">Admin</a>
          <a href="#register" className="nav-btn-link">
            <span className="nav-register-btn">REGISTER</span>
          </a>
        </div>

        <button
          className={`mobile-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>

      <div className={`mobile-drawer ${isMobileMenuOpen ? 'active' : ''}`} aria-hidden={!isMobileMenuOpen}>
        <div className="mobile-drawer-inner">
          <a href="#hero" className="mobile-link" onClick={closeMenu}>Home</a>
          <a href="#intro" className="mobile-link" onClick={closeMenu}>About</a>
          <a href="#rounds" className="mobile-link" onClick={closeMenu}>The Rounds</a>
          <a href="#leaderboard" className="mobile-link" onClick={closeMenu}>Leaderboard</a>
          <a href="/admin" className="mobile-link nav-admin-mobile-link" onClick={closeMenu}>Admin Portal ↗</a>
          <a href="#register" className="mobile-register-btn" onClick={closeMenu}>REGISTER NOW</a>
        </div>
      </div>
    </nav>
  );
}
