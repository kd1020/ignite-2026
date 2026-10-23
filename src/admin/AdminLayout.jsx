import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import DashboardOverview from './pages/DashboardOverview';
import TeamsManager from './pages/TeamsManager';
import Round1Scoring from './pages/Round1Scoring';
import Round2Matches from './pages/Round2Matches';
import LeaderboardManager from './pages/LeaderboardManager';
import AuditLogViewer from './pages/AuditLogViewer';
import EventSettings from './pages/EventSettings';
import './AdminLayout.css';

const VALID_TABS = ['overview', 'teams', 'r1_scoring', 'r2_matches', 'leaderboard', 'audit_logs', 'settings'];

function getTabFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam && VALID_TABS.includes(tabParam)) {
    return tabParam;
  }

  const hash = window.location.hash;
  if (hash) {
    const hashQueryIndex = hash.indexOf('?');
    if (hashQueryIndex !== -1) {
      const hashParams = new URLSearchParams(hash.slice(hashQueryIndex));
      const hashTab = hashParams.get('tab');
      if (hashTab && VALID_TABS.includes(hashTab)) {
        return hashTab;
      }
    }
    for (const t of VALID_TABS) {
      if (hash.includes(t)) {
        return t;
      }
    }
  }

  return 'overview';
}

export default function AdminLayout() {
  const { isAdmin, adminProfile, loading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState(() => getTabFromLocation());

  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromLocation();
      setCurrentTab(tab);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === currentTab) return;
    setCurrentTab(tabId);

    if (window.location.pathname.startsWith('/admin')) {
      const url = new URL(window.location.href);
      if (tabId === 'overview') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tabId);
      }
      window.history.pushState({ tab: tabId }, '', url.pathname + (url.search || '') + (url.hash || ''));
    } else {
      const targetHash = tabId === 'overview' ? '#admin' : `#/admin?tab=${tabId}`;
      window.history.pushState({ tab: tabId }, '', targetHash);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>VERIFYING CREDENTIALS...</h2>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const navItems = [
    { id: 'overview', label: 'OVERVIEW', icon: '📊' },
    { id: 'teams', label: 'TEAMS & ROSTERS', icon: '👥' },
    { id: 'r1_scoring', label: 'ROUND 1 (GAUNTLET)', icon: '⏱' },
    { id: 'r2_matches', label: 'ROUND 2 (HIT LIST)', icon: '⚔' },
    { id: 'leaderboard', label: 'LEADERBOARD', icon: '🏆' },
    { id: 'audit_logs', label: 'AUDIT TRAIL', icon: '📜' },
    { id: 'settings', label: 'EVENT SETTINGS', icon: '⚙' }
  ];

  return (
    <div className="admin-dashboard-root">
      {/* Top Navbar */}
      <header className="admin-topbar">
        <div className="topbar-left">
          <div className="brand-badge">IGNITE 2026</div>
          <span className="portal-label">ADMIN CONTROLLER</span>
        </div>

        <div className="topbar-right">
          <div className="admin-info-pill">
            <span className="role-tag">{adminProfile?.role?.replace('_', ' ').toUpperCase()}</span>
            <span className="admin-name">{adminProfile?.full_name}</span>
          </div>

          <a href="/" target="_blank" rel="noreferrer" className="site-link">
            VISIT PUBLIC SITE ↗
          </a>

          <button onClick={logout} className="logout-btn" title="Sign out of administrative session">
            LOGOUT
          </button>
        </div>
      </header>

      <div className="admin-body-layout">
        {/* Sidebar Navigation */}
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`nav-tab-btn ${currentTab === item.id ? 'active' : ''}`}
              >
                <span className="tab-icon" aria-hidden="true">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="env-badge">SUPABASE SECURE</div>
            <p className="build-ver">ENGINE V2.6 // PROD</p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="admin-content-viewport">
          {currentTab === 'overview' && <DashboardOverview onNavigate={handleTabChange} />}
          {currentTab === 'teams' && <TeamsManager />}
          {currentTab === 'r1_scoring' && <Round1Scoring />}
          {currentTab === 'r2_matches' && <Round2Matches />}
          {currentTab === 'leaderboard' && <LeaderboardManager />}
          {currentTab === 'audit_logs' && <AuditLogViewer />}
          {currentTab === 'settings' && <EventSettings />}
        </main>
      </div>
    </div>
  );
}
