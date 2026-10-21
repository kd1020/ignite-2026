import React, { useState } from 'react';
import './Hero.css';

export default function Hero() {
  const [videoError, setVideoError] = useState(false);

  return (
    <section id="hero" className="hero-section">
      <div className={`video-container ${videoError ? 'has-fallback' :
''}`}>
        <video
          className="hero-video"
          src="/video.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
          aria-hidden="true"
        >
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-halftone"></div>
      </div>

      <div className="hero-corner-sticker top-left">CHAPTER 01</div>
      <div className="hero-corner-sticker top-right">BATTLE
READY</div>

      <div className="hero-content-wrapper">
        <div className="hero-badge-wrap">
          <span className="hero-eyebrow-badge">ANNUAL CAMPUS
ARENA</span>
        </div>

        <h1 className="hero-title">
          <span className="hero-title-word">IGNITE</span>
          <span className="hero-title-year">2026</span>
        </h1>

        <div className="hero-tagline-container">
          <h2 className="hero-headline">YOUR NEXT CHAPTER STARTS
HERE.</h2>
          <p className="hero-subline">NOT JUST AN EVENT. YOUR ORIGIN
STORY.</p>
        </div>

        <div className="hero-cta-group">
          <a href="#register" className="hero-primary-btn">
            <span className="btn-inner">ENTER NOW</span>
            <span className="btn-sparkle" aria-hidden="true">★</span>
          </a>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <a href="#intro" className="scroll-link" aria-label="Scroll down to explore IGNITE 2026">
          <span className="scroll-caption">EXPLORE THE ARENA</span>
          <div className="scroll-comic-arrow">
            <span></span>
            <span></span>
          </div>
        </a>
      </div>
    </section>
  );
}
